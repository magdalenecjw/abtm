const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif", // HEIC files are sometimes reported with this MIME type
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB, per workflows.md §8.3

/**
 * Validates one uploaded cover file against workflows.md §8.3
 * (accepted formats: JPEG/PNG/WebP/HEIC; max 5MB). Returns an error
 * message, or null if the file is valid.
 *
 * Takes a plain descriptor rather than a real File/Buffer so this
 * logic is usable identically on the client (from a File object) and
 * the server (from an uploaded file), and is trivially unit-testable
 * without constructing either.
 */
export function validateCoverFile(file: {
  name: string;
  size: number;
  type: string;
}): string | null {
  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    return `${file.name}: unsupported format (must be JPEG, PNG, WebP, or HEIC).`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `${file.name}: file too large (max 5MB).`;
  }
  if (file.size === 0) {
    return `${file.name}: file is empty.`;
  }
  return null;
}