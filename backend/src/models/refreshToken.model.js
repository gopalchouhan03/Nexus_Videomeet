import mongoose, { Schema } from "mongoose";

/**
 * RefreshToken Model
 * Stores issued refresh tokens for token rotation and revocation
 * 
 * Features:
 * - Track token issuance and expiration
 * - Revoke tokens for logout and security
 * - Prevent token reuse via database validation
 * - Automatic cleanup of expired tokens
 */
const refreshTokenSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        token: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
            // Auto-delete document 5 seconds after expiration
            expires: 5,
        },
        revoked: {
            type: Boolean,
            default: false,
            index: true,
        },
        revokedAt: {
            type: Date,
            default: null,
        },
        ipAddress: {
            type: String,
            default: null,
        },
        userAgent: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

// Compound index for efficient queries
refreshTokenSchema.index({ userId: 1, revoked: 1 });
refreshTokenSchema.index({ userId: 1, expiresAt: 1 });

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

export { RefreshToken };
