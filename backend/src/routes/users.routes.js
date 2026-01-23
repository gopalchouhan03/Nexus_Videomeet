import { Router } from "express";
import {
    login,
    register,
    getUserHistory,
    addToHistory,
    logout,
    refreshTokenController,
} from "../controllers/user.controller.js";
import {
    sendInvitation,
    getInvitationsSent,
    updateInvitationStatus
} from "../controllers/invitation.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import {
    loginValidator,
    registerValidator,
    addToHistoryValidator,
} from "../validators/user.validator.js";

const router = Router();

/**
 * ==================== PUBLIC ROUTES ====================
 * No authentication required
 */

// Register new user
router.post("/register", validateRequest(registerValidator), register);

// Login user
router.post("/login", validateRequest(loginValidator), login);

/**
 * ==================== AUTH ROUTES ====================
 * Refresh token and logout
 */

// Refresh access token (using refresh token from cookie)
router.post("/refresh", refreshTokenController);

// Logout user (invalidates refresh token)
router.post("/logout", authMiddleware, logout);

/**
 * ==================== PROTECTED ROUTES ====================
 * Require valid access token
 */

// Add meeting to user history
router.post(
    "/add_to_activity",
    authMiddleware,
    validateRequest(addToHistoryValidator),
    addToHistory
);

// Get all meetings for user
router.get("/get_all_activity", authMiddleware, getUserHistory);

/**
 * ==================== INVITATION ROUTES ====================
 */

// Send invitation
router.post("/send-invitation", sendInvitation);

// Get invitations sent by user
router.get("/invitations-sent", getInvitationsSent);

// Update invitation status
router.put("/update-invitation", updateInvitationStatus);

export default router;