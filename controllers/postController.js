const postService = require("../services/postService");

function text(value, min, max) { return typeof value === "string" && value.trim().length >= min && value.trim().length <= max; }

async function createPost(req, res) {
  const { title, content } = req.body || {};
  if (!text(title, 3, 160) || !text(content, 1, 20000)) return res.status(400).json({ error: { message: "title (3-160) and content (1-20000) are required" } });
  const post = await postService.create({ title: title.trim(), content: content.trim(), author: req.user._id });
  res.status(201).json({ post });
}

async function listPosts(req, res) {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) return res.status(400).json({ error: { message: "page must be positive and limit must be between 1 and 100" } });
  const { posts, total } = await postService.list(page, limit);
  res.json({ posts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

async function getPost(req, res) {
  const post = await postService.get(req.params.id);
  if (!post) return res.status(404).json({ error: { message: "Post not found" } });
  res.json({ post });
}

async function updatePost(req, res) {
  const updates = {};
  if (Object.hasOwn(req.body || {}, "title")) {
    if (!text(req.body.title, 3, 160)) return res.status(400).json({ error: { message: "title must be 3-160 characters" } });
    updates.title = req.body.title.trim();
  }
  if (Object.hasOwn(req.body || {}, "content")) {
    if (!text(req.body.content, 1, 20000)) return res.status(400).json({ error: { message: "content must be 1-20000 characters" } });
    updates.content = req.body.content.trim();
  }
  if (!Object.keys(updates).length || Object.keys(req.body).some((key) => !["title", "content"].includes(key))) return res.status(400).json({ error: { message: "Provide title and/or content only" } });
  const post = await postService.findForUpdate(req.params.id);
  if (!post) return res.status(404).json({ error: { message: "Post not found" } });
  if (!post.author.equals(req.user._id)) return res.status(403).json({ error: { message: "You cannot modify this post" } });
  Object.assign(post, updates);
  await postService.save(post);
  res.json({ post });
}

async function deletePost(req, res) {
  const post = await postService.findForUpdate(req.params.id);
  if (!post) return res.status(404).json({ error: { message: "Post not found" } });
  if (!post.author.equals(req.user._id)) return res.status(403).json({ error: { message: "You cannot delete this post" } });
  await postService.remove(post);
  res.status(204).end();
}

module.exports = { createPost, listPosts, getPost, updatePost, deletePost };
