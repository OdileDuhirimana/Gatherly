// 404 handler
function notFoundHandler(req, res, next) {
  res.status(404).json({ error: 'Not Found' });
}

// Central error handler
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const details = err.details || undefined;
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error('Error:', err);
  }
  res.status(status).json({ error: message, details });
}

module.exports = { notFoundHandler, errorHandler };
