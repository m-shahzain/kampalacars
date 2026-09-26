#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const force = process.argv.includes("--force");
const variants = [
  ["thumb", 300],
  ["card", 800],
  ["full", 1600],
];

async function loadLocalEnv() {
  try {
    const env = await readFile(path.join(root, ".env"), "utf8");
    for (const line of env.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // Vercel/CI supplies environment variables directly.
  }
}

function variantId(sourcePath) {
  return sourcePath.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function variantPaths(sourcePath) {
  const id = variantId(sourcePath);
  return variants.map(([name]) => `optimized/${id}-${name}.webp`);
}

async function listAll(storage, prefix = "") {
  const entries = [];
  let offset = 0;
  while (true) {
    const { data, error } = await storage.from("car-images").list(prefix, { limit: 100, offset });
    if (error) throw new Error(`Could not list ${prefix || "bucket root"}: ${error.message}`);
    entries.push(...data);
    if (data.length < 100) break;
    offset += data.length;
  }

  const files = [];
  for (const entry of entries) {
    const itemPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id) files.push(itemPath);
    else files.push(...(await listAll(storage, itemPath)));
  }
  return files;
}

await loadLocalEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).");
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const allFiles = await listAll(supabase.storage);
const sourceFiles = allFiles.filter(
  (file) =>
    !file.startsWith("optimized/") &&
    !file.startsWith("profile-pictures/") &&
    /\.(jpe?g|png|webp)$/i.test(file)
);

console.log(`Found ${sourceFiles.length} source car image(s).`);

let created = 0;
let skipped = 0;
for (const sourcePath of sourceFiles) {
  const targets = variantPaths(sourcePath);
  const missingTargets = force
    ? targets
    : (
        await Promise.all(
          targets.map(async (target) => {
            const { data } = await supabase.storage.from("car-images").download(target);
            return data ? null : target;
          })
        )
      ).filter(Boolean);
  if (!missingTargets.length) {
    skipped++;
    continue;
  }

  const { data, error } = await supabase.storage.from("car-images").download(sourcePath);
  if (error || !data) {
    console.error(`Skipping ${sourcePath}: ${error?.message || "download failed"}`);
    continue;
  }

  const source = Buffer.from(await data.arrayBuffer());
  for (const [name, width] of variants) {
    const target = `optimized/${variantId(sourcePath)}-${name}.webp`;
    if (!missingTargets.includes(target)) continue;

    const output = await sharp(source).rotate().resize({ width }).webp({ quality: 75 }).toBuffer();
    const { error: uploadError } = await supabase.storage
      .from("car-images")
      .upload(target, output, { contentType: "image/webp", upsert: force });
    if (uploadError && !( !force && /already exists/i.test(uploadError.message) )) {
      throw new Error(`Could not upload ${target}: ${uploadError.message}`);
    }
    created++;
  }
  console.log(`Optimized ${sourcePath}`);
}

console.log(`Done. Created ${created} variant(s); skipped ${skipped} already-optimized source image(s).`);
