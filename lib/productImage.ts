// Product image resolution for search results and thumbnails.
//
// Kassalapp's product feed carries an `image` URL, but a large share of those
// URLs are dead links (notably every `api.vetduat.no` URL 404s, along with a
// few other hosts). Rendering them directly is why most search thumbnails
// showed a blank placeholder.
//
// This module builds an ordered list of candidate image URLs so the UI can try
// the primary image first and transparently fall back to the reliable,
// barcode-addressable `bilder.ngdata.no` CDN. We deliberately stay within
// Norwegian grocery CDNs and never fall back to OpenFoodFacts imagery.

// Image hosts that are effectively always broken in the Kassalapp feed. We skip
// these outright instead of showing a broken image before the onError handler
// fires.
export const DEAD_IMAGE_HOSTS = new Set<string>([
  "api.vetduat.no",
  "engrosnett.no",
  "publicimages.blob.core.windows.net",
  "bilder.kolonial.no"
]);

// ngdata serves the same product image under a few store-specific subpaths,
// keyed by barcode. `meny` and `kmh` cover the overwhelming majority of hits;
// we keep the list short to bound the number of fallback requests per image.
const NGDATA_STORE_PATHS = ["meny", "kmh"] as const;

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

export function isDeadImageHost(url: string): boolean {
  const host = hostOf(url);
  return host !== null && DEAD_IMAGE_HOSTS.has(host);
}

function ngdataCandidates(barcode: string | null | undefined): string[] {
  const ean = barcode?.trim();
  if (!ean) return [];
  return NGDATA_STORE_PATHS.map(
    (store) => `https://bilder.ngdata.no/${ean}/${store}/large.jpg`
  );
}

/**
 * Build an ordered, de-duplicated list of image URLs to attempt for a product.
 * The UI renders candidates[0] and advances to the next on load error, showing
 * a placeholder once the list is exhausted.
 */
export function buildProductImageCandidates(
  image: string | null | undefined,
  barcode: string | null | undefined
): string[] {
  const candidates: string[] = [];

  // Trust the primary image only when it is not a known-dead host.
  if (image && !isDeadImageHost(image)) {
    candidates.push(image);
  }

  // Always add the barcode-addressable ngdata fallbacks. When the primary was a
  // dead host these become the main source; when it was a good host they only
  // ever load if the primary itself 404s.
  candidates.push(...ngdataCandidates(barcode));

  return Array.from(new Set(candidates));
}
