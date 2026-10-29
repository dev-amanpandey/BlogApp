const Post = require("../models/postModel");

const create = (data) => Post.create(data);
async function list(page, limit) {
  const [posts, total] = await Promise.all([
    Post.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("author", "username").lean(),
    Post.countDocuments(),
  ]);
  return { posts, total };
}
const get = (id) => Post.findById(id).populate("author", "username").lean();
const findForUpdate = (id) => Post.findById(id);
const save = (post) => post.save();
async function remove(post) {
  await Post.findOneAndDelete({ _id: post._id });
}

module.exports = { create, list, get, findForUpdate, save, remove };
