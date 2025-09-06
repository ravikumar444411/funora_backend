const { Redis } = require("ioredis");

// const redisConnection = new Redis({
//     host: "funora-redis-bvhl3j.serverless.eun1.cache.amazonaws.com", // "16.171.9.190",// "funora-redis-bvhl3j.serverless.eun1.cache.amazonaws.com", // "127.0.0.1", // Redis server host
//     port: 6379, // Default Redis port
//     maxRetriesPerRequest: null, // Prevents retry exhaustion issues
//     enableReadyCheck: false // Avoids unnecessary readiness checks
// });


const redisConnection = new Redis({
    host: "127.0.0.1",   // connect via local SSH tunnel
    port: 6379,          // forwarded port
    tls: {
        checkServerIdentity: () => null   // skip hostname validation
    },
    retryStrategy: () => null
    // maxRetriesPerRequest: null,
    // enableReadyCheck: false
});

redisConnection.on("connect", () => {
    console.log("✅ Connected to Redis successfully!");
});

redisConnection.on("error", (err) => {
    // console.error("❌ Redis connection error:", err);
});

module.exports = redisConnection;
