// Cloudflare entry point: serves cached Supabase images, then hands every
// other request to the Next.js app built by `opennextjs-cloudflare build`.
// @ts-expect-error generated at build time
import { default as nextHandler } from "./.open-next/worker.js";

type Env = { SUPABASE_URL: string };
type Context = { waitUntil(promise: Promise<unknown>): void };

const IMAGE_PREFIX = "/img/";
const ALLOWED_BUCKETS = ["car-images/"];
const ONE_YEAR = 31536000;

/**
 * Proxies /img/<bucket>/<path> to Supabase public storage. Uploaded files are
 * never overwritten with different content, so they are cached for a year and
 * Supabase is only asked once per Cloudflare location.
 */
async function serveStorageImage(request: Request, env: Env, ctx: Context) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(request.url);
  const objectPath = url.pathname.slice(IMAGE_PREFIX.length);
  if (!ALLOWED_BUCKETS.some((bucket) => objectPath.startsWith(bucket))) {
    return new Response("Not found", { status: 404 });
  }

  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(`${url.origin}${url.pathname}`);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const upstream = await fetch(`${env.SUPABASE_URL}/storage/v1/object/public/${objectPath}`, {
    cf: { cacheEverything: true, cacheTtl: ONE_YEAR },
  } as RequestInit);
  if (!upstream.ok) {
    return new Response("Not found", { status: upstream.status === 404 || upstream.status === 400 ? 404 : 502 });
  }

  const response = new Response(upstream.body, upstream);
  response.headers.set("Cache-Control", `public, max-age=${ONE_YEAR}, immutable`);
  response.headers.delete("Set-Cookie");
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

/** Caches next/image results so each size is fetched and resized only once per location. */
async function serveOptimizedImage(request: Request, env: Env, ctx: Context) {
  if (request.method !== "GET") return nextHandler.fetch(request, env, ctx);

  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(request.url);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const rendered: Response = await nextHandler.fetch(request, env, ctx);
  if (!rendered.ok) return rendered;

  // Source photos get a new file name when replaced, so a week is safe.
  const response = new Response(rendered.body, rendered);
  response.headers.set("Cache-Control", "public, max-age=604800");
  response.headers.delete("Set-Cookie");
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

export default {
  fetch(request: Request, env: Env, ctx: Context) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith(IMAGE_PREFIX)) return serveStorageImage(request, env, ctx);
    if (pathname === "/_next/image") return serveOptimizedImage(request, env, ctx);
    return nextHandler.fetch(request, env, ctx);
  },
};
