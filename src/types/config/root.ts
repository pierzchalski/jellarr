import { z } from "zod";
import { SystemConfigType } from "./system";
import { EncodingOptionsConfigType } from "./encoding-options";
import { LibraryConfigType } from "./library";
import { BrandingOptionsConfigType } from "./branding-options";
import { UserConfigListType } from "./users";
import { StartupConfigType } from "./startup";

const AdminConfigType: z.ZodObject<{
  username: z.ZodString;
  password: z.ZodOptional<z.ZodString>;
  password_file: z.ZodOptional<z.ZodString>;
}> = z
  .object({
    username: z.string().min(1, "Admin username is required"),
    password: z.string().optional(),
    password_file: z.string().optional(),
  })
  .strict()
  .refine(
    (data: { password?: string; password_file?: string }) => {
      const hasPassword: boolean =
        data.password !== undefined && data.password.trim() !== "";
      const hasPasswordFile: boolean =
        data.password_file !== undefined && data.password_file.trim() !== "";
      return hasPassword !== hasPasswordFile;
    },
    {
      message:
        "Must specify exactly one of 'password' or 'password_file' for admin",
      path: [],
    },
  );

export type AdminConfig = z.infer<typeof AdminConfigType>;

const ApiKeyConfigType: z.ZodObject<{
  name: z.ZodDefault<z.ZodString>;
  file: z.ZodString;
}> = z
  .object({
    name: z.string().default("jellarr"),
    file: z.string().min(1, "API key file path is required"),
  })
  .strict();

export type ApiKeyConfig = z.infer<typeof ApiKeyConfigType>;

export const RootConfigType: z.ZodObject<{
  version: z.ZodNumber;
  base_url: z.ZodURL;
  state_dir: z.ZodOptional<z.ZodString>;
  admin: z.ZodOptional<typeof AdminConfigType>;
  api_key: z.ZodOptional<typeof ApiKeyConfigType>;
  system: typeof SystemConfigType;
  encoding: z.ZodOptional<typeof EncodingOptionsConfigType>;
  library: z.ZodOptional<typeof LibraryConfigType>;
  branding: z.ZodOptional<typeof BrandingOptionsConfigType>;
  users: z.ZodOptional<typeof UserConfigListType>;
  startup: z.ZodOptional<typeof StartupConfigType>;
}> = z
  .object({
    version: z.number().int().positive("Version must be a positive integer"),
    base_url: z.url({ message: "Base URL must be a valid URL" }),
    state_dir: z.string().optional(),
    admin: AdminConfigType.optional(),
    api_key: ApiKeyConfigType.optional(),
    system: SystemConfigType,
    encoding: EncodingOptionsConfigType.optional(),
    library: LibraryConfigType.optional(),
    branding: BrandingOptionsConfigType.optional(),
    users: UserConfigListType.optional(),
    startup: StartupConfigType.optional(),
  })
  .strict();

export type RootConfig = z.infer<typeof RootConfigType>;
