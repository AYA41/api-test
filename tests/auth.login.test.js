const request = require("supertest");

const app = require("../src/app");

const {
  prisma,
  clearDatabase,
  createUser,
  getRefreshTokensCount,
} = require("./helpers/testUtils");

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await clearDatabase();

    await createUser({
      email: "ivan@example.com",
      password: "StrongPassword123",
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const credentials = {
    email: "ivan@example.com",
    password: "StrongPassword123",
  };

  test("Успешная авторизация", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send(credentials);

    expect(response.status).toBe(200);

    expect(response.body.message).toBe("Авторизация успешна");

    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");

    expect(response.body.user.email).toBe("ivan@example.com");

    expect(response.body.user).not.toHaveProperty("password");
  });

  test("Авторизация с неправильным паролем", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        ...credentials,
        password: "WrongPassword123",
      });

    expect(response.status).toBe(401);
  });

  test("Авторизация с несуществующим email", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "unknown@example.com",
      password: "StrongPassword123",
    });

    expect(response.status).toBe(401);
  });

  test("Авторизация без email", async () => {
    const response = await request(app).post("/api/auth/login").send({
      password: credentials.password,
    });

    expect(response.status).toBe(400);
  });

  test("Авторизация без пароля", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: credentials.email,
    });

    expect(response.status).toBe(400);
  });

  test("Авторизация с некорректным email", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        ...credentials,
        email: "wrong-email",
      });

    expect(response.status).toBe(400);
  });

  test("Авторизация с пустым телом", async () => {
    const response = await request(app).post("/api/auth/login").send({});

    expect(response.status).toBe(400);
  });

  test("После авторизации создаётся Refresh Token в БД", async () => {
    await request(app).post("/api/auth/login").send(credentials);

    const count = await getRefreshTokensCount();

    expect(count).toBe(1);
  });

  test("При неправильном пароле токен не создаётся", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({
        ...credentials,
        password: "WrongPassword",
      });

    const count = await getRefreshTokensCount();

    expect(count).toBe(0);
  });
});
