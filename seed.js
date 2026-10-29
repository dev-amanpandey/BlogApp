require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connect = require("./config/database");
const User = require("./models/userModel");
const Post = require("./models/postModel");
const Comment = require("./models/commentModel");

async function seed() {
  await connect();
  const password = await bcrypt.hash("samplePass123", 12);
  const [alice, bob] = await Promise.all([
    User.findOneAndUpdate({ username: "alice" }, { $setOnInsert: { email: "alice@example.com", password } }, { new: true, upsert: true }),
    User.findOneAndUpdate({ username: "bob" }, { $setOnInsert: { email: "bob@example.com", password } }, { new: true, upsert: true }),
  ]);
  const [post, secondPost] = await Promise.all([
    Post.findOneAndUpdate({ title: "Welcome to the blog", author: alice._id }, { $setOnInsert: { content: "This is a sample post to get you started." } }, { new: true, upsert: true }),
    Post.findOneAndUpdate({ title: "A second sample", author: bob._id }, { $setOnInsert: { content: "More sample content for the API." } }, { new: true, upsert: true }),
  ]);
  await Promise.all([
    Comment.updateOne({ post: post._id, author: bob._id, content: "Thanks for sharing!" }, { $setOnInsert: {} }, { upsert: true }),
    Comment.updateOne({ post: post._id, author: alice._id, content: "Welcome aboard." }, { $setOnInsert: {} }, { upsert: true }),
    Comment.updateOne({ post: secondPost._id, author: alice._id, content: "Looking forward to more." }, { $setOnInsert: {} }, { upsert: true }),
  ]);
  console.log("Seed data is ready. Sample password for alice and bob: samplePass123");
}

seed().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
