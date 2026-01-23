import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Meeting } from "../models/meeting.model.js";
import { asyncHandler, AppError } from "../utils/errorHandler.js";
import logger from "../utils/logger.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-in-production";
const JWT_EXPIRY = "7d"; // 7 days for access token
const REFRESH_EXPIRY = "30d"; // 30 days for refresh token

/**
 * Login Controller
 * Authenticates user and returns JWT tokens
 */
const login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Find user by username (include refreshTokens which has select: false)
    const user = await User.findOne({ username: username.toLowerCase() }).select("+refreshTokens");
    if (!user || !user.isActive) {
        logger.warn("Login failed - user not found", { username, ip: req.ip });
        throw new AppError("Invalid username or password", 401);
    }

    // Compare passwords
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        logger.warn("Login failed - wrong password", { username, ip: req.ip });
        throw new AppError("Invalid username or password", 401);
    }

    // Generate access token
    const accessToken = jwt.sign(
        {
            userId: user._id,
            username: user.username,
            name: user.name,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
        { userId: user._id },
        JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRY }
    );

    // Store refresh token in database
    user.refreshTokens.push(refreshToken);
    user.lastLogin = new Date();
    await user.save();

    logger.info("User login successful", {
        userId: user._id,
        username: user.username,
        ip: req.ip,
    });

    // Send response with tokens
    return res.status(httpStatus.OK).json({
        success: true,
        message: "Login successful",
        token: accessToken,
        refreshToken,
        user: {
            id: user._id,
            username: user.username,
            name: user.name,
        },
    });
});

/**
 * Register Controller
 * Creates new user account with hashed password
 */
const register = asyncHandler(async (req, res) => {
    const { name, username, password, email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
        logger.warn("Registration failed - username exists", { username, ip: req.ip });
        throw new AppError("Username already taken", 409);
    }

    // Check if email already exists (if provided)
    if (email) {
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            logger.warn("Registration failed - email exists", { email, ip: req.ip });
            throw new AppError("Email already registered", 409);
        }
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
        name: name.trim(),
        username: username.toLowerCase(),
        password: hashedPassword,
        email: email ? email.toLowerCase() : null,
        refreshTokens: [],
    });

    await newUser.save();

    logger.info("User registered successfully", {
        userId: newUser._id,
        username: newUser.username,
        ip: req.ip,
    });

    return res.status(httpStatus.CREATED).json({
        success: true,
        message: "User registered successfully",
        userId: newUser._id,
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
 * Removes refresh token from database
 */
const logout = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { refreshToken } = req.body;

    // Remove refresh token from database
    if (refreshToken) {
        await User.findByIdAndUpdate(
            userId,
            { $pull: { refreshTokens: refreshToken } },
            { new: true }
        );
    }

    logger.info("User logged out", { userId });

    return res
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .status(httpStatus.OK)
        .json({
            success: true,
            message: "Logged out successfully",
        });
});

/**
 * Refresh Token Controller
 * Issues new access token using refresh token
 */
const refreshTokenController = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new AppError("Refresh token required", 400);
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const userId = decoded.userId;

        // Check if token exists in database
        const user = await User.findById(userId).select("+refreshTokens");
        if (!user || !user.refreshTokens.includes(refreshToken)) {
            logger.warn("Invalid refresh token", { userId });
            throw new AppError("Invalid refresh token", 403);
        }

        // Generate new access token
        const newAccessToken = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                name: user.name,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        logger.info("Token refreshed", { userId });

        return res.status(httpStatus.OK).json({
            success: true,
            token: newAccessToken,
        });
    } catch (error) {
        logger.warn("Token refresh failed", { error: error.message });
        throw new AppError("Invalid or expired refresh token", 403);
    }
});

export { login, register, getUserHistory, addToHistory, logout, refreshTokenController };