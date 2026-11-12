const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = require("../config/database");

const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getTokenExpiration,
} = require("../utils/token");

class AuthService {
  async register({ name, email, password }) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const error = new Error("Пользователь уже существует");
      error.status = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const error = new Error("Неверный email или пароль");
      error.status = 401;
      throw error;
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      const error = new Error("Неверный email или пароль");
      error.status = 401;
      throw error;
    }

    return this.createSession(user.id, user);
  }

  async createSession(userId, user) {
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId,
        expiresAt: getTokenExpiration(refreshToken),
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken) {
    let payload;

    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      const error = new Error("Недействительный Refresh Token");
      error.status = 401;
      throw error;
    }

    if (payload.type !== "refresh") {
      const error = new Error("Неверный тип токена");
      error.status = 401;
      throw error;
    }

    const tokenHash = hashToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt <= new Date()) {
      const error = new Error("Сессия недействительна");
      error.status = 401;
      throw error;
    }

    return prisma.$transaction(async (transaction) => {
      await transaction.refreshToken.delete({
        where: { tokenHash },
      });

      const accessToken = generateAccessToken(storedToken.userId);
      const newRefreshToken = generateRefreshToken(storedToken.userId);

      await transaction.refreshToken.create({
        data: {
          tokenHash: hashToken(newRefreshToken),
          userId: storedToken.userId,
          expiresAt: getTokenExpiration(newRefreshToken),
        },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    });
  }

  async logout(refreshToken) {
    const tokenHash = hashToken(refreshToken);

    await prisma.refreshToken.deleteMany({
      where: { tokenHash },
    });

    return {
      message: "Выход выполнен",
    };
  }
}

module.exports = new AuthService();
