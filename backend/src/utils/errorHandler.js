/**
 * Custom Error Class
 * Used for throwing application-specific errors with status codes
 */
export class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.code = "APP_ERROR";
        this.timestamp = new Date();
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors automatically
 * Usage: router.get("/path", asyncHandler(async (req, res) => {...}))
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
