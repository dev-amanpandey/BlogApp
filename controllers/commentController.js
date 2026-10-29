const mongoose = require("mongoose");
const commentService = require("../services/commentService");

function validContent(value) { return typeof value === "string" && value.trim().length >= 1 && value.trim().length <= 5000; }

async function createComment(req, res) {
  const { post_id: postId, content } = req.body || {};
  if (typeof postId !== "string" || !mongoose.isValidObjectId(postId) || !validContent(content)) return res.status(400).json({ error: { message: "Valid post_id and content (1-5000 characters) are required" } });
  if (!(await commentService.postExists(postId))) return res.status(404).json({ error: { message: "Post not found" } });
  const comment = await commentService.create({ post: postId, content: content.trim(), author: req.user._id });
  res.status(201).json({ comment });
}

async function listComments(req, res) {
  const { post_id: postId } = req.query;
  if (typeof postId !== "string" || !mongoose.isValidObjectId(postId)) return res.status(400).json({ error: { message: "A valid post_id is required" } });
  const comments = await commentService.listForPost(postId);
  res.json({ comments });
}

async function getComment(req, res) {
  const comment = await commentService.get(req.params.id);
  if (!comment) return res.status(404).json({ error: { message: "Comment not found" } });
  res.json({ comment });
}

async function updateComment(req, res) {
  const { content } = req.body || {};
  if (Object.keys(req.body || {}).length !== 1 || !validContent(content)) return res.status(400).json({ error: { message: "content (1-5000 characters) is required" } });
  const comment = await commentService.findForUpdate(req.params.id);
  if (!comment) return res.status(404).json({ error: { message: "Comment not found" } });
  if (!comment.author.equals(req.user._id)) return res.status(403).json({ error: { message: "You cannot modify this comment" } });
  comment.content = content.trim();
  await commentService.save(comment);
  res.json({ comment });
}

async function deleteComment(req, res) {
  const comment = await commentService.findForUpdate(req.params.id);
  if (!comment) return res.status(404).json({ error: { message: "Comment not found" } });
  if (!comment.author.equals(req.user._id)) return res.status(403).json({ error: { message: "You cannot delete this comment" } });
  await commentService.remove(comment);
  res.status(204).end();
}

module.exports = { createComment, listComments, getComment, updateComment, deleteComment };
