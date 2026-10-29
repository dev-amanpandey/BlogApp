const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function register(req, res) {
  const { username, email, password } = req.body || {};
  if (typeof username !== "string" || username.trim().length < 3 || username.trim().length > 30 || !/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    return res.status(400).json({ error: { message: "username must be 3-30 letters, numbers, or underscores" } });
  }
  if (typeof email !== "string" || email.length > 254 || !emailPattern.test(email.trim())) {
    return res.status(400).json({ error: { message: "A valid email is required" } });
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: { message: "password must be 8-128 characters" } });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ $or: [{ username: username.trim() }, { email: normalizedEmail }] }).select("username email").lean();
  if (existing) return res.status(409).json({ error: { message: "Username or email already exists" } });
  const user = await User.create({ username: username.trim(), email: normalizedEmail, password: await bcrypt.hash(password, 12) });
  res.status(201).json({ user: user.toJSON() });
}

async function login(req, res) {
  const { email, password } = req.body || {};
  if (typeof email !== "string" || !emailPattern.test(email.trim()) || typeof password !== "string" || !password.length || password.length > 128) {
    return res.status(400).json({ error: { message: "A valid email and password are required" } });
  }
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: { message: "Invalid email or password" } });
  }
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.json({ token, user: user.toJSON() });
}

module.exports = { register, login };
