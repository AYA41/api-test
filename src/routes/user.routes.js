const express = require("express");

const router = express.Router();

const authenticate = require("../middlewares/auth.middleware");
const userController = require("../controllers/user.controller");

router.get("/me", authenticate, userController.me);

module.exports = router;
