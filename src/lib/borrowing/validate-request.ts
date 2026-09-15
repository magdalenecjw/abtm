/**
 * Validates real name / nickname, per workflows.md §3.3: 3-25
 * characters, letters and spaces only (no punctuation). Same rule
 * applies to both fields, so one function covers both.
 *
 * "Letters" is interpreted as plain ASCII A-Z (the spec doesn't
 * specify accented/non-Latin characters); revisit if that turns out
 * to be too restrictive for real names in practice.
 */
const NAME_PATTERN = /^[A-Za-z ]{3,25}$/;
const HAS_LETTER = /[A-Za-z]/;

export function validateName(value: string): string | null {
  if (!NAME_PATTERN.test(value) || !HAS_LETTER.test(value)) {
    return "Must be 3–25 characters, letters and spaces only.";
  }
  return null;
}