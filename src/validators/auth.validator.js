const { body } = require("express-validator");

const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Имя обязательно")
    .isLength({ max: 50 })
    .withMessage("Имя не должно превышать 50 символов"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Некорректный email")
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage("Пароль должен быть строкой")
    .isLength({ min: 8, max: 72 })
    .withMessage("Пароль должен содержать от 8 до 72 символов"),
];

const loginValidator = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Некорректный email")
    .normalizeEmail(),

  body("password")
    .isString()
    .withMessage("Пароль должен быть строкой")
    .notEmpty()
    .withMessage("Пароль обязателен"),
];

const refreshValidator = [
  body("refreshToken")
    .isString()
    .notEmpty()
    .withMessage("Refresh Token обязателен"),
];

module.exports = {
  registerValidator,
  loginValidator,
  refreshValidator,
};
