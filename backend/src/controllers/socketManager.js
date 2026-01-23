import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

let connections = {};
let messages = {};
let timeOnline = {};
let userSockets = {}; // Map user ID to socket ID

/**
 * Socket.io Authentication Middleware
 * Verifies JWT token from socket auth object
 * Attaches user info to socket
 */
const authenticateSocket = (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            logger.warn("Socket connection rejected - no token", {
                socketId: socket.id,
                ip: socket.handshake.address,
            });
            return next(new Error("Authentication failed: No token provided"));
        }

        // Verify JWT
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded; // Attach user info to socket
        next();
    } catch (error) {
        logger.warn("Socket authentication failed", {
            error: error.message,
            socketId: socket.id,
        });
        next(new Error("Authentication failed: Invalid token"));
    }
};

/**
 * Connect Socket.io with Authentication
 */
export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            allowedHeaders: ["Authorization"],
            credentials: true,
        },
        transports: ["websocket", "polling"],
    });

    // ============= AUTHENTICATION MIDDLEWARE =============
    io.use(authenticateSocket);

    // ============= CONNECTION HANDLER =============
    io.on("connection", (socket) => {
        logger.info("✅ User connected to socket", {
            socketId: socket.id,
            userId: socket.user.userId,
            username: socket.user.username,
        });

        userSockets[socket.user.userId] = socket.id;

        // ============= JOIN ROOM EVENT =============
        socket.on("join-call", (path) => {
            try {
                // Validate path
                if (!path || typeof path !== "string" || path.length > 100) {
                    socket.emit("error", { message: "Invalid room path" });
                    logger.warn("Invalid room path", { path, socketId: socket.id });
                    return;
                }

                // Initialize room if doesn't exist
                if (!connections[path]) {
                    connections[path] = [];
                }

                // Add socket to room
                connections[path].push(socket.id);
                socket.join(path); // Use Socket.io rooms for better management

                timeOnline[socket.id] = new Date();

                logger.info("User joined room", {
                    socketId: socket.id,
                    username: socket.user.username,
                    room: path,
                    totalInRoom: connections[path].length,
                });

                // Notify all users in room
                for (let socketId of connections[path]) {
                    io.to(socketId).emit("user-joined", socket.id, connections[path]);
                }

                // Send previous messages to new user
                if (messages[path]) {
                    messages[path].forEach((msg) => {
                        socket.emit("chat-message", msg.data, msg.sender, msg.socketId);
                    });
                }
            } catch (error) {
                logger.error("Error in join-call", { error: error.message });
                socket.emit("error", { message: "Failed to join call" });
            }
        });

        // ============= SIGNAL EVENT (WebRTC Signaling) =============
        socket.on("signal", (toId, message) => {
            try {
                // Verify recipient is in a valid room
                let isValidRecipient = false;
                for (const room in connections) {
                    if (connections[room].includes(toId)) {
                        isValidRecipient = true;
                        break;
                    }
                }

                if (isValidRecipient) {
                    io.to(toId).emit("signal", socket.id, message);
                } else {
                    logger.warn("Signal to invalid recipient", {
                        from: socket.id,
                        to: toId,
                    });
                }
            } catch (error) {
                logger.error("Error in signal event", { error: error.message });
            }
        });

        // ============= CHAT MESSAGE EVENT =============
        socket.on("chat-message", (data, sender) => {
            try {
                // Validate message
                if (
                    !data ||
                    data.length > 1000 ||
                    typeof data !== "string"
                ) {
                    socket.emit("error", { message: "Invalid message" });
                    return;
                }

                // Find which room the sender is in
                const [matchingRoom, found] = Object.entries(connections).reduce(
                    ([room, isFound], [roomKey, roomValue]) => {
                        if (!isFound && roomValue.includes(socket.id)) {
                            return [roomKey, true];
                        }
                        return [room, isFound];
                    },
                    ["", false]
                );

                if (found) {
                    // Initialize messages array for room
                    if (!messages[matchingRoom]) {
                        messages[matchingRoom] = [];
                    }

                    // Create message object
                    const message = {
                        sender: socket.user.username, // Use auth username, not user input
                        data: data,
                        socketId: socket.id,
                        timestamp: new Date(),
                    };

                    // Store message
                    messages[matchingRoom].push(message);

                    // Limit messages in memory
                    if (messages[matchingRoom].length > 100) {
                        messages[matchingRoom].shift();
                    }

                    logger.info("Chat message", {
                        room: matchingRoom,
                        from: socket.user.username,
                        messageLength: data.length,
                    });

                    // Broadcast to room
                    io.to(matchingRoom).emit(
                        "chat-message",
                        data,
                        socket.user.username,
                        socket.id
                    );
                }
            } catch (error) {
                logger.error("Error in chat-message", { error: error.message });
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        // ============= DISCONNECT EVENT =============
        socket.on("disconnect", () => {
            try {
                const timeSinceJoin = Math.abs(new Date() - timeOnline[socket.id]);
                delete timeOnline[socket.id];
                delete userSockets[socket.user.userId];

                logger.info("User disconnected", {
                    socketId: socket.id,
                    username: socket.user.username,
                    duration: `${(timeSinceJoin / 1000).toFixed(2)}s`,
                });

                // Remove from all rooms
                for (const [room, socketIds] of Object.entries(connections)) {
                    const index = socketIds.indexOf(socket.id);
                    if (index > -1) {
                        connections[room].splice(index, 1);

                        // Notify others in room
                        io.to(room).emit("user-left", socket.id);

                        logger.info("User left room", {
                            socketId: socket.id,
                            room: room,
                            remainingInRoom: connections[room].length,
                        });

                        // Clean up empty rooms
                        if (connections[room].length === 0) {
                            delete connections[room];
                            delete messages[room];
                        }
                    }
                }
            } catch (error) {
                logger.error("Error in disconnect", { error: error.message });
            }
        });

        // ============= ERROR EVENT =============
        socket.on("error", (err) => {
            logger.error("Socket error", {
                socketId: socket.id,
                username: socket.user?.username,
                error: err,
            });
        });
    });

    return io;
};

