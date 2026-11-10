import { getCloudflareContext } from "@opennextjs/cloudflare";

// The subset of the Cloudflare Images binding used here (see wrangler.jsonc).
type ImageTransform = { width?: number; height?: number; fit?: "scale-down" | "contain" | "cover" | "crop" | "pad" };
type ImageOutputOptions = { format: "image/jpeg" | "image/webp"; quality?: number };
type ImagesBinding = {
  input(stream: ReadableStream<Uint8Array>): {
    transform(transform: ImageTransform): {
      output(options: ImageOutputOptions): Promise<{ response(): Response }>;
    };
  };
};

/** Resize or re-encode an image with the Cloudflare Images binding. */
export async function transformImage(
  source: ArrayBuffer | Uint8Array,
  transform: ImageTransform,
  output: ImageOutputOptions
) {
  const { env } = await getCloudflareContext({ async: true });
  const images = (env as { IMAGES?: ImagesBinding }).IMAGES;
  if (!images) throw new Error("Cloudflare IMAGES binding is not configured");

  const result = await images.input(new Blob([new Uint8Array(source)]).stream()).transform(transform).output(output);
  return Buffer.from(await result.response().arrayBuffer());
}
