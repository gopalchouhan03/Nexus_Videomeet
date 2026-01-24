import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.middleware.js";
import logger from "./utils/logger.js";

dotenv.config();

/* -------------------- APP & SERVER -------------------- */
const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("trust proxy", 1);

/* -------------------- HELMET (API SAFE) -------------------- */
app.use(
    helmet({
        contentSecurityPolicy: false,      // ❗ CSP breaks APIs
        crossOriginResourcePolicy: false,  // ❗ Needed for cross-origin APIs
    })
);

/* -------------------- CORS CONFIG -------------------- */
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.FRONTEND_URL, // CloudFront frontend URL
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser requests (Postman, curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        logger.warn("❌ CORS blocked", { origin });
        callback(new Error("CORS not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

/* 🔥 CRITICAL: Explicit preflight handling */
app.options("*", cors(corsOptions));

/* -------------------- BODY PARSERS -------------------- */
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

/* -------------------- RATE LIMITERS -------------------- */

// General API limiter
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) =>
        req.method === "OPTIONS" ||
        process.env.NODE_ENV === "development",
});

// Auth limiter (login/register)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) =>
        req.method === "OPTIONS" ||
        process.env.NODE_ENV === "development",
});

/* -------------------- ROUTES -------------------- */
app.use("/api", generalLimiter);

app.use("/api/v1/users/login", authLimiter);
app.use("/api/v1/users/register", authLimiter);
app.use("/api/v1/users", userRoutes);

/* -------------------- DEBUG ENDPOINTS -------------------- */
// Temporary: Check environment variables (REMOVE IN PRODUCTION)
app.get("/debug/env", (req, res) => {
    const isProd = process.env.NODE_ENV === "production";
    if (isProd) {
        return res.status(403).json({ message: "Not available in production" });
    }
    
    res.json({
        NODE_ENV: process.env.NODE_ENV,
        JWT_SECRET_exists: !!process.env.JWT_SECRET,
        JWT_SECRET_length: process.env.JWT_SECRET?.length || 0,
        JWT_REFRESH_SECRET_exists: !!process.env.JWT_REFRESH_SECRET,
        JWT_REFRESH_SECRET_length: process.env.JWT_REFRESH_SECRET?.length || 0,
        MONGODB_URL_exists: !!process.env.MONGODB_URL,
        FRONTEND_URL: process.env.FRONTEND_URL,
        PORT: process.env.PORT,
    });
});

/* -------------------- ERROR HANDLERS -------------------- */
app.use(notFoundHandler);
app.use(errorHandler);

/* -------------------- SERVER START -------------------- */
const PORT = process.env.PORT || 8000;

const startServer = async () => {
    try {
        const db = await mongoose.connect(process.env.MONGODB_URL);

        logger.info("✅ MongoDB connected", {
            host: db.connection.host,
            db: db.connection.name,
        });

        server.listen(PORT, () => {
            logger.info(`✅ Server running on port ${PORT}`, {
                env: process.env.NODE_ENV,
                allowedOrigins,
            });
        });

        /* -------------------- GRACEFUL SHUTDOWN -------------------- */
        process.on("SIGTERM", () => {
            logger.info("SIGTERM received. Shutting down...");
            server.close(() => {
                mongoose.connection.close(false, () => {
                    logger.info("MongoDB closed");
                    process.exit(0);
                });
            });
        });
    } catch (err) {
        logger.error("❌ Server startup failed", {
            message: err.message,
            stack: err.stack,
        });
        process.exit(1);
    }
};

startServer();

export { app, server, io };
