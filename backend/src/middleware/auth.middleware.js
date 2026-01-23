import logger from "../utils/logger.js";
import { verifyAccessToken } from "../utils/token.util.js";

/**
 * Authentication Middleware (ZERO FAILURE)
 * 
 * Responsibilities:
 * - Extract JWT from Authorization header
 * - Validate format (Bearer <token>)
 * - Verify token signature and expiration
 * - Attach decoded user to req.user
 * - Return structured errors on failure
 * 
 * Design:
 * - Never throws unhandled errors
 * - Always calls next() on success
 * - Returns JSON errors on failure
 * - Logs all authentication attempts
 * 
 * Usage: router.get("/protected", authMiddleware, controllerFunction)
 */
export const authMiddleware = (req, res, next) => {
    try {
        // Extract Authorization header
        const authHeader = req.headers.authorization;

        // Step 1: Check if header exists
        if (!authHeader) {
            logger.warn("Authentication token missing", {
                path: req.path,
                method: req.method,
                ip: req.ip,
            });

            return res.status(401).json({
                code: "NO_TOKEN",
                message: "Authentication token missing",
            });
        }

        // Step 2: Validate Bearer format
        if (!authHeader.startsWith("Bearer ")) {
            logger.warn("Invalid authorization header format", {
                path: req.path,
                method: req.method,
                ip: req.ip,
                headerStart: authHeader.substring(0, 20),
            });

            return res.status(401).json({
                code: "INVALID_HEADER_FORMAT",
                message: "Invalid authorization header",
            });
        }

        // Step 3: Extract token
        const token = authHeader.slice(7); // Remove "Bearer " prefix

        if (!token || token.trim() === "") {
            logger.warn("Empty token in authorization header", {
                path: req.path,
                method: req.method,
                ip: req.ip,
            });

            return res.status(401).json({
                code: "EMPTY_TOKEN",
                message: "Invalid authorization header",
            });
        }

        // Step 4: Verify token using centralized utility
        try {
            const decoded = verifyAccessToken(token);

            // Step 5: Attach user to request
            req.user = {
                userId: decoded.userId,
                username: decoded.username,
                name: decoded.name,
                iat: decoded.iat,
                exp: decoded.exp,
            };

            logger.debug("User authenticated", {
                userId: decoded.userId,
                username: decoded.username,
                path: req.path,
            });

            // Success: proceed to next middleware
            return next();
        } catch (tokenError) {
            // Token verification failed
            const statusCode = tokenError.statusCode || 401;
            const code = tokenError.code || "TOKEN_VERIFICATION_ERROR";
            const message = tokenError.message || "Invalid authentication token";

            logger.warn("Token verification failed", {
                code,
                message,
                path: req.path,
                method: req.method,
                ip: req.ip,
            });

            return res.status(statusCode).json({
                code,
                message,
            });
        }
    } catch (error) {
        // Unexpected error in middleware itself
        logger.error("Auth middleware error", {
            error: error.message,
            stack: error.stack,
            path: req.path,
            method: req.method,
            ip: req.ip,
        });

        return res.status(500).json({
            code: "AUTH_MIDDLEWARE_ERROR",
            message: "Authentication error",
        });
    }
};
