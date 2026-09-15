import { randomBytes, createHash } from "crypto";

/**
 * Generates a cryptographically random, URL-safe token — used for
 * both verification tokens (workflows.md §3.2) and management tokens
 * (§5.5). 32 bytes -> 64 hex characters: long and unpredictable
 * enough per technical-specifications.md §21's token requirements.
 */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hashes a token for storage. Only the hash is ever persisted — the
 * raw token exists only transiently (in memory / shown once to the
 * user), per §5.5's "a database compromise must not expose working
 * borrower credentials" requirement.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}