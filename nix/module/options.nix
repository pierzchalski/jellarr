{
  config,
  lib,
  pkgs,
  ...
}: {
  options.services.jellarr = {
    bootstrap = {
      enable = lib.mkEnableOption ''
        API key bootstrap service.

        WARNING: This requires Jellarr to run on the same host as Jellyfin.
        The bootstrap service will stop Jellyfin, insert the API key into
        the database, and restart Jellyfin. This only runs once - if the
        key already exists, it skips insertion.

        For deployments where Jellarr runs on a different host than Jellyfin,
        you must provision the API key manually (via Jellyfin UI or a separate
        script on the Jellyfin host) and provide it via environmentFile.
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

    apiBootstrap = {
      enable = lib.mkEnableOption ''
        API-only bootstrap service.

        This bootstraps a fresh Jellyfin instance using only API calls,
        eliminating the need for direct database access. This is useful for:
        - Remote Jellyfin deployments
        - Containerized environments
        - Any setup where database access is impractical

        The service will:
        1. Complete the Jellyfin startup wizard
        2. Create an admin user with the specified credentials
        3. Authenticate as the admin user
        4. Create an API key for Jellarr
        5. Save the API key to the specified file

        Note: This service requires a state directory (dataDir) and will only
        run once on a fresh Jellyfin instance.
      '';

      adminUser = {
        name = lib.mkOption {
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

      apiKeyName = lib.mkOption {
        default = "jellarr";
        description = ''
          Name/label for the API key in Jellyfin's API keys list.
        '';
        type = lib.types.str;
      };

      apiKeyOutputFile = lib.mkOption {
        default = null;
        description = ''
          Path where the generated API key will be written.
          This file can then be used as the environmentFile for the jellarr service.
          The file will be created with mode 0600.
        '';
        example = "/var/lib/jellarr/api-key";
        type = lib.types.nullOr lib.types.path;
      };

      serverName = lib.mkOption {
        default = null;
        description = "Server name to set during startup wizard configuration.";
        example = "My Jellyfin Server";
        type = lib.types.nullOr lib.types.str;
      };

      remoteAccess = {
        enable = lib.mkOption {
          default = true;
          description = "Enable remote access during startup wizard configuration.";
          type = lib.types.bool;
        };

        enableAutomaticPortMapping = lib.mkOption {
          default = false;
          description = "Enable automatic port mapping (UPnP) during startup wizard configuration.";
          type = lib.types.bool;
        };
      };
    };

    config = lib.mkOption {
      default = {};
      description = "configuration as attrset which will be converted to YAML.";
      inherit (pkgs.formats.yaml {}) type;
    };

    dataDir = lib.mkOption {
      default = "/var/lib/jellarr";
      description = "Working directory for jellarr (repos/, config/, etc.).";
      type = lib.types.path;
    };

    enable = lib.mkEnableOption "jellarr synchronization service";

    environmentFile = lib.mkOption {
      default = null;
      description = ''
        Environment file as defined in {manpage}`systemd.exec(5)`.
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
