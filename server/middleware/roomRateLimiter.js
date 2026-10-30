
const rateLimit = require("express-rate-limit");

const roomJoinLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Maximum 10 join attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many room join attempts. Please try again after 10 minutes.",
  },
});

module.exports = {
  roomJoinLimiter,
};
