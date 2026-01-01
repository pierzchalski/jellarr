{
  config,
  lib,
  pkgs,
  ...
}: {
  options.services.jellarr = {
    bootstrap = {
      enable = lib.mkEnableOption ''
        SQLite-based API key bootstrap service.

        WARNING: This requires Jellarr to run on the same host as Jellyfin.
        The bootstrap service will stop Jellyfin, insert the API key into
        the database, and restart Jellyfin. This only runs once - if the
        key already exists, it skips insertion.

        For API-only bootstrapping (no database access), use the admin and
        api_key options in the config instead.
      '';

      apiKeyFile = lib.mkOption {
        default = null;
        description = ''
          Path to a file containing the API key to insert into Jellyfin's database.
          The file should contain only the API key value (whitespace is trimmed).
          This is typically a sops-nix managed secret.
        '';
        example = "/run/secrets/jellarr-api-key";
        type = lib.types.nullOr lib.types.path;
      };

      apiKeyName = lib.mkOption {
        default = "jellarr";
        description = ''
          Name/label for the API key in Jellyfin's API keys list.
          Used to identify the key and prevent duplicate insertions.
        '';
        type = lib.types.str;
      };

      jellyfinDataDir = lib.mkOption {
        default = config.services.jellyfin.dataDir;
        description = ''
          Jellyfin's data directory where the database is stored.
          The database path will be: {jellyfinDataDir}/data/jellyfin.db

          Defaults to config.services.jellyfin.dataDir.
        '';
        type = lib.types.path;
      };

      jellyfinService = lib.mkOption {
        default = "jellyfin.service";
        description = "Name of the Jellyfin systemd service.";
        type = lib.types.str;
      };
    };

    admin = {
      enable = lib.mkEnableOption ''
        API-only bootstrapping.

        When enabled, Jellarr will automatically bootstrap a fresh Jellyfin
        instance using only API calls (no database access required). This is
        useful for remote Jellyfin deployments or containerized environments.

        The bootstrap process will:
        1. Create an admin user with the specified credentials
        2. Complete the startup wizard
        3. Create an API key for Jellarr
        4. Save the API key to the configured file

        This happens automatically on first run when no API key exists.
      '';

      username = lib.mkOption {
        default = "admin";
        description = "Username for the Jellyfin admin user to create.";
        type = lib.types.str;
      };

      passwordFile = lib.mkOption {
        default = null;
        description = ''
          Path to a file containing the admin user's password.
          The file should contain only the password (whitespace is trimmed).
          This is typically a sops-nix managed secret.
        '';
        example = "/run/secrets/jellyfin-admin-password";
        type = lib.types.nullOr lib.types.path;
      };
    };

    apiKey = {
      name = lib.mkOption {
        default = "jellarr";
        description = ''
          Name/label for the API key in Jellyfin's API keys list.
        '';
        type = lib.types.str;
      };

      file = lib.mkOption {
        default = null;
        description = ''
          Path where the API key is stored (or will be created during bootstrap).
          Jellarr will first try to load an existing key from this file, and
          if bootstrapping is enabled, will save the generated key here.
        '';
        example = "/var/lib/jellarr/api-key";
        type = lib.types.nullOr lib.types.path;
      };
    };

    config = lib.mkOption {
      default = {};
      description = "Configuration as attrset which will be converted to YAML.";
      inherit (pkgs.formats.yaml {}) type;
    };

    dataDir = lib.mkOption {
      default = "/var/lib/jellarr";
      description = "Working directory for jellarr (config files, API key, etc.).";
      type = lib.types.path;
    };

    enable = lib.mkEnableOption "jellarr synchronization service";

    environmentFile = lib.mkOption {
      default = null;
      description = ''
        Environment file as defined in {manpage}`systemd.exec(5)`.
        Can be used to provide JELLARR_API_KEY if not using api_key.file.
      '';
      type = lib.types.nullOr lib.types.path;
    };

    group = lib.mkOption {
      default = "jellarr";
      description = "Group for the jellarr service.";
      type = lib.types.str;
    };

    schedule = lib.mkOption {
      default = "daily";
      description = "Run interval for the timer.";
      type = lib.types.str;
    };

    user = lib.mkOption {
      default = "jellarr";
      description = "User to run the jellarr service as.";
      type = lib.types.str;
    };
  };
}
