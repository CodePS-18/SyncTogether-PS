const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/emailService");
const User = require("../models/User");
const { getIO } = require("../utils/socket");

const generateToken = (userId, tokenVersion = 0) => {
  return jwt.sign(
    { userId, tokenVersion },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};


// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    const token = generateToken(
      user._id.toString(),
      user.tokenVersion
    );

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Explicitly select password because schema uses select: false
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(
      user._id.toString(),
      user.tokenVersion ?? 0
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// POST /api/auth/forgot-password

const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const message =
      "If an account exists with this email, password reset instructions will be sent.";

    const user = await User.findOne({ email });

    // Return the same response whether or not the account exists.
    if (!user) {
      return res.status(200).json({
        success: true,
        message,
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetUrl =
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your SyncTogether password",
        text: `Use this link to reset your password. It expires in 15 minutes:\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
            <h2>Reset your SyncTogether password</h2>
            <p>We received a request to reset your password.</p>
            <p>This link expires in <strong>15 minutes</strong>.</p>
            <p>
              <a href="${resetUrl}"
                 style="display:inline-block;padding:12px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;">
                Reset Password
              </a>
            </p>
            <p>If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Password reset email failed:", emailError.message);

      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: "Unable to send the reset email. Please try again later.",
      });
    }

    return res.status(200).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process password reset right now.",
    });
  }
};


// POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link.",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires +password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link.",
      });
    }

    user.password = await bcrypt.hash(password, 12);

    // Invalidate all previously issued JWTs.
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Disconnect all active Socket.IO sessions for this user.
    const io = getIO();

    if (io) {
      const userSocketRoom = `user:${user._id.toString()}`;

      io.in(userSocketRoom).disconnectSockets(true);

      console.log(
        `All Socket.IO sessions disconnected for user: ${user._id}`
      );
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password right now.",
    });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    //   console.error("Get user error:", error);

    //   res.status(500).json({
    //     success: false,
    //     message: "Server error",
    //   });

    console.error("========== LOGIN ERROR ==========");
    console.error(error);
    console.error("================================");

    res.status(500).json({
      success: false,
      message: "Server error during login",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
};

// PATCH /api/auth/update-profile
const updateProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body;

    const userId = req.user.userId;

    const updates = {};

    // Validate username
    if (username !== undefined) {
      const trimmedUsername = username.trim();

      if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
        return res.status(400).json({
          success: false,
          message: "Username must be between 3 and 30 characters.",
        });
      }

      // Check whether username is already taken
      const existingUser = await User.findOne({
        username: trimmedUsername,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "This username is already taken.",
        });
      }

      updates.username = trimmedUsername;
    }

    // Validate avatar URL
    if (avatar !== undefined) {
      if (typeof avatar !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid avatar URL.",
        });
      }

      const trimmedAvatar = avatar.trim();

      if (trimmedAvatar.length > 2048) {
        return res.status(400).json({
          success: false,
          message: "Avatar URL is too long.",
        });
      }

      if (trimmedAvatar) {
        try {
          const parsedUrl = new URL(trimmedAvatar);

          if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            throw new Error("Invalid protocol");
          }
        } catch {
          return res.status(400).json({
            success: false,
            message: "Please provide a valid HTTP or HTTPS avatar URL.",
          });
        }
      }

      updates.avatar = trimmedAvatar;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No profile changes provided.",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("username email avatar isOnline lastSeen");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This username is already taken.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update profile.",
    });
  }
};

// PATCH /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      newPassword.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password.",
      });
    }

    const user = await User.findById(req.user.userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);

    // Invalidate all previously issued JWT tokens.
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    await user.save();

    // Disconnect all active Socket.IO sessions.
    const io = getIO();

    if (io) {
      const userSocketRoom = `user:${user._id.toString()}`;
      io.in(userSocketRoom).disconnectSockets(true);
    }

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please sign in again.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change password right now.",
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
};
