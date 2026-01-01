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

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: unknown;
  response: Response;
}

export type GetSystemConfigurationResponse =
  ApiResponse<ServerConfigurationSchema>;
export type PostSystemConfigurationResponse = ApiResponse<void>;
export type GetEncodingConfigurationResponse = ApiResponse;
export type PostEncodingConfigurationResponse = ApiResponse<void>;
export type GetVirtualFoldersResponse = ApiResponse<VirtualFolderInfoSchema[]>;
export type PostVirtualFolderResponse = ApiResponse<void>;
export type GetBrandingConfigurationResponse = ApiResponse;
export type PostBrandingConfigurationResponse = ApiResponse<void>;
export type GetUsersResponse = ApiResponse<UserDtoSchema[]>;
export type PostNewUserResponse = ApiResponse<UserDtoSchema>;
export type PostUserPolicyResponse = ApiResponse<void>;
export type PostStartupCompleteResponse = ApiResponse<void>;
export type GetStartupConfigurationResponse =
  ApiResponse<StartupConfigurationDtoSchema>;
export type PostStartupConfigurationResponse = ApiResponse<void>;
export type GetStartupUserResponse = ApiResponse<StartupUserDtoSchema>;
export type PostStartupUserResponse = ApiResponse<void>;
export type PostStartupRemoteAccessResponse = ApiResponse<void>;
export type PostAuthenticateByNameResponse =
  ApiResponse<AuthenticationResultSchema>;
export type GetApiKeysResponse = ApiResponse<AuthenticationInfoQueryResultSchema>;
export type PostCreateApiKeyResponse = ApiResponse<void>;

export interface JellyfinClient {
  getSystemConfiguration(): Promise<ServerConfigurationSchema>;
  updateSystemConfiguration(
    body: Partial<ServerConfigurationSchema>,
  ): Promise<void>;
  getEncodingConfiguration(): Promise<EncodingOptionsSchema>;
  updateEncodingConfiguration(
    body: Partial<EncodingOptionsSchema>,
  ): Promise<void>;
  getVirtualFolders(): Promise<VirtualFolderInfoSchema[]>;
  addVirtualFolder(
    name: string,
    collectionType: CollectionTypeSchema | undefined,
    body: AddVirtualFolderDtoSchema,
  ): Promise<void>;
  getBrandingConfiguration(): Promise<BrandingOptionsDtoSchema>;
  updateBrandingConfiguration(
    body: Partial<BrandingOptionsDtoSchema>,
  ): Promise<void>;
  getUsers(): Promise<UserDtoSchema[]>;
  createUser(body: CreateUserByNameSchema): Promise<void>;
  updateUserPolicy(userId: string, body: UserPolicySchema): Promise<void>;
  completeStartupWizard(): Promise<void>;
  getStartupConfiguration(): Promise<StartupConfigurationDtoSchema>;
  updateStartupConfiguration(
    body: StartupConfigurationDtoSchema,
  ): Promise<void>;
  getStartupUser(): Promise<StartupUserDtoSchema>;
  updateStartupUser(body: StartupUserDtoSchema): Promise<void>;
  setRemoteAccess(body: StartupRemoteAccessDtoSchema): Promise<void>;
  authenticateByName(
    username: string,
    password: string,
  ): Promise<AuthenticationResultSchema>;
  getApiKeys(): Promise<AuthenticationInfoQueryResultSchema>;
  createApiKey(appName: string): Promise<void>;
}
