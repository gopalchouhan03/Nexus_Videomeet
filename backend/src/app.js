import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
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

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("trust proxy", 1);

// Security headers with Helmet
app.use(helmet());

// CORS Configuration - Whitelist only allowed origins
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5000",
    process.env.FRONTEND_URL || "http://localhost:3000",
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps, curl requests)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn("CORS blocked request from origin", { origin });
                callback(new Error("CORS not allowed for this origin"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        maxAge: 86400, // 24 hours
    })
);

// Body parser with size limits (prevent large payload attacks)
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ limit: "10kb", extended: true }));

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === "development", // Skip in development
});

// Auth rate limiter - stricter: 5 attempts per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts, please try again later.",
    skipSuccessfulRequests: true, // Don't count successful requests
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === "development",
});

// Apply general limiter to all API routes
app.use("/api/", generalLimiter);

app.use("/api/v1/users/login", authLimiter);
app.use("/api/v1/users/register", authLimiter);
app.use("/api/v1/users", userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.set("port", process.env.PORT || 8000);

const start = async () => {
    try {
        // Connect to MongoDB
        const connectionDb = await mongoose.connect(
            process.env.MONGODB_URL
        );

        logger.info("✅ MongoDB Connected", {
            host: connectionDb.connection.host,
            database: connectionDb.connection.name,
        });

        // Start HTTP server
        server.listen(app.get("port"), () => {
            logger.info(`✅ Server LISTENING ON PORT ${app.get("port")}`, {
                environment: process.env.NODE_ENV,
                corsOrigins: allowedOrigins,
            });
        });

        // Graceful shutdown
        process.on("SIGTERM", () => {
            logger.info("SIGTERM received, shutting down gracefully");
            server.close(() => {
                logger.info("Server closed");
                mongoose.connection.close(false, () => {
                    logger.info("MongoDB connection closed");
                    process.exit(0);
                });
            });
        });
    } catch (err) {
        logger.error("❌ Failed to start server", {
            error: err.message,
            stack: err.stack,
        });
        process.exit(1);
    }
};

start();

export { app, server, io };