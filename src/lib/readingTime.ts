/**
 * Reading time utility
 * - Strips basic markdown syntax before counting words for more stable estimates
 * - Exports function returning minutes, words, ISO8601 duration and raw value
 */
export interface ReadingTime {
  words: number;
  minutes: number;
  timeRequiredISO: string; // PT{M}M
}

const AVERAGE_WPM = 200; // Could be locale-tuned in future

export function estimateReadingTime(markdown: string): ReadingTime | null {
  if (!markdown) return null;
  // Remove code fences & inline code ticks (rough)
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ') // code blocks
    .replace(/`[^`]*`/g, ' ') // inline code
    .replace(/\!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ') // links
    .replace(/[#>*_~`-]/g, ' ') // markdown punctuation
    .replace(/\s+/g, ' ')
    .trim();

  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  if (!words) return null;
  const minutesFloat = words / AVERAGE_WPM;
  const minutes = Math.max(1, Math.round(minutesFloat));
  const timeRequiredISO = `PT${minutes}M`;
  return { words, minutes, timeRequiredISO };
}
