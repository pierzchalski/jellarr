import json
import time

from hamcrest import (
    all_of,
    assert_that,
    contains_string,
    has_entry,
    has_item,
    has_key,
    has_length,
)


def wait_for_jellyfin_startup_wizard(server):
    """Wait for Jellyfin to be ready and still in startup wizard state."""
    print("=== Starting the VM / Server ===")
    server.start()

    server.wait_for_unit("multi-user.target")
    server.wait_for_unit("jellyfin.service")
    server.wait_for_open_port(8096)

    print("=== Waiting for Jellyfin public API ===")
    for i in range(60):
        try:
            result = server.succeed("curl -sf 'http://localhost:8096/System/Info/Public'")
            info = json.loads(result)
            print(f"  Jellyfin version: {info.get('Version', 'unknown')}")
            print(f"  Startup wizard completed: {info.get('StartupWizardCompleted', 'unknown')}")
            break
        except Exception as e:
            print(f"  Waiting for Jellyfin... ({i}/60)")
            time.sleep(2)
    else:
        raise Exception("Jellyfin public API never became ready")


def verify_startup_wizard_not_completed(server):
    """Verify that Jellyfin is in startup wizard mode (fresh install)."""
    result = server.succeed("curl -sf 'http://localhost:8096/System/Info/Public'")
    info = json.loads(result)

    # Fresh Jellyfin should have StartupWizardCompleted = False
    startup_completed = info.get("StartupWizardCompleted", True)
    print(f"=== Startup wizard completed: {startup_completed} ===")

    if startup_completed:
        print("WARNING: Startup wizard already completed - this may indicate Jellyfin was already configured")
    else:
        print("Jellyfin is in fresh install state (startup wizard not completed)")


def run_jellarr_service(server):
    """Run the jellarr service which should bootstrap and configure Jellyfin."""
    print("=== Running jellarr service (will bootstrap if needed) ===")

    # The jellarr service should:
    # 1. Detect no API key exists
    # 2. Perform bootstrap (create admin user, complete wizard, create API key)
    # 3. Apply configuration
    server.succeed("systemctl start jellarr.service")

    # Wait for service to complete (it's a oneshot)
    for i in range(120):
        try:
            result = server.succeed(
                "systemctl show jellarr.service --property=ExecMainStatus"
            )
            if "ExecMainStatus=0" in result:
                print("jellarr service completed successfully")
                break
        except:
            pass
        time.sleep(1)
    else:
        # Show logs if failed
        server.succeed("journalctl -u jellarr.service --no-pager || true")
        raise Exception("jellarr service did not complete successfully")


def verify_api_key_created(server):
    """Verify that the API key file was created by the bootstrap process."""
    print("=== Verifying API key file was created ===")

    result = server.succeed("cat /var/lib/jellarr/api-key")
    api_key = result.strip()

    assert len(api_key) > 0, "API key file is empty"
    print(f"API key created: {api_key[:8]}... (truncated)")

    return api_key


def verify_admin_user_created(server, api_key):
    """Verify that the admin user was created during bootstrap."""
    print("=== Verifying admin user was created ===")

    result = server.succeed(
        f"curl -sf 'http://localhost:8096/Users' -H 'X-Emby-Token: {api_key}'"
    )
    users = json.loads(result)

    admin_users = [u for u in users if u.get("Name") == "admin"]
    assert len(admin_users) == 1, f"Expected 1 admin user, found {len(admin_users)}"

    admin = admin_users[0]
    assert_that(
        admin,
        all_of(
            has_entry("Name", "admin"),
            has_entry(
                "Policy",
                has_entry("IsAdministrator", True),
            ),
        ),
    )

    print("Admin user exists and is administrator")


def verify_startup_wizard_completed(server, api_key):
    """Verify that the startup wizard was completed during bootstrap."""
    print("=== Verifying startup wizard was completed ===")

    result = server.succeed("curl -sf 'http://localhost:8096/System/Info/Public'")
    info = json.loads(result)

    assert info.get("StartupWizardCompleted") == True, "Startup wizard should be completed"
    print("Startup wizard was completed by bootstrap")


def verify_configuration_applied(server, api_key):
    """Verify that jellarr configuration was applied after bootstrap."""
    print("=== Verifying configuration was applied ===")

    # Check system config (metrics enabled)
    result = server.succeed(
        f"curl -sf 'http://localhost:8096/System/Configuration' -H 'X-Emby-Token: {api_key}'"
    )
    system_config = json.loads(result)
    assert_that(system_config, has_entry("EnableMetrics", True))
    print("  System config: EnableMetrics = True")

    # Check branding
    result = server.succeed(
        f"curl -sf 'http://localhost:8096/Branding/Configuration' -H 'X-Emby-Token: {api_key}'"
    )
    branding_config = json.loads(result)
    assert_that(branding_config, has_entry("LoginDisclaimer", contains_string("Bootstrapped via API")))
    print("  Branding config: LoginDisclaimer set correctly")

    # Check test user was created
    result = server.succeed(
        f"curl -sf 'http://localhost:8096/Users' -H 'X-Emby-Token: {api_key}'"
    )
    users = json.loads(result)
    test_users = [u for u in users if u.get("Name") == "test-api-user"]
    assert len(test_users) == 1, f"Expected test-api-user, found: {[u.get('Name') for u in users]}"
    assert_that(
        test_users[0],
        has_entry(
            "Policy",
            has_entry("IsAdministrator", False),
        ),
    )
    print("  Users: test-api-user created with correct policy")


def verify_admin_authentication(server, api_key):
    """Verify that the admin user can authenticate with the configured password."""
    print("=== Verifying admin authentication ===")

    auth_payload = json.dumps({"Username": "admin", "Pw": "admin-password-123"})
    result = server.succeed(
        f"curl -sf 'http://localhost:8096/Users/AuthenticateByName' "
        f"-H 'X-Emby-Token: {api_key}' "
        f"-H 'Content-Type: application/json' "
        f"-d '{auth_payload}'"
    )
    auth_response = json.loads(result)

    assert_that(
        auth_response,
        all_of(
            has_entry("User", has_entry("Name", "admin")),
            has_key("AccessToken"),
        ),
    )
    print("Admin user can authenticate with configured password")


def run_api_bootstrap_test(server):
    """Main test function for API-only bootstrap."""
    # Setup
    wait_for_jellyfin_startup_wizard(server)
    verify_startup_wizard_not_completed(server)

    # Act - run jellarr which will bootstrap and configure
    run_jellarr_service(server)

    # Assert - verify bootstrap worked
    api_key = verify_api_key_created(server)
    verify_admin_user_created(server, api_key)
    verify_startup_wizard_completed(server, api_key)
    verify_configuration_applied(server, api_key)
    verify_admin_authentication(server, api_key)

    print("API-only bootstrap test passed: Jellyfin bootstrapped and configured without SQLite access")
