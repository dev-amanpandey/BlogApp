const mongoose = require("mongoose");

function validateId(param = "id") {
  return (req, res, next) => mongoose.isValidObjectId(req.params[param])
    ? next()
    : res.status(400).json({ error: { message: `Invalid ${param}` } });
}

module.exports = validateId;
