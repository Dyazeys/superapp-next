#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function envString(name, fallback) {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

function envPort(name, fallback) {
  const value = process.env[name];
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const localPort = envPort("DB_TUNNEL_LOCAL_PORT", 55432);
const remoteHost = envString("DB_TUNNEL_REMOTE_HOST", "217.15.162.20");
const remoteUser = envString("DB_TUNNEL_REMOTE_USER", "opsadmin");
const remoteDbHost = envString("DB_TUNNEL_REMOTE_DB_HOST", "127.0.0.1");
const remoteDbPort = envPort("DB_TUNNEL_REMOTE_DB_PORT", 5432);
const keyPath = envString("DB_TUNNEL_KEY_PATH", join(homedir(), ".ssh", "id_ed25519"));

if (!existsSync(keyPath)) {
  console.error(`SSH private key not found at ${keyPath}`);
  process.exit(1);
}

console.log(
  `Opening SSH tunnel on localhost:${localPort} -> ${remoteDbHost}:${remoteDbPort} via ${remoteUser}@${remoteHost}`
);

const args = [
  "-i",
  keyPath,
  "-o",
  "IdentitiesOnly=yes",
  "-o",
  "ExitOnForwardFailure=yes",
  "-o",
  "ServerAliveInterval=30",
  "-o",
  "ServerAliveCountMax=3",
  "-o",
  "StrictHostKeyChecking=accept-new",
  "-N",
  "-L",
  `${localPort}:${remoteDbHost}:${remoteDbPort}`,
  `${remoteUser}@${remoteHost}`,
];

const child = spawn("ssh", args, {
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(`Failed to start ssh tunnel: ${error.message}`);
  process.exit(1);
});
