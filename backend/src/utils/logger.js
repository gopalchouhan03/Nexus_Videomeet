import winston from "winston";
import fs from "fs";
import path from "path";

// Create logs directory if it doesn't exist
const logsDir = "logs";
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

/**
 * Winston Logger Configuration
 * Logs to files and console with structured JSON format
 */
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: "video-call-api" },
    transports: [
        // Error logs
        new winston.transports.File({
            filename: path.join(logsDir, "error.log"),
            level: "error",
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // All logs
        new winston.transports.File({
            filename: path.join(logsDir, "combined.log"),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});

// Add console transport in development
if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ level, message, timestamp, ...meta }) => {
                    return `${timestamp} [${level}]: ${message} ${
                        Object.keys(meta).length ? JSON.stringify(meta) : ""
                    }`;
                })
            ),
        })
    );
}

export default logger;
