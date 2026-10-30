const crypto = require("crypto");

const Room = require("../models/Room");

const generateRoomCode = () => {
  return crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();
};

const createRoom = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Room name is required",
      });
    }

    let roomCode;
    let existingRoom;

    do {
      roomCode = generateRoomCode();

      existingRoom = await Room.findOne({
        roomCode,
      });
    } while (existingRoom);

    const room = await Room.create({
      name: name.trim(),
      roomCode,
      host: req.user.userId,
      participants: [req.user.userId],
    });

    const populatedRoom = await Room.findById(room._id)
      .populate("host", "username email avatar")
      .populate("participants", "username avatar");

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: populatedRoom,
    });
  } catch (error) {
    console.error("Create room error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating room",
    });
  }
};


const getRoom = async (req, res) => {
  try {
    const roomCode = String(req.params.roomCode || "")
      .trim()
      .toUpperCase();

    const room = await Room.findOne({
      roomCode,
      isActive: true,
      participants: req.user.userId,
    })
      .populate("host", "username email avatar")
      .populate("participants", "username avatar");

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found or access denied",
      });
    }

    return res.json({
      success: true,
      room,
    });
  } catch (error) {
    console.error("Get room error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching room",
    });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.body;

    if (!roomCode || !roomCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "Room code is required",
      });
    }

    const room = await Room.findOne({
      roomCode: roomCode.trim().toUpperCase(),
      isActive: true,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const alreadyJoined = room.participants.some(
      (participant) =>
        participant.toString() === req.user.userId
    );

    if (!alreadyJoined) {
      room.participants.push(req.user.userId);
      await room.save();
    }

    const populatedRoom = await Room.findById(room._id)
      .populate("host", "username email avatar")
      .populate("participants", "username avatar");

    res.json({
      success: true,
      message: "Joined room successfully",
      room: populatedRoom,
    });
  } catch (error) {
    console.error("Join room error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while joining room",
    });
  }
};

module.exports = {
  createRoom,
  getRoom,
  joinRoom,
};