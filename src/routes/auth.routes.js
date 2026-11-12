const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");

const {
  registerValidator,
  loginValidator,
  refreshValidator,
} = require("../validators/auth.validator");

router.post("/register", registerValidator, validate, authController.register);

router.post("/login", loginValidator, validate, authController.login);

router.post("/refresh", refreshValidator, validate, authController.refresh);

router.post("/logout", refreshValidator, validate, authController.logout);

module.exports = router;
