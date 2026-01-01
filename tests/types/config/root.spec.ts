import { describe, it, expect } from "vitest";
import type { ZodSafeParseResult } from "zod";
import { type z } from "zod";
import {
  RootConfigType,
  type RootConfig,
} from "../../../src/types/config/root";

describe("RootConfig", () => {
  it("should validate complete root config", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {
        enableMetrics: true,
        pluginRepositories: [
          {
            name: "Test Repository",
            url: "https://test.example.com/manifest.json",
            enabled: true,
          },
        ],
        trickplayOptions: {
          enableHwAcceleration: true,
        },
      },
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validConfig);
    }
  });

  it("should validate root config with encoding section", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      encoding: {
        enableHardwareEncoding: true,
      },
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validConfig);
    }
  });

  it("should validate root config without encoding section", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validConfig);
    }
  });

  it("should validate root config with library section", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      library: {
        virtualFolders: [
          {
            name: "Movies",
            collectionType: "movies",
            libraryOptions: {
              pathInfos: [{ path: "/mnt/movies" }],
            },
          },
        ],
      },
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.library).toBeDefined();
      expect(result.data.library?.virtualFolders).toHaveLength(1);
      expect(result.data.library?.virtualFolders?.[0].name).toBe("Movies");
    }
  });

  it("should validate root config with empty library section", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      library: {},
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.library).toBeDefined();
      expect(result.data.library?.virtualFolders).toBeUndefined();
    }
  });

  it("should validate root config without library section", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.library).toBeUndefined();
    }
  });

  it("should reject invalid version", () => {
    // Arrange
    const invalidConfig: z.input<typeof RootConfigType> = {
      version: -1,
      base_url: "http://example.com",
      system: {},
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
      const versionError: z.core.$ZodIssue | undefined =
        result.error.issues.find((err: z.core.$ZodIssue) =>
          err.path.includes("version"),
        );
      expect(versionError?.message).toContain("positive integer");
    }
  });

  it("should reject invalid base_url", () => {
    // Arrange
    const invalidConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "not-a-url",
      system: {},
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
      const urlError: z.core.$ZodIssue | undefined = result.error.issues.find(
        (err: z.core.$ZodIssue) => err.path.includes("base_url"),
      );
      expect(urlError?.message).toContain("must be a valid URL");
    }
  });

  it("should reject missing required fields", () => {
    // Arrange
    const invalidConfig: Partial<z.input<typeof RootConfigType>> = {
      version: 1,
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> = RootConfigType.safeParse(
      invalidConfig as z.input<typeof RootConfigType>,
    );

    // Assert
    expect(result.success).toBe(false);
  });

  it("should validate root config with branding section", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      branding: {
        loginDisclaimer: "Custom login message",
        customCss: "body { background: black; }",
      },
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.branding).toBeDefined();
      expect(result.data.branding?.loginDisclaimer).toBe(
        "Custom login message",
      );
    }
  });

  it("should validate root config with empty branding section", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      branding: {},
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.branding).toBeDefined();
    }
  });

  it("should validate root config without branding section", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.branding).toBeUndefined();
    }
  });

  it("should reject invalid branding configuration", () => {
    // Arrange
    const invalidConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      branding: {
        // @ts-expect-error intentional invalid field for test
        invalidField: "not allowed",
      },
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("should validate root config with users section", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      users: [
        {
          name: "testuser",
          password: "testpass123",
        },
        {
          name: "fileuser",
          passwordFile: "/secrets/password",
        },
      ],
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.users).toBeDefined();
      expect(result.data.users).toHaveLength(2);
      expect(result.data.users?.[0].name).toBe("testuser");
      expect(result.data.users?.[1].name).toBe("fileuser");
    }
  });

  it("should validate root config with empty users section", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      users: [],
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.users).toBeDefined();
      expect(result.data.users).toHaveLength(0);
    }
  });

  it("should validate root config without users section", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.users).toBeUndefined();
    }
  });

  it("should reject invalid users configuration", () => {
    // Arrange
    const invalidConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      users: [
        {
          name: "invaliduser",
        },
      ],
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("should validate root config with empty encoding section", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      encoding: {},
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.encoding).toBeDefined();
    }
  });

  it("should reject invalid encoding configuration", () => {
    // Arrange
    const invalidConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      encoding: {
        // @ts-expect-error intentional invalid boolean value for test
        enableHardwareEncoding: "invalid_boolean_value",
      },
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("should reject invalid library configuration", () => {
    // Arrange
    const invalidConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      library: {
        virtualFolders: [
          {
            name: "InvalidLibrary",
            // @ts-expect-error intentional invalid collection type for test
            collectionType: "invalid_type",
            libraryOptions: {
              pathInfos: [{ path: "/invalid/path" }],
            },
          },
        ],
      },
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("should validate root config with all fields", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {
        enableMetrics: true,
        pluginRepositories: [
          {
            name: "Test Repository",
            url: "https://test.example.com/manifest.json",
            enabled: true,
          },
        ],
        trickplayOptions: {
          enableHwAcceleration: true,
        },
      },
      encoding: {
        enableHardwareEncoding: true,
      },
      library: {
        virtualFolders: [
          {
            name: "movies",
            collectionType: "movies",
            libraryOptions: {
              pathInfos: [{ path: "/media/movies" }],
            },
          },
        ],
      },
      branding: {
        loginDisclaimer: "Welcome to our media server",
        customCss: "body { font-family: Arial; }",
      },
      users: [
        {
          name: "admin",
          password: "adminpass123",
        },
        {
          name: "viewer",
          passwordFile: "/secrets/viewer_password",
        },
      ],
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.system).toBeDefined();
      expect(result.data.encoding).toBeDefined();
      expect(result.data.library).toBeDefined();
      expect(result.data.branding).toBeDefined();
      expect(result.data.users).toBeDefined();
      expect(result.data.users).toHaveLength(2);
    }
  });

  it("should reject extra fields due to strict mode", () => {
    // Arrange
    const invalidConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://example.com",
      system: {},
      // @ts-expect-error intentional extra field for test
      extraField: "not allowed",
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
      const strictError: z.core.$ZodIssue | undefined =
        result.error.issues.find(
          (err: z.core.$ZodIssue) => err.code === "unrecognized_keys",
        );
      expect(strictError?.code).toBe("unrecognized_keys");
    }
  });

  it("should validate root config with startup section", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      startup: {
        completeStartupWizard: true,
      },
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startup).toBeDefined();
      expect(result.data.startup?.completeStartupWizard).toBe(true);
    }
  });

  it("should validate root config with empty startup section", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      startup: {},
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startup).toBeDefined();
    }
  });

  it("should validate root config without startup section", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startup).toBeUndefined();
    }
  });

  it("should reject invalid startup configuration", () => {
    // Arrange
    const invalidConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      startup: {
        // @ts-expect-error intentional invalid field for test
        invalidField: "not allowed",
      },
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("should validate root config with admin section using password", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      admin: {
        username: "admin",
        password: "secretpassword",
      },
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.admin).toBeDefined();
      expect(result.data.admin?.username).toBe("admin");
      expect(result.data.admin?.password).toBe("secretpassword");
    }
  });

  it("should validate root config with admin section using password_file", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      admin: {
        username: "admin",
        password_file: "/run/secrets/admin-password",
      },
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.admin).toBeDefined();
      expect(result.data.admin?.username).toBe("admin");
      expect(result.data.admin?.password_file).toBe("/run/secrets/admin-password");
    }
  });

  it("should reject admin config with both password and password_file", () => {
    // Arrange
    const invalidConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      admin: {
        username: "admin",
        password: "secretpassword",
        password_file: "/run/secrets/admin-password",
      },
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
      const adminError: z.core.$ZodIssue | undefined = result.error.issues.find(
        (err: z.core.$ZodIssue) =>
          err.message.includes("exactly one of 'password' or 'password_file'"),
      );
      expect(adminError).toBeDefined();
    }
  });

  it("should reject admin config with neither password nor password_file", () => {
    // Arrange
    const invalidConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      admin: {
        username: "admin",
      },
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("should validate root config with api_key section", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      api_key: {
        name: "my-app",
        file: "/var/lib/jellarr/api-key",
      },
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.api_key).toBeDefined();
      expect(result.data.api_key?.name).toBe("my-app");
      expect(result.data.api_key?.file).toBe("/var/lib/jellarr/api-key");
    }
  });

  it("should validate api_key with default name", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      api_key: {
        file: "/var/lib/jellarr/api-key",
      },
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.api_key).toBeDefined();
      expect(result.data.api_key?.name).toBe("jellarr");
      expect(result.data.api_key?.file).toBe("/var/lib/jellarr/api-key");
    }
  });

  it("should reject api_key with empty file path", () => {
    // Arrange
    const invalidConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      api_key: {
        file: "",
      },
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(invalidConfig);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toBeDefined();
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("should validate root config with admin and api_key for bootstrapping", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      admin: {
        username: "admin",
        password_file: "/run/secrets/admin-password",
      },
      api_key: {
        name: "jellarr",
        file: "/var/lib/jellarr/api-key",
      },
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.admin).toBeDefined();
      expect(result.data.api_key).toBeDefined();
      expect(result.data.admin?.username).toBe("admin");
      expect(result.data.api_key?.file).toBe("/var/lib/jellarr/api-key");
    }
  });

  it("should validate root config with state_dir", () => {
    // Arrange
    const validConfig: z.input<typeof RootConfigType> = {
      version: 1,
      base_url: "http://10.0.0.76:8096",
      system: {},
      state_dir: "/var/lib/jellarr",
    };

    // Act
    const result: ZodSafeParseResult<RootConfig> =
      RootConfigType.safeParse(validConfig);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.state_dir).toBe("/var/lib/jellarr");
    }
  });
});
