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

router.post("/register", validateRequest(registerValidator), register);
router.post("/login", validateRequest(loginValidator), login);
router.post("/refresh-token", refreshTokenController);

router.post(
    "/add_to_activity",
    authMiddleware,
    validateRequest(addToHistoryValidator),
    addToHistory
);
router.get("/get_all_activity", authMiddleware, getUserHistory);
router.post("/logout", authMiddleware, logout);

router.post("/send-invitation", sendInvitation);
router.get("/invitations-sent", getInvitationsSent);
router.put("/update-invitation", updateInvitationStatus);

export default router;