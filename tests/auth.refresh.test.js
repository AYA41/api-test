const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../src/app");

const {
  prisma,
  clearDatabase,
  createUser,
  getRefreshTokensCount,
} = require("./helpers/testUtils");

const { generateRefreshToken, hashToken } = require("../src/utils/token");

describe("POST /api/auth/refresh", () => {
  let user;
  let refreshToken;

  beforeEach(async () => {
    await clearDatabase();

    user = await createUser();

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: "StrongPassword123",
    });

    refreshToken = loginResponse.body.refreshToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Успешное обновление токенов", async () => {
    const response = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");

    expect(response.body.refreshToken).not.toBe(refreshToken);
  });

  test("Повторное использование старого Refresh Token", async () => {
    const firstResponse = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(firstResponse.status).toBe(200);

    const secondResponse = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(secondResponse.status).toBe(401);
  });

  test("Обновление с неправильным токеном", async () => {
    const response = await request(app).post("/api/auth/refresh").send({
      refreshToken: "invalid-token",
    });

    expect(response.status).toBe(401);
  });

  test("Обновление без токена", async () => {
    const response = await request(app).post("/api/auth/refresh").send({});

    expect(response.status).toBe(400);
  });

  test("Обновление с Access Token вместо Refresh Token", async () => {
    const accessToken = jwt.sign(
      {
        sub: String(user.id),
        type: "access",
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: "15m",
      },
    );

    const response = await request(app).post("/api/auth/refresh").send({
      refreshToken: accessToken,
    });

    expect(response.status).toBe(401);
  });

  test("Обновление с истёкшим JWT", async () => {
    const expiredToken = jwt.sign(
      {
        sub: String(user.id),
        type: "refresh",
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: -10,
      },
    );

    const response = await request(app).post("/api/auth/refresh").send({
      refreshToken: expiredToken,
    });

    expect(response.status).toBe(401);
  });

  test("Обновление с истёкшей записью в базе", async () => {
    const token = jwt.sign(
      {
        sub: String(user.id),
        type: "refresh",
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: "1h",
      },
    );

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(token),
        userId: user.id,
        expiresAt: new Date(Date.now() - 10000),
      },
    });

    const response = await request(app).post("/api/auth/refresh").send({
      refreshToken: token,
    });

    expect(response.status).toBe(401);
  });

  test("После обновления в базе остаётся одна активная запись", async () => {
    await request(app).post("/api/auth/refresh").send({ refreshToken });

    const count = await getRefreshTokensCount();

    expect(count).toBe(1);
  });
});
