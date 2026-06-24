const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { sendOTP: sendPhoneOTP } = require("../config/twilio");
const { sendEmailOTP } = require("../config/email");
const cache = require("../config/cache");

// Helper to determine if input is email or phone
const isEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

const sendOtp = async (req, res) => {
  let { identifier, action } = req.body; // action can be 'login' or 'register'

  if (!identifier) {
    return res
      .status(400)
      .json({ error: "Please provide an email or phone number" });
  }

  let type = isEmail(identifier) ? "email" : "phone";

  // Automatically prepend +91 for Indian numbers if not provided
  if (type === "phone" && !identifier.startsWith("+")) {
    identifier = "+91" + identifier;
  }

  try {
    // Find user
    let result = await db.query(`SELECT id FROM users WHERE ${type} = $1`, [
      identifier,
    ]);
    let userId;

    if (action === "login") {
      if (result.rows.length === 0) {
        return res
          .status(400)
          .json({ error: "User not registered, please register first." });
      }
      userId = result.rows[0].id;
    } else if (action === "register") {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "User already registered, please login." });
      }
      // Create pending user
      const insertResult = await db.query(
        `INSERT INTO users (${type}) VALUES ($1) RETURNING id`,
        [identifier],
      );
      userId = insertResult.rows[0].id;
    } else {
      // Default fallback if action not provided (legacy support)
      if (result.rows.length === 0) {
        const insertResult = await db.query(
          `INSERT INTO users (${type}) VALUES ($1) RETURNING id`,
          [identifier],
        );
        userId = insertResult.rows[0].id;
      } else {
        userId = result.rows[0].id;
      }
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP in Redis (cache abstract) for 5 minutes (300 seconds)
    await cache.setEx(`otp:${userId}`, 300, otp);

    // Send OTP
    if (type === "email") {
      await sendEmailOTP(identifier, otp);
    } else {
      await sendPhoneOTP(identifier, otp);
    }

    res.json({ message: `OTP sent to your ${type}`, userId, type });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error while sending OTP" });
  }
};

const verifyOtp = async (req, res) => {
  const rawUserId = req.body.userId;
  const otp = req.body.otp;
  const userId = Number.isInteger(rawUserId)
    ? rawUserId
    : parseInt(rawUserId, 10);

  if (!userId || !otp) {
    return res.status(400).json({ error: "User ID and OTP are required" });
  }

  try {
    const cachedOtp = await cache.get(`otp:${userId}`);

    if (!cachedOtp || cachedOtp !== otp) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }

    // OTP matches, clear it from cache
    await cache.del(`otp:${userId}`);

    // Mark user as verified
    await db.query("UPDATE users SET is_verified = TRUE WHERE id = $1", [
      userId,
    ]);

    // Fetch user to generate token
    const result = await db.query(
      "SELECT id, email, phone, role FROM users WHERE id = $1",
      [userId],
    );
    const user = result.rows[0];

    if (!user) {
      console.error("OTP verification failed: user not found", { userId });
      return res
        .status(500)
        .json({ error: "Server error during OTP verification" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({ message: "Login successful", token, user });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ error: "Server error during OTP verification" });
  }
};

const logout = async (req, res) => {
  // In a stateless JWT setup, logout is typically handled client-side by deleting the token.
  // We can also clear cookies if they were used.
  res.json({ message: "Logout successful" });
};

module.exports = { sendOtp, verifyOtp, logout };
