import logger from "../utils/logger.js";

/**
 * Global Error Handling Middleware
 * Catches all errors and sends safe responses
 * Stack traces are logged server-side but not sent to client
 *
 * IMPORTANT: This must be the LAST middleware registered in app.js
 * Usage: app.use(errorHandler) at the very end
 */
export const errorHandler = (err, req, res, next) => {
    // Set default status code
    const statusCode = err.statusCode || 500;
    const isDevelopment = process.env.NODE_ENV === "development";

    // Log error details (always, for debugging)
    logger.error("Request error", {
        statusCode,
        message: err.message,
        code: err.code,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.user?.userId,
        stack: isDevelopment ? err.stack : undefined, // Include stack only in dev
    });

    // Prepare response message
    let responseMessage = err.message || "Internal server error";

    // In production, hide error details
    if (!isDevelopment && statusCode === 500) {
        responseMessage = "An error occurred. Please try again later.";
    }

    // Send error response
    res.status(statusCode).json({
        code: err.code || "SERVER_ERROR",
        message: responseMessage,
        ...(isDevelopment && { details: err.message }), // Include details in dev only
    });
};

/**
 * 404 Not Found Middleware
 * Handles requests to non-existent routes
 * Should be registered AFTER all other routes
 */
export const notFoundHandler = (req, res) => {
    logger.warn("Route not found", {
        path: req.path,
        method: req.method,
        ip: req.ip,
    });

    res.status(404).json({
        code: "NOT_FOUND",
        message: `Route ${req.method} ${req.path} not found`,
    });
};
