const Redis = require("ioredis");

const redisUrl = process.env.REDIS_URL;
const isLocalRedis = !redisUrl || /localhost|127\.0\.0\.1/.test(redisUrl);
const redisDisabled = Boolean(process.env.VERCEL) && isLocalRedis;

if (redisDisabled) {
  console.warn("Redis disabled on Vercel (local REDIS_URL detected).");
}

// Singleton Redis client with graceful offline handling
const client = redisDisabled
  ? null
  : new Redis(redisUrl || "redis://127.0.0.1:6379", {
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 1000);
      },
      maxRetriesPerRequest: 1,
    });

if (client) {
  client.on("connect", () => console.log("✅ Redis connected"));
  client.on("error", (err) => {
    if (err.message !== client._lastRedisError) {
      console.warn(`⚠️  Redis unavailable (non-fatal): ${err.message}`);
      client._lastRedisError = err.message;
    }
  });
}

/**
 * Safe GET — returns null if Redis is down
 */
const getCache = async (key) => {
  if (!client) return null;
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
  if (!client) return;
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
  if (!client) return;
  try {
    await client.del(key);
  } catch {
    // Silently ignore
  }
};

module.exports = { client, getCache, setCache, delCache };
