const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  skip: () => process.env.NODE_ENV === "test",

  message: {
    message: "Слишком много запросов. Попробуйте позже.",
  },
});

module.exports = authLimiter;
