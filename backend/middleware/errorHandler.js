const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message, details: err.details });
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Registro duplicado' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referencia inválida' });
  }

  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Error interno del servidor'
    : err.message;

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
