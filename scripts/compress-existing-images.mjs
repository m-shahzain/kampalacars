#!/usr/bin/env node
/**
 * One-time migration: shrink every image the database still uses in the
 * `car-images` bucket, and report (optionally delete) files nothing uses.
 *
 *   node scripts/compress-existing-images.mjs --dry-run
 *   node scripts/compress-existing-images.mjs
 *   node scripts/compress-existing-images.mjs --delete-orphans --dry-run
 *   node scripts/compress-existing-images.mjs --delete-orphans
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
 * environment. Never put the service role key in a NEXT_PUBLIC_ variable.
 */

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const BUCKET = "car-images";
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 82;
const SMALL_WEBP_BYTES = 512 * 1024;
const CONCURRENCY = 3;
// Files this new may belong to a listing that is still being filled in.
const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000;
const DRY_RUN_SAMPLE_SIZE = 12;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backupDir = path.join(root, "image-backup");
const orphansFile = path.join(root, "orphans.json");
const dryRun = process.argv.includes("--dry-run");
const deleteOrphans = process.argv.includes("--delete-orphans");

// ---------------------------------------------------------------- helpers

async function loadLocalEnv() {
  // Only fills variables that are not already set; Vercel/CI set them directly.
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

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const kb = (bytes) => (bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : mb(bytes));
const sum = (files) => files.reduce((total, file) => total + file.size, 0);
const variantId = (filePath) => filePath.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-");
const webpPathFor = (filePath) => filePath.replace(/\.[^./]+$/, "") + ".webp";

function pathFromUrl(url) {
  const index = url?.indexOf(PUBLIC_MARKER) ?? -1;
  return index === -1 ? null : decodeURIComponent(url.slice(index + PUBLIC_MARKER.length).split("?")[0]);
}

async function runPool(items, limit, worker) {
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

async function withRetry(label, action, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await action();
    } catch (error) {
      if (attempt >= attempts) throw new Error(`${label}: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// ---------------------------------------------------------------- supabase

await loadLocalEnv();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const bucket = () => supabase.storage.from(BUCKET);

async function listBucket(prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await withRetry(`list ${prefix || "/"}`, async () => {
      const result = await bucket().list(prefix, { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
      if (result.error) throw new Error(result.error.message);
      return result;
    });
    if (error) throw error;
    for (const entry of data) {
      const itemPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id) {
        files.push({
          path: itemPath,
          size: entry.metadata?.size ?? 0,
          type: entry.metadata?.mimetype ?? "",
          createdAt: new Date(entry.created_at || entry.updated_at || 0).getTime(),
        });
      } else {
        files.push(...(await listBucket(itemPath)));
      }
    }
    if (data.length < 1000) break;
  }
  return files;
}

async function selectAll(table, columns, applyFilter = (query) => query) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await applyFilter(supabase.from(table).select(columns)).range(from, from + 999);
    if (error) throw new Error(`Could not read ${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

/** Every database row that points at a file in the bucket. */
async function loadReferences() {
  const cars = await selectAll("cars", "car_id, image_urls");
  const users = await selectAll("users", "user_id, profile_picture_url", (query) => query.not("profile_picture_url", "is", null));

  const rows = [
    ...cars.map((car) => ({ table: "cars", id: car.car_id, urls: car.image_urls ?? [] })),
    ...users.map((user) => ({ table: "users", id: user.user_id, urls: [user.profile_picture_url] })),
  ];
  const referencedPaths = new Set(rows.flatMap((row) => row.urls.map(pathFromUrl).filter(Boolean)));
  return { rows, referencedPaths };
}

async function download(filePath) {
  return withRetry(`download ${filePath}`, async () => {
    const { data, error } = await bucket().download(filePath);
    if (error || !data) throw new Error(error?.message || "empty response");
    return Buffer.from(await data.arrayBuffer());
  });
}

async function compress(source) {
  return sharp(source, { failOn: "none" })
    .rotate() // apply EXIF orientation; metadata is not copied to the output
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

async function removeFiles(paths, label) {
  let removed = 0;
  for (let index = 0; index < paths.length; index += 100) {
    const batch = paths.slice(index, index + 100);
    const { error } = await bucket().remove(batch);
    if (error) console.error(`  ! Could not delete ${label} batch starting at ${batch[0]}: ${error.message}`);
    else removed += batch.length;
  }
  return removed;
}

// ---------------------------------------------------------------- analysis

function classify(files, referencedPaths) {
  const now = Date.now();
  const referencedStems = new Set([...referencedPaths].map(variantId));
  const isOptimized = (file) => file.path.startsWith("optimized/");
  const variantStem = (file) => file.path.match(/^optimized\/(.+)-(thumb|card|full)\.webp$/)?.[1];
  const oldEnough = (file) => now - file.createdAt >= ORPHAN_MIN_AGE_MS;

  const originals = files.filter((file) => !isOptimized(file));
  const referenced = originals.filter((file) => referencedPaths.has(file.path));
  const alreadySmall = referenced.filter((file) => file.type === "image/webp" && file.size <= SMALL_WEBP_BYTES);
  const toCompress = referenced.filter((file) => !alreadySmall.includes(file));

  const orphans = files.filter((file) => {
    if (!oldEnough(file)) return false;
    if (!isOptimized(file)) return !referencedPaths.has(file.path);
    const stem = variantStem(file);
    return !stem || !referencedStems.has(stem);
  });
  const orphanPaths = new Set(orphans.map((file) => file.path));

  // Full-size copies are no longer used by the site; the compressed original replaces them.
  const fullCopies = files.filter((file) => /-full\.webp$/.test(file.path) && isOptimized(file) && !orphanPaths.has(file.path));
  const missingFromBucket = [...referencedPaths].filter((filePath) => !files.some((file) => file.path === filePath));

  return { originals, referenced, alreadySmall, toCompress, orphans, fullCopies, missingFromBucket };
}

async function writeOrphanReport(orphans) {
  const report = {
    generatedAt: new Date().toISOString(),
    note: "Files in the car-images bucket that no cars.image_urls or users.profile_picture_url entry uses (optimized/ copies count as orphans when their original is unused). Files younger than 24 hours are excluded.",
    count: orphans.length,
    totalBytes: sum(orphans),
    files: orphans.map((file) => ({ path: file.path, bytes: file.size, created: new Date(file.createdAt).toISOString() })),
  };
  await writeFile(orphansFile, JSON.stringify(report, null, 2));
}

async function backup(files) {
  console.log(`\nBacking up ${files.length} file(s) (${mb(sum(files))}) to ${path.relative(root, backupDir)}/ ...`);
  const failures = [];
  let copied = 0;
  let present = 0;

  await runPool(files, CONCURRENCY, async (file) => {
    const target = path.join(backupDir, ...file.path.split("/"));
    try {
      const existing = await stat(target).catch(() => null);
      if (existing && existing.size === file.size) {
        present++;
        return;
      }
      const data = await download(file.path);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, data);
      copied++;
      if ((copied + present) % 50 === 0) console.log(`  ${copied + present}/${files.length} backed up`);
    } catch (error) {
      failures.push(`${file.path}: ${error.message}`);
    }
  });

  console.log(`  Backup: ${copied} downloaded, ${present} already present, ${failures.length} failed.`);
  return failures;
}

// ---------------------------------------------------------------- modes

async function estimate(toCompress) {
  const sample = [...toCompress].sort(() => Math.random() - 0.5).slice(0, DRY_RUN_SAMPLE_SIZE);
  let before = 0;
  let after = 0;
  for (const file of sample) {
    try {
      const output = await compress(await download(file.path));
      before += file.size;
      after += Math.min(output.length, file.size);
    } catch {
      // A sample that cannot be read is just left out of the estimate.
    }
  }
  return before ? after / before : null;
}

async function runOrphanDeletion(files, referencedPaths) {
  const { orphans } = classify(files, referencedPaths);
  await writeOrphanReport(orphans);
  console.log(`\nOrphans: ${orphans.length} file(s), ${mb(sum(orphans))}. Full list written to orphans.json.`);
  for (const file of orphans.slice(0, 20)) console.log(`  ${file.path}  ${kb(file.size)}`);
  if (orphans.length > 20) console.log(`  ... and ${orphans.length - 20} more (see orphans.json)`);

  if (dryRun) {
    console.log("\nDry run: nothing was deleted.");
    return 0;
  }

  // Originals are backed up first; optimized/ copies can be regenerated.
  const backupFailures = await backup(orphans.filter((file) => !file.path.startsWith("optimized/")));
  if (backupFailures.length) {
    console.error("\nBackup failed for some files, so nothing was deleted:");
    backupFailures.forEach((failure) => console.error(`  ${failure}`));
    return 1;
  }

  // Re-check right before deleting in case a listing started using a file meanwhile.
  const { referencedPaths: fresh } = await loadReferences();
  const stillOrphaned = orphans.filter((file) => !fresh.has(file.path)).map((file) => file.path);
  const removed = await removeFiles(stillOrphaned, "orphan");
  console.log(`\nDeleted ${removed} of ${orphans.length} orphaned file(s).`);
  return removed === stillOrphaned.length ? 0 : 1;
}

async function runCompression(files, rows, referencedPaths) {
  const plan = classify(files, referencedPaths);
  const sizeBefore = sum(files);

  await writeOrphanReport(plan.orphans);

  console.log(`
Bucket:              ${files.length} file(s), ${mb(sizeBefore)}
Images in use:       ${plan.referenced.length} file(s), ${mb(sum(plan.referenced))}
  to compress:       ${plan.toCompress.length} file(s), ${mb(sum(plan.toCompress))}
  already small WebP:${String(plan.alreadySmall.length).padStart(4)} file(s) (skipped)
Unused full copies:  ${plan.fullCopies.length} file(s), ${mb(sum(plan.fullCopies))} (deleted after compression)
Orphans:             ${plan.orphans.length} file(s), ${mb(sum(plan.orphans))} (listed in orphans.json, not deleted)`);
  if (plan.missingFromBucket.length) {
    console.log(`Database URLs with no file in the bucket: ${plan.missingFromBucket.length} (left unchanged)`);
  }

  if (dryRun) {
    console.log(`\nEstimating compression from a sample of ${Math.min(DRY_RUN_SAMPLE_SIZE, plan.toCompress.length)} image(s)...`);
    const ratio = await estimate(plan.toCompress);
    const compressedEstimate = ratio === null ? sum(plan.toCompress) : sum(plan.toCompress) * ratio;
    const afterMigration = sizeBefore - sum(plan.toCompress) + compressedEstimate - sum(plan.fullCopies);
    console.log(`  Images to compress: ${mb(sum(plan.toCompress))} -> about ${mb(compressedEstimate)}`);
    console.log(`  Bucket after migration:        about ${mb(afterMigration)}`);
    console.log(`  ...and after --delete-orphans: about ${mb(afterMigration - sum(plan.orphans))}`);
    console.log("\nDry run: nothing was changed.");
    return 0;
  }

  // 1. Backup every original before touching anything.
  const backupFailures = await backup(plan.originals);
  if (backupFailures.length) {
    console.error("\nBackup failed for some files, so nothing was changed:");
    backupFailures.forEach((failure) => console.error(`  ${failure}`));
    return 1;
  }

  // 2. Compress and upload. Each file is converted once even if several rows use it.
  const fileByPath = new Map(files.map((file) => [file.path, file]));
  const toCompressPaths = new Set(plan.toCompress.map((file) => file.path));
  const conversions = new Map();
  const results = { processed: 0, skipped: plan.alreadySmall.length, failed: [] };
  const replacedPaths = new Set();
  let done = 0;

  const convert = (oldPath) => {
    if (!conversions.has(oldPath)) {
      conversions.set(oldPath, (async () => {
        const file = fileByPath.get(oldPath);
        const newPath = webpPathFor(oldPath);
        const progress = `[${++done}/${plan.toCompress.length}]`;
        try {
          if (newPath !== oldPath && referencedPaths.has(newPath)) {
            throw new Error(`${newPath} already exists and is in use`);
          }
          const output = await compress(await download(oldPath));

          if (output.length >= file.size) {
            results.skipped++;
            console.log(`  ${progress} skipped ${oldPath} (already smaller than a re-encoded copy)`);
            return null;
          }

          await withRetry(`upload ${newPath}`, async () => {
            const { error } = await bucket().upload(newPath, output, { contentType: "image/webp", upsert: true });
            if (error) throw new Error(error.message);
          });
          results.processed++;
          console.log(`  ${progress} ${oldPath} ${kb(file.size)} -> ${newPath} ${kb(output.length)}`);
          return { newPath, newUrl: bucket().getPublicUrl(newPath).data.publicUrl };
        } catch (error) {
          results.failed.push(`${oldPath}: ${error.message}`);
          console.error(`  ! ${oldPath}: ${error.message}`);
          return null;
        }
      })());
    }
    return conversions.get(oldPath);
  };

  const rowsToUpdate = rows.filter((row) => row.urls.some((url) => toCompressPaths.has(pathFromUrl(url))));
  console.log(`\nCompressing ${plan.toCompress.length} image(s) used by ${rowsToUpdate.length} row(s)...`);

  await runPool(rowsToUpdate, CONCURRENCY, async (row) => {
    const urlMap = new Map();
    for (const url of row.urls) {
      const oldPath = pathFromUrl(url);
      if (!toCompressPaths.has(oldPath)) continue;
      const converted = await convert(oldPath);
      if (converted && converted.newPath !== oldPath) urlMap.set(url, converted);
    }
    if (!urlMap.size) return;

    // 3. Point the row at the new files. Read it again so concurrent edits are kept.
    try {
      if (row.table === "cars") {
        const { data, error } = await supabase.from("cars").select("image_urls").eq("car_id", row.id).single();
        if (error) throw new Error(error.message);
        const imageUrls = (data.image_urls ?? []).map((url) => urlMap.get(url)?.newUrl ?? url);
        const { error: updateError } = await supabase.from("cars").update({ image_urls: imageUrls }).eq("car_id", row.id);
        if (updateError) throw new Error(updateError.message);
      } else {
        const { data, error } = await supabase.from("users").select("profile_picture_url").eq("user_id", row.id).single();
        if (error) throw new Error(error.message);
        const replacement = urlMap.get(data.profile_picture_url);
        if (replacement) {
          const { error: updateError } = await supabase.from("users").update({ profile_picture_url: replacement.newUrl }).eq("user_id", row.id);
          if (updateError) throw new Error(updateError.message);
        }
      }
      for (const url of urlMap.keys()) replacedPaths.add(pathFromUrl(url));
    } catch (error) {
      results.failed.push(`${row.table} ${row.id} database update: ${error.message}`);
      console.error(`  ! Could not update ${row.table} ${row.id}: ${error.message} (old files kept)`);
    }
  });

  // 4. Only now delete the old originals, and only those no row uses any more.
  const { referencedPaths: fresh } = await loadReferences();
  const oldOriginals = [...replacedPaths].filter((filePath) => !fresh.has(filePath));
  const removedOriginals = await removeFiles(oldOriginals, "original");
  const removedFullCopies = await removeFiles(plan.fullCopies.map((file) => file.path), "full copy");
  console.log(`\nDeleted ${removedOriginals} replaced original(s) and ${removedFullCopies} unused full-size copies.`);

  const sizeAfter = sum(await listBucket());
  console.log(`
Summary
  Processed:      ${results.processed}
  Skipped:        ${results.skipped}
  Failed:         ${results.failed.length}
  Storage before: ${mb(sizeBefore)}
  Storage after:  ${mb(sizeAfter)}
  Orphans still in the bucket: ${plan.orphans.length} file(s), ${mb(sum(plan.orphans))} (see orphans.json; remove with --delete-orphans)`);
  if (results.failed.length) {
    console.log("\nFailures (safe to re-run the script to retry):");
    results.failed.forEach((failure) => console.log(`  ${failure}`));
  }
  return results.failed.length ? 1 : 0;
}

// ---------------------------------------------------------------- main

console.log(`${deleteOrphans ? "Orphan cleanup" : "Image compression"}${dryRun ? " (dry run)" : ""} for bucket "${BUCKET}"`);
console.log("Reading storage and database...");
const [files, { rows, referencedPaths }] = await Promise.all([listBucket(), loadReferences()]);

const exitCode = deleteOrphans
  ? await runOrphanDeletion(files, referencedPaths)
  : await runCompression(files, rows, referencedPaths);
process.exit(exitCode);
