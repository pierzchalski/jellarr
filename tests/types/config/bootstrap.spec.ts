import { describe, it, expect } from "vitest";
import type { ZodSafeParseResult } from "zod";
import { type z } from "zod";
import {
  BootstrapConfigType,
  type BootstrapConfig,
} from "../../../src/types/config/bootstrap";

describe("BootstrapConfig", () => {
  it("should validate complete bootstrap config with password", () => {
    // Arrange
    const validConfig: z.input<typeof BootstrapConfigType> = {
      adminUser: {
        name: "admin",
        password: "securepassword123",
      },
      apiKey: {
        name: "jellarr",
        outputFile: "/var/lib/jellarr/api-key",
      },
    };

    // Act
    const result: ZodSafeParseResult<BootstrapConfig> =
      BootstrapConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.adminUser.name).toBe("admin");
      expect(result.data.adminUser.password).toBe("securepassword123");
      expect(result.data.apiKey.name).toBe("jellarr");
      expect(result.data.apiKey.outputFile).toBe("/var/lib/jellarr/api-key");
    }
  });

  it("should validate bootstrap config with passwordFile", () => {
    // Arrange
    const validConfig: z.input<typeof BootstrapConfigType> = {
      adminUser: {
        name: "admin",
        passwordFile: "/run/secrets/admin-password",
      },
      apiKey: {
        name: "jellarr",
        outputFile: "/var/lib/jellarr/api-key",
      },
    };

    // Act
    const result: ZodSafeParseResult<BootstrapConfig> =
      BootstrapConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.adminUser.name).toBe("admin");
      expect(result.data.adminUser.passwordFile).toBe(
        "/run/secrets/admin-password",
      );
      expect(result.data.adminUser.password).toBeUndefined();
    }
  });

  it("should validate config with all optional fields", () => {
    // Arrange
    const validConfig: z.input<typeof BootstrapConfigType> = {
      adminUser: {
        name: "myadmin",
        password: "pass123",
      },
      apiKey: {
        name: "my-jellarr-key",
        outputFile: "/tmp/key",
      },
      serverName: "My Jellyfin Server",
      remoteAccess: {
        enableRemoteAccess: true,
        enableAutomaticPortMapping: false,
      },
    };

    // Act
    const result: ZodSafeParseResult<BootstrapConfig> =
      BootstrapConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.serverName).toBe("My Jellyfin Server");
      expect(result.data.remoteAccess?.enableRemoteAccess).toBe(true);
      expect(result.data.remoteAccess?.enableAutomaticPortMapping).toBe(false);
    }
  });

  it("should reject config with both password and passwordFile", () => {
    // Arrange
    const invalidConfig: z.input<typeof BootstrapConfigType> = {
      adminUser: {
        name: "admin",
        password: "pass",
        passwordFile: "/run/secrets/pass",
      },
      apiKey: {
        name: "jellarr",
        outputFile: "/tmp/key",
      },
    };

    // Act
    const result: ZodSafeParseResult<BootstrapConfig> =
      BootstrapConfigType.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("should reject config with neither password nor passwordFile", () => {
    // Arrange
    const invalidConfig: z.input<typeof BootstrapConfigType> = {
      adminUser: {
        name: "admin",
      },
      apiKey: {
        name: "jellarr",
        outputFile: "/tmp/key",
      },
    };

    // Act
    const result: ZodSafeParseResult<BootstrapConfig> =
      BootstrapConfigType.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("should reject empty admin username", () => {
    // Arrange
    const invalidConfig: z.input<typeof BootstrapConfigType> = {
      adminUser: {
        name: "",
        password: "pass",
      },
      apiKey: {
        name: "jellarr",
        outputFile: "/tmp/key",
      },
    };

    // Act
    const result: ZodSafeParseResult<BootstrapConfig> =
      BootstrapConfigType.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      const usernameError: z.core.$ZodIssue | undefined =
        result.error.issues.find(
          (err: z.core.$ZodIssue) =>
            err.path.includes("name") && err.path.includes("adminUser"),
        );
      expect(usernameError).toBeDefined();
    }
  });

  it("should reject missing apiKey outputFile", () => {
    // Arrange
    const invalidConfig: { adminUser: { name: string; password: string }; apiKey: { name: string } } = {
      adminUser: {
        name: "admin",
        password: "pass",
      },
      apiKey: {
        name: "jellarr",
        // missing outputFile
      },
    };

    // Act
    const result: ZodSafeParseResult<BootstrapConfig> =
      BootstrapConfigType.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
    }
  });

  it("should reject extra fields due to strict mode", () => {
    // Arrange
    const invalidConfig: z.input<typeof BootstrapConfigType> = {
      adminUser: {
        name: "admin",
        password: "pass",
      },
      apiKey: {
        name: "jellarr",
        outputFile: "/tmp/key",
      },
      // @ts-expect-error intentional extra field for test
      extraField: "not allowed",
    };

    // Act
    const result: ZodSafeParseResult<BootstrapConfig> =
      BootstrapConfigType.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      const strictError: z.core.$ZodIssue | undefined =
        result.error.issues.find(
          (err: z.core.$ZodIssue) => err.code === "unrecognized_keys",
        );
      expect(strictError?.code).toBe("unrecognized_keys");
    }
  });

  it("should use default apiKey name when not specified", () => {
    // Arrange
    const validConfig: { adminUser: { name: string; password: string }; apiKey: { outputFile: string } } = {
      adminUser: {
        name: "admin",
        password: "pass",
      },
      apiKey: {
        outputFile: "/tmp/key",
      },
    };

    // Act
    const result: ZodSafeParseResult<BootstrapConfig> =
      BootstrapConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.apiKey.name).toBe("jellarr");
    }
  });
});
