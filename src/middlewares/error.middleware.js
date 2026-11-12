function errorHandler(error, req, res, next) {
  const status = error.status || 500;

  // Ошибки клиента не обязательно записывать как ошибки сервера
  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    message: error.message || "Внутренняя ошибка сервера",
  });
}

module.exports = errorHandler;
