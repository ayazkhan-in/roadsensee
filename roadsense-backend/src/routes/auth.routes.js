import { Router } from "express";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

function authPayload(user) {
  return { userId: user._id.toString(), role: user.role };
}

async function ensureDemoAccount(email, role, password) {
  const existing = await User.findOne({ email: email.toLowerCase(), role });
  if (existing) {
    return existing;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  return User.create({
    name: role === "admin" ? "Demo Admin" : "Demo Citizen",
    email: email.toLowerCase(),
    passwordHash,
    role,
  });
}

function authResponse(user) {
  const payload = authPayload(user);

  return {
    accessToken: createAccessToken(payload),
    refreshToken: createRefreshToken(payload),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "name, email, password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role: "citizen" });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: authResponse(user),
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "email and password are required" });
    }

    if (email.toLowerCase() === "citizen@roadsense.com") {
      await ensureDemoAccount(email, "citizen", "password123");
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    return res.status(200).json({ success: true, message: "Login successful", data: authResponse(user) });
  })
);

router.post(
  "/admin/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "email and password are required" });
    }

    if (email.toLowerCase() === "admin@roadsense.com") {
      await ensureDemoAccount(email, "admin", "admin1234");
    }

    const user = await User.findOne({ email: email.toLowerCase(), role: "admin" });
    if (!user) {
      return res.status(403).json({ success: false, message: "Admin account not found" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    return res.status(200).json({ success: true, message: "Admin login successful", data: authResponse(user) });
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "refreshToken is required" });
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    return res.status(200).json({
      success: true,
      message: "Token refreshed",
      data: {
        accessToken: createAccessToken(authPayload(user)),
      },
    });
  })
);

router.post("/logout", (req, res) => {
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  })
);

export default router;
