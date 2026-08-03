import { spawn } from "node:child_process";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
const command = process.argv[2];

if (!new Set(["dev", "start"]).has(command)) {
  console.error("Usage: node scripts/next-with-env.mjs <dev|start> [...options]");
  process.exit(1);
}

loadEnvConfig(process.cwd(), command === "dev");

const nextArguments = [command];

if (process.env.PORT) {
  nextArguments.push("--port", process.env.PORT);
}

if (process.env.HOSTNAME) {
  nextArguments.push("--hostname", process.env.HOSTNAME);
}

// Les options passees explicitement a npm gardent la priorite sur le .env.
nextArguments.push(...process.argv.slice(3));

const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", ...nextArguments], {
  env: process.env,
  stdio: "inherit"
});

child.on("error", (error) => {
  console.error(`Impossible de demarrer Next.js : ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
