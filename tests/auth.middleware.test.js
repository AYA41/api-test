const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../src/app");

const { prisma, clearDatabase, createUser } = require("./helpers/testUtils");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../src/utils/token");

describe("GET /api/users/me", () => {
  let user;
  let accessToken;

  beforeEach(async () => {
    await clearDatabase();

    user = await createUser();

    accessToken = generateAccessToken(user.id);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Получение профиля с корректным Access Token", async () => {
    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);

    expect(response.body.user.id).toBe(user.id);
    expect(response.body.user.email).toBe(user.email);
    expect(response.body.user).not.toHaveProperty("password");
  });

  test("Запрос без токена", async () => {
    const response = await request(app).get("/api/users/me");

    expect(response.status).toBe(401);
  });

  test("Запрос с неправильным токеном", async () => {
    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);
  });

  test("Запрос с просроченным токеном", async () => {
    const expiredToken = jwt.sign(
      {
        sub: String(user.id),
        type: "access",
      },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: -10,
      },
    );

    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });

  test("Запрос с Refresh Token вместо Access Token", async () => {
    const refreshToken = generateRefreshToken(user.id);

    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${refreshToken}`);

    expect(response.status).toBe(401);
  });

  test("Запрос с токеном несуществующего пользователя", async () => {
    const token = generateAccessToken(999999);

    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
  });

  test("Запрос с некорректным форматом Authorization", async () => {
    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Basic sometoken");

    expect(response.status).toBe(401);
  });
});
