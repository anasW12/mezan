import { headers } from "next/headers";

const lastRequestByUser = new Map<string, number>();

interface SlidingWindowBucket {
  count: number;
  resetAt: number;
}

const slidingWindowBuckets = new Map<string, SlidingWindowBucket>();

const DEFAULT_WINDOW_MS = 1000;
const MAX_TRACKED_KEYS = 10000;

function trimMapIfNeeded<K, V>(map: Map<K, V>, maxEntries: number): void {
  if (map.size < maxEntries) return;
  const oldestKey = map.keys().next().value;
  if (oldestKey !== undefined) {
    map.delete(oldestKey);
  }
}

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

  trimMapIfNeeded(lastRequestByUser, MAX_TRACKED_KEYS);
  lastRequestByUser.set(userId, now);
  return { allowed: true, retryAfterMs: 0 };
}

export function checkSlidingWindowRateLimit(options: {
  key: string;
  maxAttempts: number;
  windowMs: number;
}): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = slidingWindowBuckets.get(options.key);

  if (!existing || now >= existing.resetAt) {
    trimMapIfNeeded(slidingWindowBuckets, MAX_TRACKED_KEYS);
    slidingWindowBuckets.set(options.key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: Math.max(0, options.maxAttempts - 1),
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= options.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, options.maxAttempts - existing.count),
    retryAfterSeconds: 0,
  };
}

export function resetSlidingWindowRateLimit(key: string): void {
  slidingWindowBuckets.delete(key);
}

export async function getClientIp(): Promise<string> {
  try {
    const headerStore = await headers();
    const forwardedFor = headerStore.get("x-forwarded-for");
    if (forwardedFor) {
      const firstIp = forwardedFor.split(",")[0]?.trim();
      if (firstIp) return firstIp;
    }
    const realIp = headerStore.get("x-real-ip")?.trim();
    if (realIp) return realIp;
  } catch {
    // Fallback when invoked outside a request header context
  }
  return "local";
}
