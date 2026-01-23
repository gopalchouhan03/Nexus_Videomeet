import logger from "../utils/logger.js";

/**
 * Request Validation Middleware
 * Validates request body against provided Joi schema
 * Strips unknown fields for security (mass assignment prevention)
 *
 * Usage: router.post("/path", validateRequest(schema), controllerFunction)
 */
export const validateRequest = (schema) => {
    return (req, res, next) => {
        // Validate body against schema
        const { error, value } = schema.validate(req.body, {
            abortEarly: false, // Collect all errors
            stripUnknown: true, // Remove unknown fields
            convert: true, // Convert types if possible
        });

        if (error) {
            // Format validation errors
            const messages = error.details.map((err) => ({
                field: err.path.join("."),
                message: err.message,
            }));

            logger.warn("Request validation failed", {
                path: req.path,
                errors: messages,
                ip: req.ip,
            });

            return res.status(400).json({
                code: "VALIDATION_ERROR",
                message: "Request validation failed",
                errors: messages,
            });
        }

        // Replace req.body with validated and sanitized data
        req.body = value;
        next();
    };
};
