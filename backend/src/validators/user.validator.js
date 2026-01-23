import Joi from "joi";

/**
 * Login Request Validation Schema
 * Validates username and password format
 */
export const loginValidator = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(20)
        .required()
        .messages({
            "string.alphanum": "Username must only contain letters and numbers",
            "string.min": "Username must be at least 3 characters long",
            "string.max": "Username must not exceed 20 characters",
            "any.required": "Username is required",
            "string.empty": "Username cannot be empty",
        }),

    password: Joi.string()
        .min(8)
        .max(100)
        .required()
        .messages({
            "string.min": "Password must be at least 8 characters long",
            "string.max": "Password must not exceed 100 characters",
            "any.required": "Password is required",
            "string.empty": "Password cannot be empty",
        }),
}).unknown(false); // Reject unknown fields

/**
 * Register Request Validation Schema
 * Validates name, username, and password
 * Password must contain uppercase, lowercase, and numbers
 */
export const registerValidator = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required()
        .pattern(/^[a-zA-Z\s'-]+$/)
        .messages({
            "string.pattern.base":
                "Name must only contain letters, spaces, hyphens, and apostrophes",
            "string.min": "Name must be at least 2 characters long",
            "string.max": "Name must not exceed 50 characters",
            "any.required": "Name is required",
            "string.empty": "Name cannot be empty",
        }),

    username: Joi.string()
        .alphanum()
        .min(3)
        .max(20)
        .required()
        .messages({
            "string.alphanum": "Username must only contain letters and numbers (no spaces or special characters)",
            "string.min": "Username must be at least 3 characters long",
            "string.max": "Username must not exceed 20 characters",
            "any.required": "Username is required",
            "string.empty": "Username cannot be empty",
        }),

    password: Joi.string()
        .min(8)
        .max(100)
        .required()
        .messages({
            "string.min": "Password must be at least 8 characters long",
            "string.max": "Password must not exceed 100 characters",
            "any.required": "Password is required",
            "string.empty": "Password cannot be empty",
        }),
}).unknown(false); // Reject unknown fields

/**
 * Add to History Request Validation Schema
 * Validates meeting code format
 */
export const addToHistoryValidator = Joi.object({
    meeting_code: Joi.string()
        .min(1)
        .max(100)
        .required()
        .messages({
            "string.min": "Meeting code cannot be empty",
            "string.max": "Meeting code must not exceed 100 characters",
            "any.required": "Meeting code is required",
        }),
}).unknown(false); // Reject unknown fields

/**
 * Join Meeting Request Validation Schema
 */
export const joinMeetingValidator = Joi.object({
    meetingCode: Joi.string()
        .required()
        .pattern(/^[a-zA-Z0-9_-]{5,50}$/)
        .messages({
            "string.pattern.base":
                "Meeting code must be 5-50 characters (alphanumeric, underscore, hyphen)",
            "any.required": "Meeting code is required",
        }),
}).unknown(false);

/**
 * Logout Request Validation Schema
 */
export const logoutValidator = Joi.object({
    refreshToken: Joi.string().optional(),
}).unknown(false);
