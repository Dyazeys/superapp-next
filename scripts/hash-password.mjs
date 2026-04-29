#!/usr/bin/env node

import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run auth:hash -- '<password>'");
  process.exit(1);
}

const N = 16384;
const r = 8;
const p = 1;
const keyLength = 64;
const salt = randomBytes(16).toString("hex");
const derivedKey = scryptSync(password, salt, keyLength, { N, r, p }).toString("hex");

console.log(`scrypt$${N}$${r}$${p}$${salt}$${derivedKey}`);
