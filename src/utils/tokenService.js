const jwt = require("jsonwebtoken");
const jose = require("node-jose");
const crypto = require("crypto");

// Use a fixed encryption secret (store securely in .env)
const SECRET_ENCRYPTION_KEY = process.env.JWT_ENCRYPTION_SECRET;

// Hash function for sensitive data
const hashData = (data) => crypto.createHash("sha256").update(data).digest("hex");


// Create a single encryption key for reuse
let encryptionKey;
const getEncryptionKey = async () => {
    if (!encryptionKey) {
        encryptionKey = await jose.JWK.createKey("oct", 256, { alg: "A256GCM", use: "enc" });
    }
    return encryptionKey;
};

// 🔐 **Generate Encrypted JWT Token**
const generateToken = async (user) => {
    try {
        const payload = {
            userId: user._id,
            email: user.email ? hashData(user.email) : null,
            phone: user.phone ? hashData(user.phone) : null,
            fullName: user.fullName,
            role: user.role,
            dob: user.dob,
            location: user.location,
            preferences: user.preferences,
            profilePicture: user.profilePicture,
        };

        // Create a JWT
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });

        // Encrypt the JWT
        const key = await getEncryptionKey();
        const encryptedToken = await jose.JWE.createEncrypt({ format: "compact" }, key)
            .update(token)
            .final();

        return encryptedToken;
    } catch (error) {
        console.error("Token generation error:", error);
        throw new Error("Error generating secure token");
    }
};

// 🔓 **Verify and Decrypt Token**
const verifyAndDecodeToken = async (encryptedToken) => {
    try {
        // Get the encryption key (ensure it's the same key used for encryption)
        const key = await getEncryptionKey();
        const decryptedResult = await jose.JWE.createDecrypt(key).decrypt(encryptedToken);
        const decryptedToken = decryptedResult.plaintext.toString();

        // Verify the JWT
        const decoded = jwt.verify(decryptedToken, process.env.JWT_SECRET);
        return { success: true, data: decoded };
    } catch (error) {
        console.error("Token decryption error:", error);
        return { success: false, message: "Invalid or expired token" };
    }
};

// 🛡 **Verify JWT Without Decryption**
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return { success: false, message: "Invalid or expired token" };
    }
};

module.exports = { generateToken, verifyToken, verifyAndDecodeToken };
