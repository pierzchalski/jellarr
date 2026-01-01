import { z } from "zod";

const AdminUserConfigType: z.ZodObject<{
  name: z.ZodString;
  password: z.ZodOptional<z.ZodString>;
  passwordFile: z.ZodOptional<z.ZodString>;
}> = z.object({
  name: z.string().min(1, "Admin username is required"),
  password: z
    .string()
    .min(1, "Password is required if using inline password")
    .optional(),
  passwordFile: z.string().optional(),
});

const ApiKeyConfigType: z.ZodObject<{
  name: z.ZodDefault<z.ZodString>;
  outputFile: z.ZodString;
}> = z.object({
  name: z.string().default("jellarr"),
  outputFile: z.string().min(1, "API key output file path is required"),
});

const RemoteAccessConfigType: z.ZodObject<{
  enableRemoteAccess: z.ZodDefault<z.ZodBoolean>;
  enableAutomaticPortMapping: z.ZodDefault<z.ZodBoolean>;
}> = z.object({
  enableRemoteAccess: z.boolean().default(true),
  enableAutomaticPortMapping: z.boolean().default(false),
});

// eslint-disable-next-line @typescript-eslint/typedef
export const BootstrapConfigType = z
  .object({
    adminUser: AdminUserConfigType.strict().refine(
      (data: { password?: string; passwordFile?: string }) =>
        (data.password !== undefined) !== (data.passwordFile !== undefined),
      {
        message:
          "Exactly one of 'password' or 'passwordFile' must be specified for adminUser",
      },
    ),
    apiKey: ApiKeyConfigType.strict(),
    serverName: z.string().optional(),
    remoteAccess: RemoteAccessConfigType.strict().optional(),
  })
  .strict();

export type BootstrapConfig = z.infer<typeof BootstrapConfigType>;
