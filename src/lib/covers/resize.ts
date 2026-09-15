import "server-only";
import sharp from "sharp";

/**
 * Resizes (longest edge capped at ~1200px, never upscaled) and
 * re-encodes to WebP, per workflows.md §8.5 — the raw uploaded file
 * is never what gets stored; this processed version is.
 */
export async function processCoverImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize({
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();
}