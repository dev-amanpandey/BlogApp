const mongoose = require("mongoose");

async function connectWithDb(uri = process.env.MONGO_URI) {
  if (!uri) throw new Error("MONGO_URI is required");
  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = connectWithDb;
