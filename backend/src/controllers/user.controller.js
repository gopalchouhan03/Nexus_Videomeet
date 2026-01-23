import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import { RefreshToken } from "../models/refreshToken.model.js";
import bcrypt from "bcrypt";
import { Meeting } from "../models/meeting.model.js";
import { asyncHandler, AppError } from "../utils/errorHandler.js";
import logger from "../utils/logger.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from "../utils/token.util.js";

/**
 * Login Controller
 * Enterprise-grade authentication with token rotation
 *
 * Flow:
 * 1. Validate credentials (username, password)
 * 2. Hash and compare password
 * 3. Generate access token (15m)
 * 4. Generate and store refresh token (30d)
 * 5. Set HTTP-only cookie for refresh token
 * 6. Return access token in response
 *
 * @param {Object} req.body - { username, password }
 * @returns {Object} Access token + user data (refresh token in cookie)
 */
const login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Step 1: Find user by username
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user || !user.isActive) {
        logger.warn("Login failed - user not found or inactive", {
            username,
            ip: req.ip,
        });
        throw new AppError("Invalid username or password", 401);
    }

    // Step 2: Compare password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        logger.warn("Login failed - incorrect password", {
            userId: user._id,
            username,
            ip: req.ip,
        });
        throw new AppError("Invalid username or password", 401);
    }

    // Step 3: Generate access token
    const accessToken = generateAccessToken({
        userId: user._id,
        username: user.username,
        name: user.name,
    });

    // Step 4: Generate and store refresh token
    const { token: refreshToken, expiresAt } = generateRefreshToken(user._id);

    // Save refresh token to database
    const refreshTokenRecord = new RefreshToken({
        userId: user._id,
        token: refreshToken,
        expiresAt,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || null,
    });

    await refreshTokenRecord.save();

    // Step 5: Update user last login
    user.lastLogin = new Date();
    await user.save();

    // Step 6: Set HTTP-only cookie (for browsers)
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true, // Prevent JavaScript access
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "Strict", // CSRF protection
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/api/v1/auth",
    });

    logger.info("User login successful", {
        userId: user._id,
        username: user.username,
        ip: req.ip,
    });

    // Step 7: Return tokens and user data
    return res.status(httpStatus.OK).json({
        success: true,
        message: "Login successful",
        data: {
            accessToken,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
            },
        },
    });
});

/**
 * Register Controller
 * Creates new user account with password hashing
 *
 * Validation:
 * - Username must be unique and 3-20 chars
 * - Email must be unique (optional)
 * - Password must be 8+ chars (validated by validator)
 * - Name is required and trimmed
 *
 * @param {Object} req.body - { name, username, password, email }
 * @returns {Object} User ID and success message
 */
const register = asyncHandler(async (req, res) => {
    const { name, username, password, email } = req.body;

    // Step 1: Check if username already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
        logger.warn("Registration failed - username exists", {
            username,
            ip: req.ip,
        });
        throw new AppError("Username already taken", 409);
    }

    // Step 2: Check if email already exists (if provided)
    if (email) {
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            logger.warn("Registration failed - email exists", {
                email,
                ip: req.ip,
            });
            throw new AppError("Email already registered", 409);
        }
    }

    // Step 3: Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 4: Create new user
    const newUser = new User({
        name: name.trim(),
        username: username.toLowerCase(),
        password: hashedPassword,
        email: email ? email.toLowerCase() : null,
    });

    await newUser.save();

    logger.info("User registered successfully", {
        userId: newUser._id,
        username: newUser.username,
        ip: req.ip,
    });

    // Step 5: Return success response
    return res.status(httpStatus.CREATED).json({
        success: true,
        message: "User registered successfully",
        data: {
            userId: newUser._id,
            username: newUser.username,
            email: newUser.email,
        },
    });
});

/**
 * Get User Meeting History
 * Returns all meetings the user has joined
 */
const getUserHistory = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    // Find all meetings for this user
    const meetings = await Meeting.find({ user_id: userId })
        .sort({ date: -1 }) // Most recent first
        .limit(50); // Limit to 50 meetings

    logger.info("User history retrieved", { userId });

    return res.status(httpStatus.OK).json({
        success: true,
        data: meetings,
    });
});

/**
 * Add Meeting to User History
 * Records when a user joins a meeting
 */
const addToHistory = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { meeting_code } = req.body;

    // Find user to get username
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError("User not found", 404);
    }

    // Create meeting record
    const newMeeting = new Meeting({
        user_id: userId,
        username: user.username,
        meetingCode: meeting_code,
        joinedAt: new Date(),
    });

    await newMeeting.save();

    logger.info("Meeting added to history", {
        userId,
        meetingCode: meeting_code,
    });

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: "Meeting added to history",
        meetingId: newMeeting._id,
    });
});

/**
 * Logout Controller
 * Revokes refresh token and clears cookies
 *
 * Flow:
 * 1. Extract refresh token from cookie or request
 * 2. Mark token as revoked in database
 * 3. Clear refresh token cookie
 * 4. Return success response
 *
 * After logout:
 * - Token cannot be used for refresh
 * - All sessions with this token are terminated
 *
 * @returns {Object} Success message
 */
const logout = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    logger.info("User logout initiated", {
        userId,
        ip: req.ip,
    });

    // Step 1: Revoke refresh token if provided
    if (refreshToken) {
        try {
            await RefreshToken.updateOne(
                { token: refreshToken },
                {
                    revoked: true,
                    revokedAt: new Date(),
                }
            );

            logger.info("Refresh token revoked", {
                userId,
            });
        } catch (error) {
            logger.warn("Failed to revoke refresh token", {
                userId,
                error: error.message,
            });
            // Don't fail logout if token revocation fails
        }
    }

    // Step 2: Clear cookie
    res.clearCookie("refreshToken", {
        path: "/api/v1/auth",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
    });

    logger.info("User logged out successfully", {
        userId,
        ip: req.ip,
    });

    // Step 3: Return success
    return res.status(httpStatus.OK).json({
        success: true,
        message: "Logged out successfully",
    });
});

/**
 * Refresh Token Controller
 * Issues new access token and rotates refresh token
 *
 * Token Rotation Flow:
 * 1. Extract refresh token from cookie
 * 2. Verify JWT signature
 * 3. Check if token exists in DB and not revoked
 * 4. Revoke old refresh token
 * 5. Issue new access token
 * 6. Issue new refresh token (rotation)
 * 7. Set new cookie
 *
 * Security:
 * - Old token immediately invalidated
 * - Only one valid token per session
 * - Prevents token reuse attacks
 *
 * @returns {Object} New access token (new refresh token in cookie)
 */
const refreshTokenController = asyncHandler(async (req, res) => {
    // Step 1: Extract refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
        logger.warn("Refresh attempt - no token provided", {
            ip: req.ip,
        });
        throw new AppError("Refresh token missing", 401);
    }

    // Step 2: Verify JWT signature
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
        logger.warn("Refresh token verification failed", {
            error: error.message,
            ip: req.ip,
        });
        throw error;
    }

    const userId = decoded.userId;

    // Step 3: Check if token exists in DB and is not revoked
    const tokenRecord = await RefreshToken.findOne({
        token: refreshToken,
        userId: userId,
    });

    if (!tokenRecord) {
        logger.warn("Refresh token not found in database", {
            userId,
            ip: req.ip,
        });
        throw new AppError("Invalid refresh token", 403);
    }

    if (tokenRecord.revoked) {
        logger.warn("Attempt to use revoked refresh token", {
            userId,
            revokedAt: tokenRecord.revokedAt,
            ip: req.ip,
        });
        throw new AppError("Refresh token has been revoked", 401);
    }

    // Step 4: Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
        logger.warn("Refresh token expired", {
            userId,
            expiresAt: tokenRecord.expiresAt,
            ip: req.ip,
        });
        throw new AppError("Refresh token expired, please login again", 401);
    }

    // Step 5: Find user and verify they still exist
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
        logger.warn("User not found or inactive during token refresh", {
            userId,
            ip: req.ip,
        });
        throw new AppError("User no longer exists", 401);
    }

    // Step 6: Revoke old refresh token
    try {
        await RefreshToken.updateOne(
            { _id: tokenRecord._id },
            {
                revoked: true,
                revokedAt: new Date(),
            }
        );

        logger.debug("Old refresh token revoked", { userId });
    } catch (error) {
        logger.error("Failed to revoke old token", {
            userId,
            error: error.message,
        });
        throw new AppError("Token rotation failed", 500);
    }

    // Step 7: Generate new access token
    const newAccessToken = generateAccessToken({
        userId: user._id,
        username: user.username,
        name: user.name,
    });

    // Step 8: Generate new refresh token (rotation)
    const { token: newRefreshToken, expiresAt } = generateRefreshToken(user._id);

    // Step 9: Store new refresh token in database
    try {
        const newTokenRecord = new RefreshToken({
            userId: user._id,
            token: newRefreshToken,
            expiresAt,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"] || null,
        });

        await newTokenRecord.save();

        logger.debug("New refresh token created", { userId });
    } catch (error) {
        logger.error("Failed to store new refresh token", {
            userId,
            error: error.message,
        });
        throw new AppError("Token refresh failed", 500);
    }

    // Step 10: Set new HTTP-only cookie
    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/api/v1/auth",
    });

    logger.info("Token refreshed successfully", {
        userId,
        ip: req.ip,
    });

    // Step 11: Return new access token
    return res.status(httpStatus.OK).json({
        success: true,
        message: "Token refreshed",
        data: {
            accessToken: newAccessToken,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
            },
        },
    });
});

export { login, register, getUserHistory, addToHistory, logout, refreshTokenController };