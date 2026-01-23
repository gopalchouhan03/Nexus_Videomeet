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
        createdAt: { 
            type: Date, 
            default: Date.now,
            index: true
        },
        lastLogin: {
            type: Date,
            default: null,
            index: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    { timestamps: true } // Adds createdAt and updatedAt automatically
);

// Indexes for faster lookups
userScheme.index({ username: 1 });
userScheme.index({ email: 1 });
userScheme.index({ isActive: 1 });

const User = mongoose.model("User", userScheme);

export { User };