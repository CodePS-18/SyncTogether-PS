
const express = require("express");

const {
  createRoom,
  getRoom,
  joinRoom,
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

// Get room by room code
router.get("/:roomCode", protect, getRoom);

// Join an existing room with rate limiting
router.post("/join", protect, roomJoinLimiter, joinRoom);

module.exports = router;
