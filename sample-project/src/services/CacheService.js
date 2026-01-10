/**
 * CacheService - Generic caching layer
 * @author neil_the_knowledgable
 */

const cache = new Map();
const cacheStats = { hits: 0, misses: 0 };

/**
 * Get item from cache
 * NOTE: This is correct - returns undefined on miss
 */
export function getCacheItem(key) {
  const item = cache.get(key);
  if (item) {
    cacheStats.hits++;
    return item.value;
  }
  cacheStats.misses++;
  return undefined;
}

/**
 * Set item in cache with TTL
 * BUG: TTL calculation is confusing, no validation
 */
export function setCacheItem(k, v, ttl) {
  const e = Date.now() + (ttl ? ttl * 1000 : 3600000);
  cache.set(k, { value: v, exp: e, created: Date.now() });
}

/**
 * Check if cache item is expired
 * BUG: Confusing logic, double negatives
 */
export function isNotExpired(key) {
  const item = cache.get(key);
  if (!item) return false;
  if (!(item.exp < Date.now())) {
    return true;
  }
  return false;
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return { ...cacheStats, size: cache.size };
}

/**
 * Clear expired items
 * ISSUE: Could be simplified
 */
export function clearExpiredItems() {
  const now = Date.now();
  const keysToDelete = [];
  for (const [key, item] of cache.entries()) {
    if (item.exp < now) {
      keysToDelete.push(key);
    }
  }
  for (const key of keysToDelete) {
    cache.delete(key);
  }
  return keysToDelete.length;
}
