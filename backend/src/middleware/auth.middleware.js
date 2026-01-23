import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header
 * Attaches decoded user info to req.user
 *
 * Usage: router.get("/protected", authMiddleware, controllerFunction)
 */
export const authMiddleware = (req, res, next) => {
    try {
        // Extract token from Authorization header (Bearer <token>)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            logger.warn("Missing or invalid Authorization header", {
                path: req.path,
                method: req.method,
                ip: req.ip,
            });

            return res.status(401).json({
                code: "NO_TOKEN",
                message: "No authentication token provided",
            });
        }

        const token = authHeader.split("Bearer ")[1];

        // Verify JWT token
        try {
            const decoded = jwt.verify(token, JWT_SECRET);

            // Attach user info to request
            req.user = decoded;
            logger.info("User authenticated", { userId: decoded.userId, username: decoded.username });
            next();
        } catch (verifyError) {
            if (verifyError.name === "TokenExpiredError") {
                logger.warn("Token expired", { path: req.path });

                return res.status(401).json({
                    code: "TOKEN_EXPIRED",
                    message: "Token has expired. Please login again.",
                });
            }

            if (verifyError.name === "JsonWebTokenError") {
                logger.warn("Invalid token", { 
                    path: req.path, 
                    error: verifyError.message,
                    tokenLength: token ? token.length : 0
                });

                return res.status(401).json({
                    code: "INVALID_TOKEN",
                    message: "Invalid authentication token. Please login again.",
                });
            }

            throw verifyError;
        }
    } catch (error) {
        logger.error("Auth middleware error", { error: error.message });

        return res.status(500).json({
            code: "SERVER_ERROR",
            message: "Authentication error",
        });
    }
};
