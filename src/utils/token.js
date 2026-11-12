const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function generateAccessToken(userId) {
  return jwt.sign(
    {
      sub: String(userId),
      type: "access",
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    },
  );
}

function generateRefreshToken(userId) {
  return jwt.sign(
    {
      sub: String(userId),
      type: "refresh",
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
    },
  );
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getTokenExpiration(token) {
  const decoded = jwt.decode(token);

  if (!decoded || !decoded.exp) {
    throw new Error("Некорректный токен");
  }

  return new Date(decoded.exp * 1000);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getTokenExpiration,
};
