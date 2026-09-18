// Minimal typography helpers to avoid awkward line breaks across locales

// Insert non‑breaking spaces around dashes when surrounded by spaces
export function fixDashSpacing(input: string): string {
  if (!input) return input;
  return input.replace(/\s([\u2013\u2014\-])\s/g, (_m, dash: string) => `\u00A0${dash}\u00A0`);
}

// Prevent widows: join the last two words with a non‑breaking space
export function preventWidow(input: string): string {
  if (!input) return input;
  const parts = input.trim().split(/\s+/);
  if (parts.length < 3) return input; // leave short titles alone
  const last = parts.pop();
  const before = parts.pop();
  return `${parts.join(" ")} ${before}\u00A0${last}`;
}

export function tidyTitle(input: string): string {
  return preventWidow(fixDashSpacing(input));
}

// Split a title on an en/em dash or hyphen surrounded by spaces.
// Returns the main title and a potential subtitle (without the dash).
export function splitTitle(input: string): { title: string; subtitle?: string } {
  if (!input) return { title: input };
  const match = input.match(/^(.*?)\s([\u2013\u2014\-])\s(.*)$/);
  if (!match) return { title: input };
  const [, left,, right] = match;
  return { title: left.trim(), subtitle: right.trim() };
}
