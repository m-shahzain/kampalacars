#!/usr/bin/env node
/**
 * One-time migration: create a Supabase Auth login for every existing row in
 * the users table, keeping the same id (so listings and likes stay linked)
 * and the password the person already uses. Existing users are marked as
 * verified. Safe to re-run: users who already have a login are skipped.
 *
 *   node scripts/migrate-users-to-supabase-auth.mjs --dry-run
 *   node scripts/migrate-users-to-supabase-auth.mjs
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
 * Run docs/supabase-auth-migration-1.sql first.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");

async function loadLocalEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const env = await readFile(path.join(root, file), "utf8");
      for (const line of env.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
        if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
      }
    } catch {
      // Missing env files are fine.
    }
  }
}

await loadLocalEnv();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

// Every existing login account, so we know who is already migrated.
async function listAuthUserIds() {
  const ids = new Set();
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Could not list auth users: ${error.message}`);
    data.users.forEach((user) => ids.add(user.id));
    if (data.users.length < 1000) break;
  }
  return ids;
}

const { data: users, error } = await supabase
  .from("users")
  .select("user_id, email, password, fullname, phone, address, user_type, created_at")
  .order("created_at", { ascending: true });

if (error) {
  console.error(`Could not read users: ${error.message}`);
  console.error("If the password column was already removed, the migration has finished.");
  process.exit(1);
}

const existing = await listAuthUserIds();
const toMigrate = users.filter((user) => !existing.has(user.user_id));

console.log(`${dryRun ? "Dry run: " : ""}${users.length} user(s); ${users.length - toMigrate.length} already have a login; ${toMigrate.length} to migrate.`);

let created = 0;
const failed = [];

for (const user of toMigrate) {
  const email = user.email.trim().toLowerCase();
  const usablePassword = typeof user.password === "string" && user.password.length >= 6;

  if (dryRun) {
    console.log(`  would create ${email} (${user.user_type})${usablePassword ? "" : " without a password: they will need 'Forgot password'"}`);
    continue;
  }

  const { error: createError } = await supabase.auth.admin.createUser({
    id: user.user_id,
    email,
    ...(usablePassword ? { password: user.password } : {}),
    email_confirm: true,
    user_metadata: {
      fullname: user.fullname,
      phone: user.phone,
      address: user.address,
    },
  });

  if (createError) {
    failed.push(`${email}: ${createError.message}`);
    console.error(`  ! ${email}: ${createError.message}`);
  } else {
    created++;
    console.log(`  created ${email}`);
  }
}

console.log(`
Summary
  Created: ${created}
  Skipped (already migrated): ${users.length - toMigrate.length}
  Failed: ${failed.length}`);
if (failed.length) {
  failed.forEach((failure) => console.log(`  ${failure}`));
  console.log("Fix the problem and run the script again; finished users are skipped.");
}
process.exit(failed.length ? 1 : 0);
