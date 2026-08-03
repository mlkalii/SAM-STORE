/**
 * Password strength scoring.
 *
 * Deliberately free of server-only imports: the register form renders a live
 * meter from this, and the server action re-checks with the same function, so
 * the two can never disagree about what is acceptable.
 */

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too short" | "Weak" | "Fair" | "Good" | "Strong";
  /** What the user could do to improve it. Empty once the score is 4. */
  suggestions: string[];
  /** Below this the form will not submit. */
  acceptable: boolean;
}

const COMMON = new Set([
  "password", "12345678", "qwerty123", "letmein1", "welcome1", "admin123",
  "iloveyou", "password1", "samrux123", "changeme",
]);

/**
 * Strength scoring. Shared by the client (live meter) and the server (the
 * authoritative check), so the two can never disagree — which is why it lives
 * in a module with no server-only imports at the top level.
 */
export function scorePassword(password: string): PasswordStrength {
  const suggestions: string[] = [];

  if (password.length < 8) {
    return {
      score: 0,
      label: "Too short",
      suggestions: ["Use at least 8 characters"],
      acceptable: false,
    };
  }

  let score = 0;
  if (password.length >= 12) score += 1;
  else suggestions.push("Make it 12 characters or longer");

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  else suggestions.push("Mix upper and lower case");

  if (/\d/.test(password)) score += 1;
  else suggestions.push("Add a number");

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else suggestions.push("Add a symbol");

  if (COMMON.has(password.toLowerCase())) {
    return {
      score: 1,
      label: "Weak",
      suggestions: ["That password appears on breach lists — choose another"],
      acceptable: false,
    };
  }

  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  const label = (["Weak", "Weak", "Fair", "Good", "Strong"] as const)[clamped];

  return { score: clamped, label, suggestions, acceptable: clamped >= 2 };
}
