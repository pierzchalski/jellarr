import type { ServerConfigurationSchema } from "../types/schema/system";
import type { EncodingOptionsSchema } from "../types/schema/encoding-options";
import type {
  VirtualFolderInfoSchema,
  AddVirtualFolderDtoSchema,
  CollectionTypeSchema,
} from "../types/schema/library";
import type { BrandingOptionsDtoSchema } from "../types/schema/branding-options";
import type {
  UserDtoSchema,
  CreateUserByNameSchema,
  UserPolicySchema,
} from "../types/schema/users";
import type {
  StartupConfigurationDtoSchema,
  StartupUserDtoSchema,
  StartupRemoteAccessDtoSchema,
  AuthenticationResultSchema,
  AuthenticationInfoQueryResultSchema,
} from "../types/schema/bootstrap";
import type {
  JellyfinClient,
  GetSystemConfigurationResponse,
  PostSystemConfigurationResponse,
  GetEncodingConfigurationResponse,
  PostEncodingConfigurationResponse,
  GetVirtualFoldersResponse,
  PostVirtualFolderResponse,
  GetBrandingConfigurationResponse,
  PostBrandingConfigurationResponse,
  GetUsersResponse,
  PostNewUserResponse,
  PostUserPolicyResponse,
  PostStartupCompleteResponse,
  GetStartupConfigurationResponse,
  PostStartupConfigurationResponse,
  GetStartupUserResponse,
  PostStartupUserResponse,
  PostStartupRemoteAccessResponse,
  PostAuthenticateByNameResponse,
  GetApiKeysResponse,
  PostCreateApiKeyResponse,
} from "./jellyfin.types";
import { makeClient, makeUnauthenticatedClient } from "./client";
import type { paths } from "../../generated/schema";
import type { Client } from "openapi-fetch";

export interface BootstrapClient {
  getStartupConfiguration(): Promise<StartupConfigurationDtoSchema>;
  updateStartupConfiguration(
    body: StartupConfigurationDtoSchema,
  ): Promise<void>;
  getStartupUser(): Promise<StartupUserDtoSchema>;
  updateStartupUser(body: StartupUserDtoSchema): Promise<void>;
  setRemoteAccess(body: StartupRemoteAccessDtoSchema): Promise<void>;
  completeStartupWizard(): Promise<void>;
  authenticateByName(
    username: string,
    password: string,
  ): Promise<AuthenticationResultSchema>;
  getApiKeys(accessToken: string): Promise<AuthenticationInfoQueryResultSchema>;
  createApiKey(accessToken: string, appName: string): Promise<void>;
}

export function createJellyfinClient(
  baseUrl: string,
  apiKey: string,
): JellyfinClient {
  const client: Client<paths> = makeClient(baseUrl, apiKey);

  return {
    async getSystemConfiguration(): Promise<ServerConfigurationSchema> {
      const res: GetSystemConfigurationResponse = await client.GET(
        "/System/Configuration",
      );

      if (res.error) {
        throw new Error(
          `GET /System/Configuration failed: ${res.response.status.toString()}`,
        );
      }

      return res.data as ServerConfigurationSchema;
    },

    async updateSystemConfiguration(
      body: Partial<ServerConfigurationSchema>,
    ): Promise<void> {
      const res: PostSystemConfigurationResponse = await client.POST(
        "/System/Configuration",
        {
          body,
          headers: { "content-type": "application/json" },
        },
      );

      if (res.error) {
        throw new Error(
          `POST /System/Configuration failed: ${res.response.status.toString()}`,
        );
      }
    },

    async getEncodingConfiguration(): Promise<EncodingOptionsSchema> {
      const res: GetEncodingConfigurationResponse = await client.GET(
        "/System/Configuration/{key}",
        {
          params: { path: { key: "encoding" } },
        },
      );

      if (res.error) {
        throw new Error(
          `GET /System/Configuration/encoding failed: ${res.response.status.toString()}`,
        );
      }

      return res.data as EncodingOptionsSchema;
    },

    async updateEncodingConfiguration(
      body: Partial<EncodingOptionsSchema>,
    ): Promise<void> {
      const res: PostEncodingConfigurationResponse = await client.POST(
        "/System/Configuration/{key}",
        {
          params: { path: { key: "encoding" } },
          body,
          headers: { "content-type": "application/json" },
        },
      );

      if (res.error) {
        throw new Error(
          `POST /System/Configuration/encoding failed: ${res.response.status.toString()}`,
        );
      }
    },

    async getVirtualFolders(): Promise<VirtualFolderInfoSchema[]> {
      const res: GetVirtualFoldersResponse = await client.GET(
        "/Library/VirtualFolders",
      );

      if (res.error) {
        throw new Error(
          `GET /Library/VirtualFolders failed: ${res.response.status.toString()}`,
        );
      }

      return res.data as VirtualFolderInfoSchema[];
    },

    async addVirtualFolder(
      name: string,
      collectionType: CollectionTypeSchema | undefined,
      body: AddVirtualFolderDtoSchema,
    ): Promise<void> {
      const res: PostVirtualFolderResponse = await client.POST(
        "/Library/VirtualFolders",
        {
          params: {
            query: {
              name,
              collectionType,
              refreshLibrary: true,
            },
          },
          body,
          headers: { "content-type": "application/json" },
        },
      );

      if (res.error) {
        throw new Error(
          `POST /Library/VirtualFolders failed: ${res.response.status.toString()}`,
        );
      }
    },

    async getBrandingConfiguration(): Promise<BrandingOptionsDtoSchema> {
      const res: GetBrandingConfigurationResponse = await client.GET(
        "/System/Configuration/{key}",
        {
          params: {
            path: {
              key: "Branding",
            },
          },
        },
      );

      if (res.error) {
        throw new Error(
          `GET /System/Configuration/Branding failed: ${res.response.status.toString()}`,
        );
      }

      return res.data as BrandingOptionsDtoSchema;
    },

    async updateBrandingConfiguration(
      body: Partial<BrandingOptionsDtoSchema>,
    ): Promise<void> {
      const res: PostBrandingConfigurationResponse = await client.POST(
        "/System/Configuration/Branding",
        {
          body: body as BrandingOptionsDtoSchema,
        },
      );

      if (res.error) {
        throw new Error(
          `POST /System/Configuration/Branding failed: ${res.response.status.toString()}`,
        );
      }
    },

    async getUsers(): Promise<UserDtoSchema[]> {
      const res: GetUsersResponse = await client.GET("/Users");

      if (res.error) {
        throw new Error(`GET /Users failed: ${res.response.status.toString()}`);
      }

      return res.data as UserDtoSchema[];
    },

    async createUser(body: CreateUserByNameSchema): Promise<void> {
      const res: PostNewUserResponse = await client.POST("/Users/New", {
        body,
      });

      if (res.error) {
        throw new Error(
          `POST /Users/New failed: ${res.response.status.toString()}`,
        );
      }
    },

    async updateUserPolicy(
      userId: string,
      body: UserPolicySchema,
    ): Promise<void> {
      const res: PostUserPolicyResponse = await client.POST(
        "/Users/{userId}/Policy",
        {
          params: { path: { userId } },
          body,
          headers: { "content-type": "application/json" },
        },
      );

      if (res.error) {
        throw new Error(
          `POST /Users/{userId}/Policy failed: ${res.response.status.toString()}`,
        );
      }
    },

    async completeStartupWizard(): Promise<void> {
      const res: PostStartupCompleteResponse =
        await client.POST("/Startup/Complete");

      if (res.error) {
        throw new Error(
          `POST /Startup/Complete failed: ${res.response.status.toString()}`,
        );
      }
    },

    async getStartupConfiguration(): Promise<StartupConfigurationDtoSchema> {
      const res: GetStartupConfigurationResponse = await client.GET(
        "/Startup/Configuration",
      );

      if (res.error) {
        throw new Error(
          `GET /Startup/Configuration failed: ${res.response.status.toString()}`,
        );
      }

      return res.data as StartupConfigurationDtoSchema;
    },

    async updateStartupConfiguration(
      body: StartupConfigurationDtoSchema,
    ): Promise<void> {
      const res: PostStartupConfigurationResponse = await client.POST(
        "/Startup/Configuration",
        {
          body,
          headers: { "content-type": "application/json" },
        },
      );

      if (res.error) {
        throw new Error(
          `POST /Startup/Configuration failed: ${res.response.status.toString()}`,
        );
      }
    },

    async getStartupUser(): Promise<StartupUserDtoSchema> {
      const res: GetStartupUserResponse = await client.GET("/Startup/User");

      if (res.error) {
        throw new Error(
          `GET /Startup/User failed: ${res.response.status.toString()}`,
        );
      }

      return res.data as StartupUserDtoSchema;
    },

    async updateStartupUser(body: StartupUserDtoSchema): Promise<void> {
      const res: PostStartupUserResponse = await client.POST("/Startup/User", {
        body,
        headers: { "content-type": "application/json" },
      });

      if (res.error) {
        throw new Error(
          `POST /Startup/User failed: ${res.response.status.toString()}`,
        );
      }
    },

    async setRemoteAccess(body: StartupRemoteAccessDtoSchema): Promise<void> {
      const res: PostStartupRemoteAccessResponse = await client.POST(
        "/Startup/RemoteAccess",
        {
          body,
          headers: { "content-type": "application/json" },
        },
      );

      if (res.error) {
        throw new Error(
          `POST /Startup/RemoteAccess failed: ${res.response.status.toString()}`,
        );
      }
    },

    async authenticateByName(
      username: string,
      password: string,
    ): Promise<AuthenticationResultSchema> {
      const res: PostAuthenticateByNameResponse = await client.POST(
        "/Users/AuthenticateByName",
        {
          body: {
            Username: username,
            Pw: password,
          },
          headers: { "content-type": "application/json" },
        },
      );

      if (res.error) {
        throw new Error(
          `POST /Users/AuthenticateByName failed: ${res.response.status.toString()}`,
        );
      }

      return res.data as AuthenticationResultSchema;
    },

    async getApiKeys(): Promise<AuthenticationInfoQueryResultSchema> {
      const res: GetApiKeysResponse = await client.GET("/Auth/Keys");

      if (res.error) {
        throw new Error(
          `GET /Auth/Keys failed: ${res.response.status.toString()}`,
        );
      }

      return res.data as AuthenticationInfoQueryResultSchema;
    },

    async createApiKey(appName: string): Promise<void> {
      const res: PostCreateApiKeyResponse = await client.POST("/Auth/Keys", {
        params: {
          query: {
            app: appName,
          },
        },
      });

      if (res.error) {
        throw new Error(
          `POST /Auth/Keys failed: ${res.response.status.toString()}`,
        );
      }
    },
  };
}

export function createBootstrapClient(baseUrl: string): BootstrapClient {
  const client: Client<paths> = makeUnauthenticatedClient(baseUrl);

  return {
    async getStartupConfiguration(): Promise<StartupConfigurationDtoSchema> {
      const res: GetStartupConfigurationResponse = await client.GET(
        "/Startup/Configuration",
      );

      if (res.error) {
        throw new Error(
          `GET /Startup/Configuration failed: ${res.response.status.toString()}`,
        );
      }

      return res.data as StartupConfigurationDtoSchema;
    },

    async updateStartupConfiguration(
      body: StartupConfigurationDtoSchema,
    ): Promise<void> {
      const res: PostStartupConfigurationResponse = await client.POST(
        "/Startup/Configuration",
        {
          body,
          headers: { "content-type": "application/json" },
        },
      );

      if (res.error) {
        throw new Error(
          `POST /Startup/Configuration failed: ${res.response.status.toString()}`,
        );
      }
    },

    async getStartupUser(): Promise<StartupUserDtoSchema> {
      const res: GetStartupUserResponse = await client.GET("/Startup/User");

      if (res.error) {
        throw new Error(
          `GET /Startup/User failed: ${res.response.status.toString()}`,
        );
      }

      return res.data as StartupUserDtoSchema;
    },

    async updateStartupUser(body: StartupUserDtoSchema): Promise<void> {
      const res: PostStartupUserResponse = await client.POST("/Startup/User", {
        body,
        headers: { "content-type": "application/json" },
      });

      if (res.error) {
        throw new Error(
          `POST /Startup/User failed: ${res.response.status.toString()}`,
        );
      }
    },

    async setRemoteAccess(body: StartupRemoteAccessDtoSchema): Promise<void> {
      const res: PostStartupRemoteAccessResponse = await client.POST(
        "/Startup/RemoteAccess",
        {
          body,
          headers: { "content-type": "application/json" },
        },
      );

      if (res.error) {
        throw new Error(
          `POST /Startup/RemoteAccess failed: ${res.response.status.toString()}`,
        );
      }
    },

    async completeStartupWizard(): Promise<void> {
      const res: PostStartupCompleteResponse =
        await client.POST("/Startup/Complete");

      if (res.error) {
        throw new Error(
          `POST /Startup/Complete failed: ${res.response.status.toString()}`,
        );
      }
    },

    async authenticateByName(
      username: string,
      password: string,
    ): Promise<AuthenticationResultSchema> {
      const res: PostAuthenticateByNameResponse = await client.POST(
        "/Users/AuthenticateByName",
        {
          body: {
            Username: username,
            Pw: password,
          },
          headers: { "content-type": "application/json" },
        },
      );

      if (res.error) {
        throw new Error(
          `POST /Users/AuthenticateByName failed: ${res.response.status.toString()}`,
        );
      }

      return res.data as AuthenticationResultSchema;
    },

    async getApiKeys(
      accessToken: string,
    ): Promise<AuthenticationInfoQueryResultSchema> {
      const authenticatedClient: Client<paths> = makeClient(
        baseUrl,
        accessToken,
      );
      const res: GetApiKeysResponse =
        await authenticatedClient.GET("/Auth/Keys");

      if (res.error) {
        throw new Error(
          `GET /Auth/Keys failed: ${res.response.status.toString()}`,
        );
      }

      return res.data as AuthenticationInfoQueryResultSchema;
    },

    async createApiKey(accessToken: string, appName: string): Promise<void> {
      const authenticatedClient: Client<paths> = makeClient(
        baseUrl,
        accessToken,
      );
      const res: PostCreateApiKeyResponse = await authenticatedClient.POST(
        "/Auth/Keys",
        {
          params: {
            query: {
              app: appName,
            },
          },
        },
      );

      if (res.error) {
        throw new Error(
          `POST /Auth/Keys failed: ${res.response.status.toString()}`,
        );
      }
    },
  };
}
