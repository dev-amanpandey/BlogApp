const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

async function requireAuth(req, res, next) {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: { message: "Authentication required" } });
  try {
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("username email").lean();
    if (!user) return res.status(401).json({ error: { message: "Invalid authentication token" } });
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ error: { message: "Invalid or expired token" } });
    }
    next(error);
  }
}

module.exports = requireAuth;
