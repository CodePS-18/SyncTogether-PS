
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

// Authenticate Socket.IO connections
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;

    next();
  } catch (error) {
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

// Socket.IO events
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

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

  // Video playback synchronization
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