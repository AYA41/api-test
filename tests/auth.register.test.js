const request = require("supertest");

const app = require("../src/app");

const {
  prisma,
  clearDatabase,
  getUserByEmail,
} = require("./helpers/testUtils");

describe("POST /api/auth/register", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const validUser = {
    name: "Иван",
    email: "ivan@example.com",
    password: "StrongPassword123",
  };

  test("Успешная регистрация пользователя", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(validUser);

    expect(response.status).toBe(201);

    expect(response.body.message).toBe("Регистрация успешна");

    expect(response.body.user).toHaveProperty("id");
    expect(response.body.user.name).toBe("Иван");
    expect(response.body.user.email).toBe("ivan@example.com");

    expect(response.body.user).not.toHaveProperty("password");
  });

  test("Повторная регистрация с существующим email", async () => {
    await request(app).post("/api/auth/register").send(validUser);

    const response = await request(app)
      .post("/api/auth/register")
      .send(validUser);

    expect(response.status).toBe(409);

    expect(response.body.message).toBe("Пользователь уже существует");
  });

  test("Регистрация без имени", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: validUser.email,
      password: validUser.password,
    });

    expect(response.status).toBe(400);
  });

  test("Регистрация без email", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: validUser.name,
      password: validUser.password,
    });

    expect(response.status).toBe(400);
  });

  test("Регистрация без пароля", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: validUser.name,
      email: validUser.email,
    });

    expect(response.status).toBe(400);
  });

  test("Регистрация с некорректным email", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        ...validUser,
        email: "invalid-email",
      });

    expect(response.status).toBe(400);
  });

  test("Регистрация с коротким паролем", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        ...validUser,
        password: "123",
      });

    expect(response.status).toBe(400);
  });

  test("Регистрация с пустым телом запроса", async () => {
    const response = await request(app).post("/api/auth/register").send({});

    expect(response.status).toBe(400);
  });

  test("Пароль должен храниться в виде хэша", async () => {
    await request(app).post("/api/auth/register").send(validUser);

    const user = await getUserByEmail(validUser.email);

    expect(user).not.toBeNull();

    expect(user.password).not.toBe(validUser.password);

    expect(user.password.startsWith("$2")).toBe(true);
  });

  test("В базе должен появиться только один пользователь", async () => {
    await request(app).post("/api/auth/register").send(validUser);

    await request(app).post("/api/auth/register").send(validUser);

    const count = await prisma.user.count();

    expect(count).toBe(1);
  });
});
