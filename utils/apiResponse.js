class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function ok(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

module.exports = { ApiError, ok };
