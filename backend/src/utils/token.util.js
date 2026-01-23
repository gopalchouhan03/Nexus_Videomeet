import jwt from "jsonwebtoken";
import logger from "./logger.js";

/**
 * Token Utility Module
 * Centralized JWT token generation and verification
 * 
 * Design Principles:
 * - Single source of truth for token configuration
 * - Explicit error handling (no silent failures)
 * - Environment-based configuration
 * - Clear separation of access vs refresh tokens
 */

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Token lifetimes (align with .env)
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "30d"; // 30 days

/**
 * Validate that required JWT secrets are configured
 * @throws {Error} If JWT secrets are not set in environment
 */
const validateSecrets = () => {
    if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
        const error = new Error(
            "JWT secrets not configured. Set JWT_SECRET and JWT_REFRESH_SECRET in .env"
        );
        logger.error("JWT configuration error", {
            JWT_SECRET_exists: !!JWT_SECRET,
            JWT_REFRESH_SECRET_exists: !!JWT_REFRESH_SECRET,
        });
        throw error;
    }
};

/**
 * Generate Access Token
 * @param {Object} payload - User data to encode (userId, username, name)
 * @param {string} payload.userId - User ID from MongoDB
 * @param {string} payload.username - User username
 * @param {string} payload.name - User full name
 * @returns {string} Signed JWT access token
 * @throws {Error} If token generation fails
 */
export const generateAccessToken = (payload) => {
    try {
        validateSecrets();

        if (!payload.userId) {
            throw new Error("userId is required for access token");
        }

        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: ACCESS_TOKEN_EXPIRY,
            algorithm: "HS256",
            issuer: "nexus-api",
            subject: String(payload.userId),
        });

        logger.debug("Access token generated", {
            userId: payload.userId,
            expiresIn: ACCESS_TOKEN_EXPIRY,
        });

        return token;
    } catch (error) {
        logger.error("Failed to generate access token", {
            error: error.message,
            payload: { userId: payload.userId },
        });
        throw error;
    }
};

/**
 * Generate Refresh Token
 * @param {string} userId - User ID from MongoDB
 * @returns {Object} Token string and expiration date
 * @returns {string} returns.token - Signed JWT refresh token
 * @returns {Date} returns.expiresAt - Token expiration timestamp
 * @throws {Error} If token generation fails
 */
export const generateRefreshToken = (userId) => {
    try {
        validateSecrets();

        if (!userId) {
            throw new Error("userId is required for refresh token");
        }

        const token = jwt.sign({ userId: String(userId) }, JWT_REFRESH_SECRET, {
            expiresIn: REFRESH_TOKEN_EXPIRY,
            algorithm: "HS256",
            issuer: "nexus-api",
            subject: String(userId),
        });

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

        logger.debug("Refresh token generated", {
            userId,
            expiresIn: REFRESH_TOKEN_EXPIRY,
        });

        return { token, expiresAt };
    } catch (error) {
        logger.error("Failed to generate refresh token", {
            error: error.message,
            userId,
        });
        throw error;
    }
};

/**
 * Verify Access Token
 * @param {string} token - JWT token from Authorization header
 * @returns {Object} Decoded token payload (userId, username, name, iat, exp, iss, sub)
 * @throws {Object} Detailed error object with code and message
 */
export const verifyAccessToken = (token) => {
    try {
        validateSecrets();

        if (!token) {
            const error = new Error("Token is required");
            error.code = "NO_TOKEN";
            error.statusCode = 401;
            throw error;
        }

        const decoded = jwt.verify(token, JWT_SECRET, {
            algorithms: ["HS256"],
            issuer: "nexus-api",
        });

        logger.debug("Access token verified", { userId: decoded.userId });
        return decoded;
    } catch (error) {
        // Handle specific JWT errors
        if (error.name === "TokenExpiredError") {
            error.code = "TOKEN_EXPIRED";
            error.message = "Token expired, please refresh";
            error.statusCode = 401;
            logger.warn("Access token expired", { exp: error.expiredAt });
        } else if (error.name === "JsonWebTokenError") {
            error.code = "INVALID_TOKEN";
            error.message = "Invalid authentication token";
            error.statusCode = 403;
            logger.warn("Invalid access token", { error: error.message });
        } else if (error.name === "NotBeforeError") {
            error.code = "NOT_BEFORE";
            error.message = "Token not yet valid";
            error.statusCode = 401;
        } else if (!error.code) {
            // Catch other errors
            error.code = "TOKEN_VERIFICATION_ERROR";
            error.statusCode = 500;
            logger.error("Unexpected token verification error", { error: error.message });
        }

        throw error;
    }
};

/**
 * Verify Refresh Token
 * @param {string} token - JWT refresh token from cookie or database
 * @returns {Object} Decoded token payload (userId, iat, exp, iss, sub)
 * @throws {Object} Detailed error object with code and message
 */
export const verifyRefreshToken = (token) => {
    try {
        validateSecrets();

        if (!token) {
            const error = new Error("Refresh token is required");
            error.code = "NO_REFRESH_TOKEN";
            error.statusCode = 401;
            throw error;
        }

        const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
            algorithms: ["HS256"],
            issuer: "nexus-api",
        });

        logger.debug("Refresh token verified", { userId: decoded.userId });
        return decoded;
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            error.code = "REFRESH_TOKEN_EXPIRED";
            error.message = "Refresh token expired, please login again";
            error.statusCode = 401;
            logger.warn("Refresh token expired", { exp: error.expiredAt });
        } else if (error.name === "JsonWebTokenError") {
            error.code = "INVALID_REFRESH_TOKEN";
            error.message = "Invalid refresh token";
            error.statusCode = 403;
            logger.warn("Invalid refresh token", { error: error.message });
        } else if (!error.code) {
            error.code = "REFRESH_TOKEN_VERIFICATION_ERROR";
            error.statusCode = 500;
            logger.error("Unexpected refresh token verification error", { error: error.message });
        }

        throw error;
    }
};

/**
 * Decode token without verification
 * Used for extracting token info before verification
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        logger.error("Failed to decode token", { error: error.message });
        return null;
    }
};

/**
 * Get token configuration for reference
 * @returns {Object} Token configuration
 */
export const getTokenConfig = () => ({
    accessTokenExpiry: ACCESS_TOKEN_EXPIRY,
    refreshTokenExpiry: REFRESH_TOKEN_EXPIRY,
    algorithm: "HS256",
    issuer: "nexus-api",
});
