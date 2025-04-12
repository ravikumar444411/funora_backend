const admin = require("../config/firebaseAdmin");
const { verifyAndDecodeToken } = require("../utils/tokenService");

const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken; // Attach user data to request
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: "Invalid token", error });
    }
};



const customAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized: No token provided",
            });
        }

        const encryptedToken = authHeader.split(" ")[1];

        const { success, data, message } = await verifyAndDecodeToken(encryptedToken);

        if (!success) {
            return res.status(403).json({
                success: false,
                message: message || "Invalid or expired token",
            });
        }

        // Optional: Add extra expiry check (jwt.verify does this too)
        if (data.exp && Date.now() >= data.exp * 1000) {
            return res.status(403).json({
                success: false,
                message: "Token has expired",
            });
        }

        req.body.userData = data; // Attach decoded user data to req.body
        next(); // Proceed to next middleware/controller

    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during authentication",
        });
    }
};

module.exports = { authMiddleware, customAuthMiddleware };
