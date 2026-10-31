
const express = require("express");

const {
  createRoom,
  getRoom,
  joinRoom,
  updateRoomName,
  endRoom,
} = require("../controllers/roomController");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  roomJoinLimiter,
} = require("../middleware/roomRateLimiter");

const router = express.Router();

// Create a new room
router.post("/", protect, createRoom);

// Join an existing room with rate limiting
router.post("/join", protect, roomJoinLimiter, joinRoom);

// Update room name (Host only)
router.patch("/:roomCode/name", protect, updateRoomName);

// End room (Host only)
router.patch("/:roomCode/end", protect, endRoom);

// Get room by room code
router.get("/:roomCode", protect, getRoom);

module.exports = router;
