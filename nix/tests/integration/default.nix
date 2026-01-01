{pkgs}: let
  tests = ["sanity" "api-bootstrap"];
in
  builtins.listToAttrs (map (name: {
      inherit name;
      value = import ./${name}.nix {inherit pkgs;};
    })
    tests)
