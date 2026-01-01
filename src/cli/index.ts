#!/usr/bin/env node
import { Command, Option } from "commander";
import { runPipeline } from "../pipeline";
import { runBootstrap } from "../pipeline/bootstrap";

interface ApplyOptions {
  configFile: string;
}

interface BootstrapOptions {
  baseUrl: string;
  configFile: string;
}

const program: Command = new Command();

program
  .name("jellarr")
  .description("Declarative Jellyfin configuration applier");

program
  .command("apply", { isDefault: true })
  .description("Apply Jellyfin configuration from a YAML file")
  .addOption(
    new Option("--configFile <path>", "path to config file").default(
      "config/config.yml",
    ),
  )
  .action(async (opts: ApplyOptions): Promise<void> => {
    await runPipeline(opts.configFile);
    console.log("✅ jellarr apply complete");
  });

program
  .command("bootstrap")
  .description(
    "Bootstrap a fresh Jellyfin instance using only API calls (no database access required)",
  )
  .requiredOption("--baseUrl <url>", "Jellyfin server base URL")
  .addOption(
    new Option("--configFile <path>", "path to bootstrap config file").default(
      "config/bootstrap.yml",
    ),
  )
  .action(async (opts: BootstrapOptions): Promise<void> => {
    await runBootstrap(opts.baseUrl, opts.configFile);
    console.log("✅ jellarr bootstrap complete");
  });

program.parseAsync().catch((err: unknown): void => {
  console.error(err);
  process.exit(1);
});
