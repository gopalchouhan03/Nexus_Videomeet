import mongoose, { Schema } from "mongoose";

const userScheme = new Schema(
    {
        name: { 
            type: String, 
            required: true,
            trim: true,
            maxlength: 50
        },
        username: { 
            type: String, 
            required: true, 
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 20,
            lowercase: true
        },
        password: { 
            type: String, 
            required: true,
            minlength: 8
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            sparse: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        refreshTokens: { 
            type: [String], 
            default: [],
            select: false // Don't return by default for security
        },
        createdAt: { 
            type: Date, 
            default: Date.now 
        },
        lastLogin: {
            type: Date,
            default: null
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true } // Adds createdAt and updatedAt automatically
);

// Index for faster lookups (username is already indexed via unique: true)
userScheme.index({ createdAt: -1 });

const User = mongoose.model("User", userScheme);

export { User };