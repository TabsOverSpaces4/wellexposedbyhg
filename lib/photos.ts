import { list } from "@vercel/blob";

export interface Photo {
  id: number;
  roman: string;
  w: number;
  h: number;
  ratio: number;
  src: string;
}

const ROMANS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "XVI",
  "XVII",
  "XVIII",
  "XIX",
  "XX",
];

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "avif"]);

function isImageBlob(pathname: string) {
  const ext = pathname.split(".").pop()?.toLowerCase();
  return IMAGE_EXTS.has(ext || "");
}

export async function getPhotos(): Promise<Photo[]> {
  try {
    // Try with "photos/" prefix first
    let { blobs } = await list({ prefix: "photos/", limit: 100 });
    let imageBlobs = blobs.filter((b) => isImageBlob(b.pathname));

    // If nothing found, try listing all blobs
    if (imageBlobs.length === 0) {
      console.log("[photos] No blobs at photos/ prefix, listing all…");
      const all = await list({ limit: 100 });
      imageBlobs = all.blobs.filter((b) => isImageBlob(b.pathname));
    }

    if (imageBlobs.length === 0) {
      console.log("[photos] Blob store has no images — using local fallback");
      return getFallbackPhotos();
    }

    imageBlobs.sort((a, b) => a.pathname.localeCompare(b.pathname));
    console.log(`[photos] Loaded ${imageBlobs.length} images from Vercel Blob`);

    return imageBlobs.map((blob, idx) => {
      const w = 1600;
      const h = 1200;
      return {
        id: idx + 1,
        roman: ROMANS[idx] || String(idx + 1),
        w,
        h,
        ratio: w / h,
        src: blob.url,
      };
    });
  } catch (err) {
    console.error("[photos] Blob list() failed:", err);
    return getFallbackPhotos();
  }
}

function getFallbackPhotos(): Photo[] {
  // Fallback photos when Vercel Blob is not configured
  // These use placeholder images for development
  const photos = [
    { id: 1, w: 1200, h: 1600 },
    { id: 2, w: 1600, h: 1066 },
    { id: 3, w: 1300, h: 1300 },
    { id: 4, w: 1280, h: 1600 },
    { id: 5, w: 1800, h: 1012 },
    { id: 6, w: 1200, h: 1500 },
    { id: 7, w: 1500, h: 1200 },
    { id: 8, w: 1900, h: 950 },
    { id: 9, w: 1300, h: 1300 },
    { id: 10, w: 1400, h: 1050 },
  ];

  return photos.map((p, idx) => ({
    ...p,
    roman: ROMANS[idx],
    ratio: p.w / p.h,
    src: `/photos/${String(p.id).padStart(2, "0")}.jpg`,
  }));
}
