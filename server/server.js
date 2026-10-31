
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

require("dotenv").config();

const connectDB = require("./config/db");
const Room = require("./models/Room");
const User = require("./models/User");
const roomRoutes = require("./routes/roomRoutes");
const authRoutes = require("./routes/authRoutes");
const ChatMessage = require("./models/ChatMessage");
const { setIO } = require("./utils/socket");

// Get the unique online users currently connected to a room.
const getOnlineParticipants = async (roomCode) => {
  const sockets = await io.in(roomCode).fetchSockets();

  const onlineUserIds = [
    ...new Set(sockets.map((socket) => socket.userId).filter(Boolean)),
  ];

  return onlineUserIds;
};

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
setIO(io);

// Authenticate Socket.IO connections
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the latest user session version from MongoDB.
    const user = await User.findById(decoded.userId).select("tokenVersion");

    if (!user) {
      return next(new Error("User account not found"));
    }

    // Reject tokens issued before a password reset.
    const tokenVersion = decoded.tokenVersion ?? 0;

    if (tokenVersion !== (user.tokenVersion ?? 0)) {
      return next(new Error("Session expired. Please sign in again."));
    }

    socket.userId = user._id.toString();

    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    next(new Error("Invalid or expired token"));
  }
});

// Security middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", limiter);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

// Health checks
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SyncTogether API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Chat rate limiting: track messages per user
const chatRateLimits = new Map();

const CHAT_MESSAGE_LIMIT = 5;
const CHAT_WINDOW_MS = 10 * 1000;

// Socket.IO events
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Keep all active connections of this user in a private room.
  const userSocketRoom = `user:${socket.userId}`;

  socket.join(userSocketRoom);

  // Join a room
  socket.on("room:join", async (roomCode, callback) => {
    try {
      const code = String(roomCode || "").trim().toUpperCase();

      if (!code) {
        return callback?.({
          success: false,
          message: "Room code is required",
        });
      }

      const room = await Room.findOne({
        roomCode: code,
        isActive: true,
      });

      if (!room) {
        return callback?.({
          success: false,
          message: "Room not found",
        });
      }

      const isParticipant = room.participants.some(
        (id) => id.toString() === socket.userId
      );

      if (!isParticipant) {
        return callback?.({
          success: false,
          message: "Join the room before connecting",
        });
      }


      await socket.join(room.roomCode);
      // Send the saved playback state to the newly joined user
      socket.emit("video:playback-state", {
        isPlaying: room.playback.isPlaying,
        currentTime: room.playback.currentTime,
        updatedAt: room.playback.updatedAt,
      });
      // Get currently online participants after this socket joins.
      const onlineParticipants = await getOnlineParticipants(room.roomCode);

      // Load the latest 100 messages, oldest first.
      const savedMessages = await ChatMessage.find({
        room: room._id,
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      const messages = savedMessages.reverse().map((item) => ({
        _id: item._id.toString(),
        roomCode: item.roomCode,
        userId: item.sender.toString(),
        username: item.username,
        message: item.message,
        createdAt: item.createdAt.toISOString(),
      }));

      io.to(room.roomCode).emit("room:participants", {
        roomCode: room.roomCode,
        onlineParticipants,
      });

      callback?.({
        success: true,
        roomCode: room.roomCode,
        messages,
        onlineParticipants,
      });

    } catch (error) {
      console.error("Socket room join error:", error.message);

      callback?.({
        success: false,
        message: "Unable to join real-time room",
      });
    }
  });


  // Leave a room and update online participants.
  socket.on("room:leave", async (roomCode) => {
    try {
      const code = String(roomCode || "").trim().toUpperCase();

      if (!code || !socket.rooms.has(code)) return;

      // Notify remaining users that this user left.
      socket.to(code).emit("room:user-left", {
        userId: socket.userId,
        roomCode: code,
      });

      // Remove this socket from the room first.
      await socket.leave(code);

      // Recalculate online users after leaving.
      const onlineParticipants = await getOnlineParticipants(code);

      io.to(code).emit("room:participants", {
        roomCode: code,
        onlineParticipants,
      });
    } catch (error) {
      console.error("Room leave error:", error.message);
    }
  });


  // Real-time chat
  socket.on("chat:send", async (data, callback) => {
    try {
      console.log("Chat event received:", {
        roomCode: data?.roomCode,
        userId: socket.userId,
      });

      const roomCode = String(data?.roomCode || "")
        .trim()
        .toUpperCase();

      const message = String(data?.message || "").trim();

      if (!roomCode || !message) {
        return callback?.({
          success: false,
          message: "Room code and message are required",
        });
      }

      if (message.length > 1000) {
        return callback?.({
          success: false,
          message: "Message cannot exceed 1000 characters",
        });
      }

      // Limit messages per user across all their connections
      const now = Date.now();
      const userId = socket.userId;

      let rateLimit = chatRateLimits.get(userId);

      if (!rateLimit || now - rateLimit.windowStart >= CHAT_WINDOW_MS) {
        rateLimit = {
          count: 0,
          windowStart: now,
        };
      }

      if (rateLimit.count >= CHAT_MESSAGE_LIMIT) {
        return callback?.({
          success: false,
          message: "Too many messages. Please wait a few seconds.",
        });
      }

      rateLimit.count += 1;
      chatRateLimits.set(userId, rateLimit);

      // Confirm the socket joined this room.
      if (!socket.rooms.has(roomCode)) {
        return callback?.({
          success: false,
          message: "You are not connected to this room",
        });
      }

      // Confirm the user remains an authorized participant.
      const room = await Room.findOne({
        roomCode,
        isActive: true,
        participants: socket.userId,
      });

      if (!room) {
        return callback?.({
          success: false,
          message: "Room not found or access denied",
        });
      }

      const user = await User.findById(socket.userId)
        .select("username");

      if (!user) {
        return callback?.({
          success: false,
          message: "User not found",
        });
      }


      const savedMessage = await ChatMessage.create({
        room: room._id,
        roomCode,
        sender: socket.userId,
        username: user.username,
        message,
      });

      const chatMessage = {
        _id: savedMessage._id.toString(),
        roomCode,
        userId: socket.userId,
        username: user.username,
        message: savedMessage.message,
        createdAt: savedMessage.createdAt.toISOString(),
      };

      // Broadcast the saved message to everyone in the room.
      io.to(roomCode).emit("chat:message", chatMessage);

      callback?.({ success: true });

    } catch (error) {
      console.error("Chat message error:", error);

      callback?.({
        success: false,
        message: "Could not send chat message",
      });
    }
  });


  // Remove a participant (HOST ONLY)
  socket.on("room:remove-participant", async (data, callback) => {
    try {
      const roomCode = String(data?.roomCode || "")
        .trim()
        .toUpperCase();

      const targetUserId = String(data?.userId || "").trim();

      if (!roomCode || !targetUserId) {
        return callback?.({
          success: false,
          message: "Room code and participant ID are required",
        });
      }

      // Verify that the host is connected to the room.
      if (!socket.rooms.has(roomCode)) {
        return callback?.({
          success: false,
          message: "You are not connected to this room",
        });
      }

      const room = await Room.findOne({
        roomCode,
        isActive: true,
      });

      if (!room) {
        return callback?.({
          success: false,
          message: "Room not found",
        });
      }

      // Only the host can remove participants.
      if (room.host.toString() !== socket.userId) {
        return callback?.({
          success: false,
          message: "Only the host can remove participants",
        });
      }

      // Host cannot remove themselves.
      if (targetUserId === socket.userId) {
        return callback?.({
          success: false,
          message: "The host cannot remove themselves",
        });
      }

      // Verify that the target is a room participant.
      const isParticipant = room.participants.some(
        (id) => id.toString() === targetUserId
      );

      if (!isParticipant) {
        return callback?.({
          success: false,
          message: "Participant not found in this room",
        });
      }

      // Remove participant from MongoDB.
      room.participants = room.participants.filter(
        (id) => id.toString() !== targetUserId
      );

      await room.save();

      // Find all active connections belonging to the target user.
      const targetSockets = await io
        .in(`user:${targetUserId}`)
        .fetchSockets();

      // Notify and disconnect the target from this room.
      for (const targetSocket of targetSockets) {
        if (targetSocket.rooms.has(roomCode)) {
          targetSocket.emit("room:participant-removed", {
            roomCode,
            message: "The host has removed you from this room.",
          });

          await targetSocket.leave(roomCode);
        }
      }

      // Notify remaining participants.
      socket.to(roomCode).emit("room:user-left", {
        userId: targetUserId,
        roomCode,
      });

      // Update the online participant list.
      const onlineParticipants = await getOnlineParticipants(roomCode);

      io.to(roomCode).emit("room:participants", {
        roomCode,
        onlineParticipants,
      });

      callback?.({
        success: true,
        message: "Participant removed successfully",
        onlineParticipants,
      });

    } catch (error) {
      console.error("Remove participant error:", error);

      callback?.({
        success: false,
        message: "Could not remove participant",
      });
    }
  });


  // End room (HOST ONLY)
  socket.on("room:end", async (data, callback) => {
    try {
      const roomCode = String(data?.roomCode || "")
        .trim()
        .toUpperCase();

      if (!roomCode) {
        return callback?.({
          success: false,
          message: "Room code is required",
        });
      }

      // Verify that the host is connected to this room.
      if (!socket.rooms.has(roomCode)) {
        return callback?.({
          success: false,
          message: "You are not connected to this room",
        });
      }

      const room = await Room.findOne({
        roomCode,
        isActive: true,
      });

      if (!room) {
        return callback?.({
          success: false,
          message: "Room not found or already ended",
        });
      }

      // Only the host can end the room.
      if (room.host.toString() !== socket.userId) {
        return callback?.({
          success: false,
          message: "Only the host can end this room",
        });
      }

      // Mark the room as inactive in MongoDB.
      room.isActive = false;
      await room.save();

      // Notify everyone, including the host.
      io.to(roomCode).emit("room:ended", {
        roomCode,
        message: "The host has ended this room.",
      });

      // Remove every connected socket from this room.
      await io.in(roomCode).socketsLeave(roomCode);

      console.log(`Room ended successfully: ${roomCode}`);

      callback?.({
        success: true,
        message: "Room ended successfully",
      });

    } catch (error) {
      console.error("End room error:", error);

      callback?.({
        success: false,
        message: "Could not end the room",
      });
    }
  });


  // Video playback synchronization with MongoDB persistence
  socket.on("video:control", async (data, callback) => {
    try {
      const roomCode = String(data?.roomCode || "")
        .trim()
        .toUpperCase();

      const action = data?.action;
      const currentTime = Number(data?.currentTime);

      if (
        !roomCode ||
        !["play", "pause", "seek"].includes(action) ||
        !Number.isFinite(currentTime) ||
        currentTime < 0
      ) {
        return callback?.({
          success: false,
          message: "Invalid playback event",
        });
      }

      if (!socket.rooms.has(roomCode)) {
        return callback?.({
          success: false,
          message: "You are not connected to this room",
        });
      }

      const room = await Room.findOne({
        roomCode,
        isActive: true,
        participants: socket.userId,
      });

      if (!room) {
        return callback?.({
          success: false,
          message: "Room not found or access denied",
        });
      }

      // Save the latest playback state in MongoDB
      room.playback.isPlaying = action === "play";
      room.playback.currentTime = currentTime;
      room.playback.updatedAt = new Date();

      await room.save();

      // Synchronize playback with other participants
      socket.to(roomCode).emit("video:sync", {
        action,
        currentTime,
        userId: socket.userId,
      });

      callback?.({ success: true });

    } catch (error) {
      console.error("Video control error:", error.message);

      callback?.({
        success: false,
        message: "Could not synchronize playback",
      });
    }
  });


  // Change the shared video
  socket.on("video:change", async (data, callback) => {
    try {
      const roomCode = String(data?.roomCode || "")
        .trim()
        .toUpperCase();

      const videoUrl = String(data?.videoUrl || "").trim();

      if (!roomCode || !videoUrl) {
        return callback?.({
          success: false,
          message: "Room code and video URL are required",
        });
      }

      let parsedUrl;

      try {
        parsedUrl = new URL(videoUrl);
      } catch {
        return callback?.({
          success: false,
          message: "Invalid video URL",
        });
      }

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return callback?.({
          success: false,
          message: "Only HTTP and HTTPS URLs are allowed",
        });
      }

      if (!socket.rooms.has(roomCode)) {
        return callback?.({
          success: false,
          message: "You are not connected to this room",
        });
      }

      const room = await Room.findOne({
        roomCode,
        isActive: true,
        participants: socket.userId,
      });

      if (!room) {
        return callback?.({
          success: false,
          message: "Room not found or access denied",
        });
      }

      // Only the room host can change the shared video
      if (room.host.toString() !== socket.userId.toString()) {
        return callback?.({
          success: false,
          message: "Only the room host can change the video",
        });
      }

      room.media.url = parsedUrl.href;
      await room.save();

      socket.to(roomCode).emit("video:changed", {
        videoUrl: parsedUrl.href,
        userId: socket.userId,
      });

      callback?.({ success: true });
    } catch (error) {
      console.error("Video change error:", error.message);

      callback?.({
        success: false,
        message: "Could not change the room video",
      });
    }
  });


  // Capture room memberships before Socket.IO removes the socket.
  socket.on("disconnecting", () => {
    socket.roomsBeingDisconnected = [...socket.rooms].filter(
      (code) => code !== socket.id
    );

    for (const code of socket.roomsBeingDisconnected) {
      socket.to(code).emit("room:user-left", {
        userId: socket.userId,
        roomCode: code,
      });
    }
  });

  // Update online participants after the socket disconnects.
  socket.on("disconnect", async () => {
    console.log(`User disconnected: ${socket.id}`);

    for (const code of socket.roomsBeingDisconnected || []) {
      try {
        const onlineParticipants = await getOnlineParticipants(code);

        io.to(code).emit("room:participants", {
          roomCode: code,
          onlineParticipants,
        });
      } catch (error) {
        console.error(
          `Failed to update participants for room ${code}:`,
          error.message
        );
      }
    }
  });
  // End the Socket.IO connection handler.
});

module.exports = { io };

// Start server after connecting to MongoDB
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`SyncTogether server running on port ${PORT}`);
      console.log("JWT_SECRET loaded:", !!process.env.JWT_SECRET);
      console.log("JWT_EXPIRES_IN:", process.env.JWT_EXPIRES_IN);
      console.log("MONGODB_URI loaded:", !!process.env.MONGODB_URI);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();