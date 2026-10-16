const STORAGE_PUBLIC_PATH = "/storage/v1/object/public/car-images/";

export function fallbackToOriginalCarImage(
  event: React.SyntheticEvent<HTMLImageElement>,
  originalUrl?: string
) {
  const image = event.currentTarget;

  if (!originalUrl || image.dataset.usedOriginalFallback === "true") {
    return false;
  }

  image.dataset.usedOriginalFallback = "true";
  image.removeAttribute("srcset");
  image.src = originalUrl;
  return true;
}

function variantIdFromObjectPath(objectPath: string) {
  return objectPath
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-");
}

/**
 * Returns browser-native responsive sources for a car image stored in the
 * `car-images` Supabase bucket. Non-car images keep their original URL.
 */
export function getCarImageSources(imageUrl?: string) {
  if (!imageUrl) return null;

  try {
    const url = new URL(imageUrl);
    const pathIndex = url.pathname.indexOf(STORAGE_PUBLIC_PATH);

    if (pathIndex === -1) return { src: imageUrl };

    const objectPath = decodeURIComponent(
      url.pathname.slice(pathIndex + STORAGE_PUBLIC_PATH.length)
    );

    if (!objectPath || objectPath.startsWith("optimized/")) {
      return { src: imageUrl };
    }

    const base = `${url.origin}${STORAGE_PUBLIC_PATH}optimized/${variantIdFromObjectPath(objectPath)}`;
    return {
      src: `${base}-card.webp`,
      srcSet: `${base}-thumb.webp 300w, ${base}-card.webp 800w, ${imageUrl} 1600w`,
      sizes: "(max-width: 640px) 300px, (max-width: 1024px) 800px, 1600px",
    };
  } catch {
    return { src: imageUrl };
  }
}
