class UserController {
  async me(req, res) {
    res.status(200).json({
      user: req.user,
    });
  }
}

module.exports = new UserController();
