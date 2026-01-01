import { promises as fs } from "fs";
import YAML from "yaml";
import {
  createBootstrapClient,
  type BootstrapClient,
} from "../api/jellyfin_client";
import {
  BootstrapConfigType,
  type BootstrapConfig,
} from "../types/config/bootstrap";
import type {
  AuthenticationInfoSchema,
  AuthenticationResultSchema,
  AuthenticationInfoQueryResultSchema,
} from "../types/schema/bootstrap";
import { type ZodSafeParseResult, type z } from "zod";

export interface BootstrapResult {
  apiKey: string;
  adminUsername: string;
}

export async function runBootstrap(
  baseUrl: string,
  configPath: string,
): Promise<BootstrapResult> {
  const raw: string = await fs.readFile(configPath, "utf8");

  const validationResult: ZodSafeParseResult<BootstrapConfig> =
    BootstrapConfigType.safeParse(YAML.parse(raw));
  if (!validationResult.success) {
    const errorMessages: string = validationResult.error.issues
      .map((err: z.core.$ZodIssue) => `${err.path.join(".")}: ${err.message}`)
      .join("\n");
    throw new Error(`Bootstrap configuration validation failed:\n${errorMessages}`);
  }

  const cfg: BootstrapConfig = validationResult.data;

  const adminPassword: string =
    cfg.adminUser.password ??
    (await fs.readFile(cfg.adminUser.passwordFile as string, "utf8")).trim();

  const client: BootstrapClient = createBootstrapClient(baseUrl);

  console.log("→ configuring startup wizard");

  if (cfg.serverName) {
    await client.updateStartupConfiguration({
      ServerName: cfg.serverName,
    });
    console.log(`  ✓ set server name to "${cfg.serverName}"`);
  }

  console.log("→ creating admin user");
  await client.updateStartupUser({
    Name: cfg.adminUser.name,
    Password: adminPassword,
  });
  console.log(`  ✓ created admin user "${cfg.adminUser.name}"`);

  if (cfg.remoteAccess) {
    console.log("→ configuring remote access");
    await client.setRemoteAccess({
      EnableRemoteAccess: cfg.remoteAccess.enableRemoteAccess,
      EnableAutomaticPortMapping: cfg.remoteAccess.enableAutomaticPortMapping,
    });
    console.log("  ✓ configured remote access");
  }

  console.log("→ completing startup wizard");
  await client.completeStartupWizard();
  console.log("  ✓ startup wizard complete");

  console.log("→ authenticating as admin user");
  const authResult: AuthenticationResultSchema = await client.authenticateByName(
    cfg.adminUser.name,
    adminPassword,
  );

  if (!authResult.AccessToken) {
    throw new Error("Authentication succeeded but no access token was returned");
  }
  console.log("  ✓ authenticated successfully");

  const apiKeyName: string = cfg.apiKey.name;
  console.log(`→ checking for existing API key "${apiKeyName}"`);

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
    console.log(`→ creating API key "${apiKeyName}"`);
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

  console.log(`→ writing API key to "${cfg.apiKey.outputFile}"`);
  await fs.writeFile(cfg.apiKey.outputFile, apiKey + "\n", { mode: 0o600 });
  console.log("  ✓ API key written to file");

  console.log("✓ bootstrap complete");

  return {
    apiKey,
    adminUsername: cfg.adminUser.name,
  };
}
