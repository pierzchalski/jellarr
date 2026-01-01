import { promises as fs } from "fs";
import path from "path";
import YAML from "yaml";
import { calculateSystemDiff, applySystem } from "../apply/system";
import {
  calculateEncodingDiff,
  applyEncoding,
} from "../apply/encoding-options";
import { calculateLibraryDiff, applyLibrary } from "../apply/library";
import {
  calculateBrandingOptionsDiff,
  applyBrandingOptions,
} from "../apply/branding-options";
import {
  calculateNewUsersDiff,
  applyNewUsers,
  calculateUserPoliciesDiff,
  applyUserPolicies,
} from "../apply/users";
import type { VirtualFolderInfoSchema } from "../types/schema/library";
import type { LibraryConfig } from "../types/config/library";
import { type ServerConfigurationSchema } from "../types/schema/system";
import { type EncodingOptionsSchema } from "../types/schema/encoding-options";
import { type BrandingOptionsDtoSchema } from "../types/schema/branding-options";
import type { UserDtoSchema, UserPolicySchema } from "../types/schema/users";
import type { UserConfig } from "../types/config/users";
import {
  createJellyfinClient,
  createBootstrapClient,
  type BootstrapClient,
} from "../api/jellyfin_client";
import { type JellyfinClient } from "../api/jellyfin.types";
import {
  RootConfigType,
  type RootConfig,
  type AdminConfig,
  type ApiKeyConfig,
} from "../types/config/root";
import type {
  AuthenticationInfoSchema,
  AuthenticationResultSchema,
  AuthenticationInfoQueryResultSchema,
} from "../types/schema/bootstrap";
import { type ZodSafeParseResult, type z } from "zod";

async function ensureDirectory(filePath: string): Promise<void> {
  const dir: string = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

async function loadApiKeyFromFile(filePath: string): Promise<string | null> {
  try {
    const content: string = await fs.readFile(filePath, "utf8");
    const key: string = content.trim();
    return key.length > 0 ? key : null;
  } catch {
    return null;
  }
}

async function performBootstrap(
  baseUrl: string,
  admin: AdminConfig,
  apiKeyConfig: ApiKeyConfig,
): Promise<string> {
  const adminPassword: string =
    admin.password ??
    (await fs.readFile(admin.password_file as string, "utf8")).trim();

  const client: BootstrapClient = createBootstrapClient(baseUrl);

  console.log("→ bootstrapping Jellyfin instance");

  console.log("  → creating admin user");
  await client.updateStartupUser({
    Name: admin.username,
    Password: adminPassword,
  });
  console.log(`  ✓ created admin user "${admin.username}"`);

  console.log("  → completing startup wizard");
  await client.completeStartupWizard();
  console.log("  ✓ startup wizard complete");

  console.log("  → authenticating as admin user");
  const authResult: AuthenticationResultSchema = await client.authenticateByName(
    admin.username,
    adminPassword,
  );

  if (!authResult.AccessToken) {
    throw new Error("Authentication succeeded but no access token was returned");
  }
  console.log("  ✓ authenticated successfully");

  const apiKeyName: string = apiKeyConfig.name;
  console.log(`  → checking for existing API key "${apiKeyName}"`);

  const existingKeys: AuthenticationInfoQueryResultSchema =
    await client.getApiKeys(authResult.AccessToken);
  const existingKey: AuthenticationInfoSchema | undefined =
    existingKeys.Items?.find(
      (key: AuthenticationInfoSchema) => key.AppName === apiKeyName,
    );

  let apiKey: string;

  if (existingKey?.AccessToken) {
    console.log(`  ✓ API key "${apiKeyName}" already exists`);
    apiKey = existingKey.AccessToken;
  } else {
    console.log(`  → creating API key "${apiKeyName}"`);
    await client.createApiKey(authResult.AccessToken, apiKeyName);

    const updatedKeys: AuthenticationInfoQueryResultSchema =
      await client.getApiKeys(authResult.AccessToken);
    const newKey: AuthenticationInfoSchema | undefined =
      updatedKeys.Items?.find(
        (key: AuthenticationInfoSchema) => key.AppName === apiKeyName,
      );

    if (!newKey?.AccessToken) {
      throw new Error("API key was created but could not be retrieved");
    }

    apiKey = newKey.AccessToken;
    console.log("  ✓ API key created");
  }

  console.log(`  → writing API key to "${apiKeyConfig.file}"`);
  await ensureDirectory(apiKeyConfig.file);
  await fs.writeFile(apiKeyConfig.file, apiKey + "\n", { mode: 0o600 });
  console.log("  ✓ API key written to file");

  console.log("✓ bootstrap complete");

  return apiKey;
}

async function resolveApiKey(
  cfg: RootConfig,
): Promise<string> {
  // 1. Check environment variable
  const envApiKey: string | undefined = process.env.JELLARR_API_KEY;
  if (envApiKey) {
    console.log("✓ using API key from JELLARR_API_KEY environment variable");
    return envApiKey;
  }

  // 2. Check api_key.file if configured
  if (cfg.api_key) {
    const fileApiKey: string | null = await loadApiKeyFromFile(cfg.api_key.file);
    if (fileApiKey) {
      console.log(`✓ using API key from file: ${cfg.api_key.file}`);
      return fileApiKey;
    }
  }

  // 3. If admin config is present, attempt bootstrap
  if (cfg.admin && cfg.api_key) {
    console.log("→ no API key found, attempting bootstrap...");
    return performBootstrap(cfg.base_url, cfg.admin, cfg.api_key);
  }

  // 4. No API key available
  throw new Error(
    "No API key available. Either:\n" +
    "  - Set JELLARR_API_KEY environment variable, or\n" +
    "  - Configure api_key.file with an existing API key file, or\n" +
    "  - Configure admin and api_key sections to bootstrap automatically",
  );
}

export async function runPipeline(configPath: string): Promise<void> {
  const raw: string = await fs.readFile(configPath, "utf8");

  const validationResult: ZodSafeParseResult<RootConfig> =
    RootConfigType.safeParse(YAML.parse(raw));
  if (!validationResult.success) {
    const errorMessages: string = validationResult.error.issues
      .map((err: z.core.$ZodIssue) => `${err.path.join(".")}: ${err.message}`)
      .join("\n");
    throw new Error(`Configuration validation failed:\n${errorMessages}`);
  }

  const cfg: RootConfig = validationResult.data;

  const apiKey: string = await resolveApiKey(cfg);

  const jellyfinClient: JellyfinClient = createJellyfinClient(
    cfg.base_url,
    apiKey,
  );

  const currentServerConfigurationSchema: ServerConfigurationSchema =
    await jellyfinClient.getSystemConfiguration();

  const updatedServerConfigurationSchema:
    | ServerConfigurationSchema
    | undefined = calculateSystemDiff(
    currentServerConfigurationSchema,
    cfg.system,
  );

  if (updatedServerConfigurationSchema) {
    console.log("→ updating system config");
    await applySystem(jellyfinClient, updatedServerConfigurationSchema);
    console.log("✓ updated system config");
  } else {
    console.log("✓ system config already up to date");
  }

  if (cfg.encoding) {
    const currentEncodingOptionsSchema: EncodingOptionsSchema =
      await jellyfinClient.getEncodingConfiguration();

    const updatedEncodingOptionsSchema: EncodingOptionsSchema | undefined =
      calculateEncodingDiff(currentEncodingOptionsSchema, cfg.encoding);

    if (updatedEncodingOptionsSchema) {
      console.log("→ updating encoding config");
      await applyEncoding(jellyfinClient, updatedEncodingOptionsSchema);
      console.log("✓ updated encoding config");
    } else {
      console.log("✓ encoding config already up to date");
    }
  }

  if (cfg.library) {
    const currentVirtualFolders: VirtualFolderInfoSchema[] =
      await jellyfinClient.getVirtualFolders();
    const updatedLibraryConfig: LibraryConfig | undefined =
      calculateLibraryDiff(currentVirtualFolders, cfg.library);

    if (updatedLibraryConfig) {
      console.log("→ updating library config");
      await applyLibrary(jellyfinClient, updatedLibraryConfig);
      console.log("✓ updated library config");
    } else {
      console.log("✓ library config already up to date");
    }
  }

  if (cfg.branding) {
    const currentBrandingSchema: BrandingOptionsDtoSchema =
      await jellyfinClient.getBrandingConfiguration();

    const updatedBrandingSchema: BrandingOptionsDtoSchema | undefined =
      calculateBrandingOptionsDiff(currentBrandingSchema, cfg.branding);

    if (updatedBrandingSchema) {
      console.log("→ updating branding config");
      await applyBrandingOptions(jellyfinClient, updatedBrandingSchema);
      console.log("✓ updated branding config");
    } else {
      console.log("✓ branding config already up to date");
    }
  }

  if (cfg.users) {
    let currentUsers: UserDtoSchema[] = await jellyfinClient.getUsers();

    const usersToCreate: UserConfig[] | undefined = calculateNewUsersDiff(
      currentUsers,
      cfg.users,
    );

    if (usersToCreate) {
      console.log("→ creating users");
      await applyNewUsers(jellyfinClient, usersToCreate);
      console.log("✓ created users");
      currentUsers = await jellyfinClient.getUsers();
    }

    const userPoliciesToUpdate: Map<string, UserPolicySchema> | undefined =
      calculateUserPoliciesDiff(currentUsers, cfg.users);

    if (userPoliciesToUpdate) {
      console.log("→ updating user policies");
      await applyUserPolicies(jellyfinClient, userPoliciesToUpdate);
      console.log("✓ updated user policies");
    } else {
      console.log("✓ user policies already up to date");
    }
  }

  if (cfg.startup?.completeStartupWizard) {
    console.log("→ marking startup wizard as complete");
    await jellyfinClient.completeStartupWizard();
    console.log("✓ marked startup wizard as complete");
  }
}
