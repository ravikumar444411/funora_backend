const { Redis } = require("ioredis");

const redisConnection = new Redis({
    host: "127.0.0.1", // Redis server host
    port: 6379, // Default Redis port
    maxRetriesPerRequest: null, // Prevents retry exhaustion issues
    enableReadyCheck: false // Avoids unnecessary readiness checks
});

redisConnection.on("connect", () => {
    console.log("✅ Connected to Redis successfully!");
});

redisConnection.on("error", (err) => {
    console.error("❌ Redis connection error:", err);
});

module.exports = redisConnection;
