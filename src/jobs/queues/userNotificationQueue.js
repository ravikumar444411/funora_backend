// queues/notificationQueue.js
const { Queue } = require("bullmq");
const redisConnection = require("../../config/redis");



// Initialize Redis connection for BullMQ
const userNotificationQueue = new Queue("user-notification-queue", { connection: redisConnection });

module.exports = userNotificationQueue;
