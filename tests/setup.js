require("dotenv").config();

process.env.NODE_ENV = "test";

process.env.DATABASE_URL = "file:./test.db";

process.env.JWT_ACCESS_SECRET = "test-access-secret-very-long-random-string";

process.env.JWT_REFRESH_SECRET = "test-refresh-secret-very-long-random-string";

process.env.ACCESS_TOKEN_EXPIRES_IN = "15m";
process.env.REFRESH_TOKEN_EXPIRES_IN = "7d";
