
const express = require("express");

const {
  loginLimiter,
  passwordResetLimiter,
} = require("../middleware/authRateLimit");

const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.get("/me", protect, getMe);

router.post(
  "/forgot-password",
  passwordResetLimiter,
  forgotPassword
);

router.post(
  "/reset-password/:token",
  passwordResetLimiter,
  resetPassword
);

module.exports = router;
