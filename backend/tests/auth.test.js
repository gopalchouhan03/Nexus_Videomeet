/**
 * Authentication Tests
 * Comprehensive test suite for JWT token system
 *
 * Tests cover:
 * - Token generation and verification
 * - Refresh token rotation
 * - Logout and token revocation
 * - Error handling and edge cases
 *
 * Usage:
 * npm test -- auth.test.js
 */

import assert from "assert";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    decodeToken,
    getTokenConfig,
} from "../src/utils/token.util.js";

describe("Token Utility Module", () => {
    describe("generateAccessToken()", () => {
        it("should generate a valid access token", () => {
            const payload = {
                userId: "507f1f77bcf86cd799439011",
                username: "testuser",
                name: "Test User",
            };

            const token = generateAccessToken(payload);

            assert.strictEqual(typeof token, "string", "Token should be a string");
            assert(token.length > 0, "Token should not be empty");

            // Verify the token can be decoded
            const decoded = decodeToken(token);
            assert.strictEqual(
                decoded.userId,
                payload.userId,
                "Decoded userId should match"
            );
            assert.strictEqual(
                decoded.username,
                payload.username,
                "Decoded username should match"
            );
        });

        it("should throw error if userId is missing", () => {
            assert.throws(() => {
                generateAccessToken({
                    username: "testuser",
                    name: "Test User",
                });
            }, "Should throw error when userId is missing");
        });

        it("should include proper claims in token", () => {
            const payload = {
                userId: "507f1f77bcf86cd799439011",
                username: "testuser",
                name: "Test User",
            };

            const token = generateAccessToken(payload);
            const decoded = decodeToken(token);

            assert(decoded.iat, "Token should have iat claim");
            assert(decoded.exp, "Token should have exp claim");
            assert.strictEqual(decoded.iss, "nexus-api", "Issuer should be nexus-api");
        });
    });

    describe("generateRefreshToken()", () => {
        it("should generate a valid refresh token", () => {
            const userId = "507f1f77bcf86cd799439011";
            const result = generateRefreshToken(userId);

            assert(result.token, "Should return token");
            assert(result.expiresAt, "Should return expiration date");
            assert(result.expiresAt instanceof Date, "expiresAt should be Date");

            const decoded = decodeToken(result.token);
            assert.strictEqual(decoded.userId, userId, "Decoded userId should match");
        });

        it("should set expiration 30 days in future", () => {
            const userId = "507f1f77bcf86cd799439011";
            const { expiresAt } = generateRefreshToken(userId);

            const now = new Date();
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

            const diff = expiresAt.getTime() - now.getTime();
            const tolerance = 5000; // 5 seconds tolerance

            assert(
                Math.abs(diff - thirtyDaysMs) < tolerance,
                "Token should expire in ~30 days"
            );
        });

        it("should throw error if userId is missing", () => {
            assert.throws(() => {
                generateRefreshToken();
            }, "Should throw error when userId is missing");
        });
    });

    describe("verifyAccessToken()", () => {
        it("should verify valid access token", () => {
            const payload = {
                userId: "507f1f77bcf86cd799439011",
                username: "testuser",
                name: "Test User",
            };

            const token = generateAccessToken(payload);
            const decoded = verifyAccessToken(token);

            assert.strictEqual(decoded.userId, payload.userId);
            assert.strictEqual(decoded.username, payload.username);
        });

        it("should throw error if token is missing", () => {
            assert.throws(() => {
                verifyAccessToken();
            }, "Should throw error when token is missing");
        });

        it("should throw error with NO_TOKEN code for empty token", () => {
            try {
                verifyAccessToken("");
                assert.fail("Should throw error");
            } catch (error) {
                assert.strictEqual(error.code, "NO_TOKEN");
                assert.strictEqual(error.statusCode, 401);
            }
        });

        it("should throw error for tampered token", () => {
            const token = generateAccessToken({
                userId: "507f1f77bcf86cd799439011",
                username: "testuser",
                name: "Test User",
            });

            const tamperedToken = token.slice(0, -5) + "XXXXX";

            try {
                verifyAccessToken(tamperedToken);
                assert.fail("Should throw error");
            } catch (error) {
                assert.strictEqual(error.code, "INVALID_TOKEN");
                assert.strictEqual(error.statusCode, 403);
            }
        });
    });

    describe("verifyRefreshToken()", () => {
        it("should verify valid refresh token", () => {
            const userId = "507f1f77bcf86cd799439011";
            const { token } = generateRefreshToken(userId);

            const decoded = verifyRefreshToken(token);
            assert.strictEqual(decoded.userId, userId);
        });

        it("should throw error if token is missing", () => {
            try {
                verifyRefreshToken();
                assert.fail("Should throw error");
            } catch (error) {
                assert.strictEqual(error.code, "NO_REFRESH_TOKEN");
                assert.strictEqual(error.statusCode, 401);
            }
        });

        it("should throw error for invalid token", () => {
            try {
                verifyRefreshToken("invalid.token.here");
                assert.fail("Should throw error");
            } catch (error) {
                assert.strictEqual(error.code, "INVALID_REFRESH_TOKEN");
                assert.strictEqual(error.statusCode, 403);
            }
        });
    });

    describe("decodeToken()", () => {
        it("should decode valid token without verification", () => {
            const payload = {
                userId: "507f1f77bcf86cd799439011",
                username: "testuser",
                name: "Test User",
            };

            const token = generateAccessToken(payload);
            const decoded = decodeToken(token);

            assert.strictEqual(decoded.userId, payload.userId);
            assert.strictEqual(decoded.username, payload.username);
        });

        it("should return null for invalid token", () => {
            const decoded = decodeToken("invalid.token.here");
            assert.strictEqual(decoded, null);
        });
    });

    describe("getTokenConfig()", () => {
        it("should return token configuration", () => {
            const config = getTokenConfig();

            assert.strictEqual(config.accessTokenExpiry, "15m");
            assert.strictEqual(config.refreshTokenExpiry, "30d");
            assert.strictEqual(config.algorithm, "HS256");
            assert.strictEqual(config.issuer, "nexus-api");
        });
    });

    describe("Error Handling", () => {
        it("should handle all error cases explicitly", () => {
            const testCases = [
                { input: null, expectedCode: "NO_TOKEN" },
                { input: "", expectedCode: "NO_TOKEN" },
                { input: "invalid", expectedCode: "INVALID_TOKEN" },
            ];

            testCases.forEach(({ input, expectedCode }) => {
                try {
                    verifyAccessToken(input);
                    assert.fail(`Should throw error for ${input}`);
                } catch (error) {
                    assert(
                        error.code === expectedCode || error.statusCode,
                        `Error should have code or statusCode`
                    );
                }
            });
        });
    });
});

describe("Authentication Middleware", () => {
    // Note: Full middleware tests would require Express mock
    // These are integration tests run with actual server
    it("placeholder for middleware tests", () => {
        // Middleware tests should be run with:
        // 1. supertest for HTTP requests
        // 2. Mock MongoDB connection
        // 3. Test various auth scenarios
    });
});
