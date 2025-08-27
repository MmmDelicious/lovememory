const Redis = require('ioredis');

/**
 * Redis Configuration для Job Queue
 */

let redisClient = null;

const createRedisConnection = () => {
  if (redisClient) {
    return redisClient;
  }

  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: null, // BullMQ требует null для блокирующих операций
    lazyConnect: true,
    // Настройки для production
    family: 4,
    keepAlive: true,
    connectTimeout: 10000,
    commandTimeout: 10000, // Увеличиваем timeout для избежания ошибок
  };

  console.log('🔴 Creating Redis connection:', {
    host: redisConfig.host,
    port: redisConfig.port,
    db: redisConfig.db
  });

  redisClient = new Redis(redisConfig);

  redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });

  redisClient.on('error', (error) => {
    console.error('❌ Redis Error:', error);
  });

  redisClient.on('reconnecting', (time) => {
    console.warn(`⚠️ Redis is reconnecting in ${time}ms...`);
  });

  redisClient.on('close', () => {
    // Закомментировано чтобы избежать спама в логах
    // console.log('🔴 Redis connection closed');
  });

  return redisClient;
};

const getRedisClient = () => {
  if (!redisClient) {
    return createRedisConnection();
  }
  return redisClient;
};

const closeRedisConnection = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('🔴 Redis connection closed gracefully');
  }
};

// Проверка соединения
const checkRedisHealth = async () => {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('❌ Redis health check failed:', error.message);
    return false;
  }
};

module.exports = {
  createRedisConnection,
  getRedisClient,
  closeRedisConnection,
  checkRedisHealth
};