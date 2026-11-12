const bcrypt = require("bcryptjs");
const prisma = require("../../src/config/database");

async function clearDatabase() {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

async function createUser(data = {}) {
  const password = data.password || "StrongPassword123";

  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name: data.name || "Тестовый пользователь",
      email: data.email || "test@example.com",
      password: hashedPassword,
    },
  });
}

async function getUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
  });
}

async function getRefreshTokensCount() {
  return prisma.refreshToken.count();
}

module.exports = {
  prisma,
  clearDatabase,
  createUser,
  getUserByEmail,
  getRefreshTokensCount,
};
