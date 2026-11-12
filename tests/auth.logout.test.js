const request = require("supertest");

const app = require("../src/app");

const {
  prisma,
  clearDatabase,
  createUser,
  getRefreshTokensCount,
} = require("./helpers/testUtils");

describe("POST /api/auth/logout", () => {
  let refreshToken;

  beforeEach(async () => {
    await clearDatabase();

    const user = await createUser();

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: user.email,
      password: "StrongPassword123",
    });

    refreshToken = loginResponse.body.refreshToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Успешный выход", async () => {
    const response = await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken });

    expect(response.status).toBe(200);

    expect(response.body.message).toBe("Выход выполнен");
  });

  test("После выхода Refresh Token удалён из базы", async () => {
    await request(app).post("/api/auth/logout").send({ refreshToken });

    const count = await getRefreshTokensCount();

    expect(count).toBe(0);
  });

  test("После выхода Refresh Token больше нельзя использовать", async () => {
    await request(app).post("/api/auth/logout").send({ refreshToken });

    const response = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken });

    expect(response.status).toBe(401);
  });

  test("Выход с неизвестным токеном", async () => {
    const response = await request(app).post("/api/auth/logout").send({
      refreshToken: "unknown-token",
    });

    expect(response.status).toBe(200);
  });

  test("Повторный выход с тем же токеном", async () => {
    await request(app).post("/api/auth/logout").send({ refreshToken });

    const response = await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken });

    expect(response.status).toBe(200);
  });

  test("Выход без Refresh Token", async () => {
    const response = await request(app).post("/api/auth/logout").send({});

    expect(response.status).toBe(400);
  });
});
