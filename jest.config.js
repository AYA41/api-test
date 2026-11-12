module.exports = {
  testEnvironment: "node",

  setupFiles: ["<rootDir>/tests/setup.js"],

  testMatch: ["**/tests/**/*.test.js"],

  clearMocks: true,

  verbose: true,

  collectCoverageFrom: ["src/**/*.js", "!src/server.js", "!src/config/**"],

  coverageDirectory: "coverage",
};
