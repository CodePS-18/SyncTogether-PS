
const crypto = require("crypto");

const Room = require("../models/Room");

const generateRoomCode = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

// CREATE ROOM
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
      existingRoom = await Room.findOne({ roomCode });
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

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: populatedRoom,
    });
  } catch (error) {
    console.error("Create room error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating room",
    });
  }
};

// GET MY ROOMS
const getMyRooms = async (req, res) => {
  try {
    const userId = req.user.userId;

    const rooms = await Room.find({
      participants: userId,
      isActive: true,
    })
      .populate("host", "username email avatar")
      .populate("participants", "username avatar")
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    console.error("Get my rooms error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching your rooms",
    });
  }
};

// GET SINGLE ROOM
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

    return res.status(200).json({
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

// UPDATE ROOM NAME (HOST ONLY)
const updateRoomName = async (req, res) => {
  try {
    const roomCode = String(req.params.roomCode || "")
      .trim()
      .toUpperCase();

    const { name } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Room name is required",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Room name cannot exceed 100 characters",
      });
    }

    const room = await Room.findOne({
      roomCode,
      isActive: true,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (room.host.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Only the host can update room settings",
      });
    }

    room.name = name.trim();
    await room.save();

    const updatedRoom = await Room.findById(room._id)
      .populate("host", "username email avatar")
      .populate("participants", "username avatar");

    return res.status(200).json({
      success: true,
      message: "Room name updated successfully",
      room: updatedRoom,
    });
  } catch (error) {
    console.error("Update room name error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating room name",
    });
  }
};

// END ROOM (HOST ONLY)
const endRoom = async (req, res) => {
  try {
    const roomCode = String(req.params.roomCode || "")
      .trim()
      .toUpperCase();

    const room = await Room.findOne({
      roomCode,
      isActive: true,
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found or already ended",
      });
    }

    if (room.host.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Only the host can end this room",
      });
    }

    room.isActive = false;
    await room.save();

    return res.status(200).json({
      success: true,
      message: "Room ended successfully",
    });
  } catch (error) {
    console.error("End room error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while ending room",
    });
  }
};

// JOIN ROOM
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

    return res.status(200).json({
      success: true,
      message: "Joined room successfully",
      room: populatedRoom,
    });
  } catch (error) {
    console.error("Join room error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while joining room",
    });
  }
};

module.exports = {
  createRoom,
  getMyRooms,
  getRoom,
  joinRoom,
  updateRoomName,
  endRoom,
};
