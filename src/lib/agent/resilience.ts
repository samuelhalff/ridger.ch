export type TimestampedCacheEntry = {
  checkedAt: number;
};

export function isFreshCacheEntry(
  entry: TimestampedCacheEntry | undefined,
  now: number,
  ttlMs: number,
): entry is TimestampedCacheEntry {
  return Boolean(entry && now - entry.checkedAt < ttlMs);
}

export async function runWithTimeout<T>(
  task: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  label = "operation",
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new Error(`${label}_timeout`)),
    timeoutMs,
  );

  try {
    return await task(controller.signal);
  } finally {
    clearTimeout(timeout);
  }
}
