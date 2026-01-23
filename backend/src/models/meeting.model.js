import mongoose, { Schema } from "mongoose";

const meetingSchema = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        username: {
            type: String,
            required: true,
            trim: true,
        },
        meetingCode: {
            type: String,
            required: true,
            trim: true,
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
        leftAt: {
            type: Date,
            default: null,
        },
        duration: {
            type: Number, // Duration in minutes
            default: 0,
        },
    },
    { timestamps: true }
);

// Index for faster queries
meetingSchema.index({ user_id: 1, joinedAt: -1 });
meetingSchema.index({ meetingCode: 1 });

export const Meeting = mongoose.model("Meeting", meetingSchema);
