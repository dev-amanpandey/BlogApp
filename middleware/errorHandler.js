function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ error: { message: "Malformed JSON request body" } });
  }
  if (error.type === "entity.too.large") return res.status(400).json({ error: { message: "Request body is too large" } });
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ error: { message: error.message } });
  }
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "value";
    return res.status(409).json({ error: { message: `${field} already exists` } });
  }
  console.error(error);
  return res.status(500).json({ error: { message: "Internal server error" } });
}

module.exports = errorHandler;
