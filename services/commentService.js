const Comment = require("../models/commentModel");
const Post = require("../models/postModel");

const postExists = (id) => Post.exists({ _id: id });
const create = (data) => Comment.create(data);
const listForPost = (post) => Comment.find({ post }).sort({ createdAt: 1 }).populate("author", "username").lean();
const get = (id) => Comment.findById(id).populate("author", "username").lean();
const findForUpdate = (id) => Comment.findById(id);
const save = (comment) => comment.save();
const remove = (comment) => comment.deleteOne();

module.exports = { postExists, create, listForPost, get, findForUpdate, save, remove };
