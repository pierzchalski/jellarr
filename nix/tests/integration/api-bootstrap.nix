{pkgs}:
pkgs.testers.runNixOSTest {
  extraPythonPackages = p: [p.pyhamcrest];

  globalTimeout = 600;

  name = "jellarr-api-bootstrap";

  nodes.server = {
    imports = [
      (import ../../module {
        inherit pkgs;
        inherit (pkgs) lib;
      })
    ];

    environment = {
      # Admin password file for API bootstrap
      etc."jellyfin-admin-password".text = "admin-password-123";

      systemPackages = [
        pkgs.curl
        pkgs.dig
        pkgs.jq
      ];
    };

    networking.useDHCP = true;

    services = {
      jellarr = {
        enable = true;

        # Use API-only bootstrapping (no SQLite access needed)
        admin = {
          enable = true;
          username = "admin";
          passwordFile = "/etc/jellyfin-admin-password";
        };

        apiKey = {
          name = "jellarr";
          file = "/var/lib/jellarr/api-key";
        };

        config = {
          base_url = "http://localhost:8096";
          version = 1;
          system = {
            enableMetrics = true;
          };
          branding = {
            loginDisclaimer = "Bootstrapped via API";
          };
          users = [
            {
              name = "test-api-user";
              password = "testpass123";
              policy = {
                isAdministrator = false;
              };
            }
          ];
        };
      };

      jellyfin = {
        enable = true;
        openFirewall = true;
      };
    };

    virtualisation.diskSize = 4096;
  };

  testScript =
    # py
    ''
      ${builtins.readFile ./api-bootstrap.py}
      run_api_bootstrap_test(server)
    '';
}
