function errorHandler(error, req, res, next) {
  console.error(error);

  const status = error.status || 500;

  res.status(status).json({
    message: status === 500 ? "Внутренняя ошибка сервера" : error.message,
  });
}

module.exports = errorHandler;
