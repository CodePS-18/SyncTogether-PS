const express = require("express");

const {
  createRoom,
  getRoom,
  joinRoom,
} = require("../controllers/roomController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Create a new room
router.post("/", protect, createRoom);

// Get room by room code
router.get("/:roomCode", protect, getRoom);

// Join an existing room
router.post("/join", protect, joinRoom);

module.exports = router;