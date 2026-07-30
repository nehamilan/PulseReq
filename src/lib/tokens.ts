/** Generates opaque patient-link tokens, e.g. "req-7721a9". */
export function newToken(existing: string[] = []): string {
  const taken = new Set(existing.map((t) => t.toLowerCase()));
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const hex = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("");
    const token = `req-${hex}`;
    if (!taken.has(token)) return token;
  }
  return `req-${Date.now().toString(16).slice(-6)}`;
}