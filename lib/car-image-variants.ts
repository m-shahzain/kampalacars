import sharp from "sharp";

export const CAR_IMAGE_VARIANTS = [
  { name: "thumb", width: 300 },
  { name: "card", width: 800 },
  { name: "full", width: 1600 },
] as const;

export function getCarImageVariantId(sourcePath: string) {
  return sourcePath
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-");
}

export function getCarImageVariantPaths(sourcePath: string) {
  const id = getCarImageVariantId(sourcePath);
  return CAR_IMAGE_VARIANTS.map(({ name }) => `optimized/${id}-${name}.webp`);
}

type Storage = {
  from(bucket: string): {
    upload(path: string, file: Buffer, options: { contentType: string; upsert: boolean }): Promise<{ error: { message: string } | null }>;
  };
};

/** Generate fixed-width WebP variants without changing the original upload. */
export async function createCarImageVariants(
  storage: Storage,
  sourcePath: string,
  source: Buffer,
  upsert = true
) {
  const paths = getCarImageVariantPaths(sourcePath);

  await Promise.all(
    CAR_IMAGE_VARIANTS.map(async ({ width }, index) => {
      const webp = await sharp(source)
        .rotate()
        .resize({ width })
        .webp({ quality: 75 })
        .toBuffer();
      const { error } = await storage
        .from("car-images")
        .upload(paths[index], webp, { contentType: "image/webp", upsert });

      if (error) throw new Error(error.message);
    })
  );

  return paths;
}
