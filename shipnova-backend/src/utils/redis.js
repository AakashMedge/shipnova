const Redis = require("ioredis");

// Singleton Redis client with graceful offline handling
const client = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: (times) => {
    // Stop retrying after 3 attempts — the app works without Redis
    if (times > 3) return null;
    return Math.min(times * 200, 1000);
  },
  maxRetriesPerRequest: 1,
});

client.on("connect", () => console.log("✅ Redis connected"));
client.on("error", (err) => {
  // Non-fatal: log once, do not crash server
  if (err.message !== client._lastRedisError) {
    console.warn(`⚠️  Redis unavailable (non-fatal): ${err.message}`);
    client._lastRedisError = err.message;
  }
});

/**
 * Safe GET — returns null if Redis is down
 */
const getCache = async (key) => {
  try {
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

/**
 * Safe SET with TTL — silently fails if Redis is down
 */
const setCache = async (key, value, ttlSeconds = 60) => {
  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Silently ignore
  }
};

/**
 * Safe DEL — silently fails if Redis is down
 */
const delCache = async (key) => {
  try {
    await client.del(key);
  } catch {
    // Silently ignore
  }
};

module.exports = { client, getCache, setCache, delCache };
