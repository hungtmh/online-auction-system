import express from "express";
import passport from "../config/passport.js";
import jwt from "jsonwebtoken";
import { register, login, refresh, logout, getProfile, resendVerification } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";

// ═══════════════════════════════════════════════════════════════════════════
// TRADITIONAL AUTH (Email + Password)
// ═══════════════════════════════════════════════════════════════════════════
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/profile", authenticate, getProfile);
router.post("/resend-verification", resendVerification);

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE OAUTH
// ═══════════════════════════════════════════════════════════════════════════
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/?error=google_auth_failed`,
    session: false,
  }),
  (req, res) => {
    // Tạo JWT token cho user
    const accessToken = jwt.sign({ userId: req.user.id, email: req.user.email }, JWT_SECRET, { expiresIn: "15m" });

    const refreshToken = jwt.sign({ userId: req.user.id }, JWT_SECRET, { expiresIn: "7d" });

    // Lưu refresh token vào cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect về Frontend với access token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
  }
);
//console.log("🔍 Passport instance in routes:", passport);
//console.log("📋 Available strategies in routes:", Object.keys(passport._strategies));

export default router;
