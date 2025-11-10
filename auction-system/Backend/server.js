import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import authRoutes from "./routes/auth.js";
import guestRoutes from "./routes/guest.js";
import bidderRoutes from "./routes/bidder.js";
import sellerRoutes from "./routes/seller.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

<<<<<<< HEAD
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true, // Cho phép gửi cookies
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies cho refresh token

// ═══════════════════════════════════════════════════
// PASSPORT OAUTH (Google, Facebook)
// ═══════════════════════════════════════════════════
app.use(passport.initialize());

// ═══════════════════════════════════════════════════
// ROUTES - PHÂN CÔNG THEO TỪNG NGƯỜI
// ═══════════════════════════════════════════════════
app.use("/api/auth", authRoutes); // Auth routes (CHUNG)
app.use("/api/guest", guestRoutes); // Guest routes (KHẢI)
app.use("/api/bidder", bidderRoutes); // Bidder routes (KHOA)
app.use("/api/seller", sellerRoutes); // Seller routes (CƯỜNG)
app.use("/api/admin", adminRoutes); // Admin routes (THẮNG)

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Auction Backend API is running!",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║   🚀 AUCTION BACKEND API RUNNING                  ║
║   📍 http://localhost:${PORT}                       ║
║   🌍 Environment: ${process.env.NODE_ENV}          ║
║   🔗 Frontend: ${process.env.FRONTEND_URL}         ║
║   🔐 Auth: JWT + Refresh Token (HTTP-only cookie) ║
╚═══════════════════════════════════════════════════╝
  `);
});

export default app;
