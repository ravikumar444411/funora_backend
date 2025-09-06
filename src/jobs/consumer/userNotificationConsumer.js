const userNotificationQueue = require("../queues/userNotificationQueue");
const MasterNotification = require("../models/masterNotification.model");
const User = require("../../models/user.model");
const UserNotification = require("../../models/userNotification.model");

userNotificationQueue.process("distribute-to-users", async (job) => {
    const { masterNotificationId } = job.data;

    try {
        const masterNotification = await MasterNotification.findById(masterNotificationId);

        if (!masterNotification) {
            throw new Error("MasterNotification not found");
        }

        const users = await User.find({ status: "active" });

        const userNotifications = users.map((user) => ({
            userId: user._id,
            notificationId: masterNotification._id,
            status: "pending",
        }));

        await UserNotification.insertMany(userNotifications);

        console.log(`📬 UserNotifications created for ${users.length} users`);
    } catch (err) {
        console.error("❌ Job failed:", err);
        throw err;
    }
});
