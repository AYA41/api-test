const request = require("supertest");

const app = require("../src/app");

const { prisma, clearDatabase } = require("./helpers/testUtils");

describe("Валидация и обработка ошибок", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Имя не должно превышать 50 символов", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "А".repeat(51),
        email: "test@example.com",
        password: "StrongPassword123",
      });

    expect(response.status).toBe(400);
  });

  test("Пароль не должен превышать 72 символа", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Иван",
        email: "test@example.com",
        password: "A".repeat(73),
      });

    expect(response.status).toBe(400);
  });

  test("Некорректный тип имени", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: 12345,
      email: "test@example.com",
      password: "StrongPassword123",
    });

    expect(response.status).toBe(400);
  });

  test("Некорректный тип пароля", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Иван",
      email: "test@example.com",
      password: 12345678,
    });

    expect(response.status).toBe(400);
  });

  test("Ошибка должна содержать информацию о поле", async () => {
    const response = await request(app).post("/api/auth/register").send({
      name: "Иван",
      email: "wrong-email",
      password: "StrongPassword123",
    });

    expect(response.status).toBe(400);

    expect(response.body).toHaveProperty("errors");

    expect(response.body.errors.length).toBeGreaterThan(0);

    expect(response.body.errors[0]).toHaveProperty("field");

    expect(response.body.errors[0]).toHaveProperty("message");
  });

  test("Несуществующий маршрут возвращает 404", async () => {
    const response = await request(app).get("/api/unknown");

    expect(response.status).toBe(404);

    expect(response.body.message).toBe("Маршрут не найден");
  });

  test("Главная страница API доступна", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);

    expect(response.body.message).toBe("Auth API is running");
  });
});
