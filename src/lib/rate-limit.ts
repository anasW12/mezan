const lastRequestByUser = new Map<string, number>();

const DEFAULT_WINDOW_MS = 1000;
const MAX_TRACKED_USERS = 5000;

export function checkUserRateLimit(
  userId: string,
  minIntervalMs = DEFAULT_WINDOW_MS
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const lastTimestamp = lastRequestByUser.get(userId);

  if (lastTimestamp !== undefined) {
    const elapsed = now - lastTimestamp;
    if (elapsed < minIntervalMs) {
      return {
        allowed: false,
        retryAfterMs: minIntervalMs - elapsed,
      };
    }
  }

  if (lastRequestByUser.size >= MAX_TRACKED_USERS) {
    const oldestKey = lastRequestByUser.keys().next().value;
    if (oldestKey) {
      lastRequestByUser.delete(oldestKey);
    }
  }

  lastRequestByUser.set(userId, now);
  return { allowed: true, retryAfterMs: 0 };
}
