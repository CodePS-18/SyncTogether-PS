const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    media: {
      type: {
        type: String,
        enum: ["video", "audio"],
        default: "video",
      },

      url: {
        type: String,
        default: "",
      },

      title: {
        type: String,
        default: "",
      },
    },

    playback: {
      isPlaying: {
        type: Boolean,
        default: false,
      },

      currentTime: {
        type: Number,
        default: 0,
      },

      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", roomSchema);