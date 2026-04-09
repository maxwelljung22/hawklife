type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const globalForServerCache = globalThis as typeof globalThis & {
  __hawklifeServerCache?: Map<string, CacheEntry<unknown>>;
  __hawklifeServerInflight?: Map<string, Promise<unknown>>;
};

const serverCache = globalForServerCache.__hawklifeServerCache ?? new Map<string, CacheEntry<unknown>>();
const inflight = globalForServerCache.__hawklifeServerInflight ?? new Map<string, Promise<unknown>>();

if (!globalForServerCache.__hawklifeServerCache) {
  globalForServerCache.__hawklifeServerCache = serverCache;
}

if (!globalForServerCache.__hawklifeServerInflight) {
  globalForServerCache.__hawklifeServerInflight = inflight;
}

export async function remember<T>(key: string, ttlMs: number, loader: () => Promise<T>) {
  const now = Date.now();
  const existing = serverCache.get(key);
  if (existing && existing.expiresAt > now) {
    return existing.value as T;
  }

  const pending = inflight.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const task = loader()
    .then((value) => {
      serverCache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, task);
  return task;
}

export function forget(key: string) {
  serverCache.delete(key);
  inflight.delete(key);
}

export function forgetByPrefix(prefix: string) {
  for (const key of serverCache.keys()) {
    if (key.startsWith(prefix)) {
      serverCache.delete(key);
    }
  }

  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) {
      inflight.delete(key);
    }
  }
}
