const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const validateId = require("../middleware/validateId");
const posts = require("../controllers/postController");
const comments = require("../controllers/commentController");
const account = require("../controllers/authController");

router.post("/register", account.register);
router.post("/login", account.login);
router.get("/dummyroute", (req, res) => res.send("This is your dummy page"));
router.route("/posts").post(auth, posts.createPost).get(posts.listPosts);
router.route("/posts/:id").get(validateId(), posts.getPost).put(validateId(), auth, posts.updatePost).delete(validateId(), auth, posts.deletePost);
router.route("/comments").post(auth, comments.createComment).get(comments.listComments);
router.route("/comments/:id").get(validateId(), comments.getComment).put(validateId(), auth, comments.updateComment).delete(validateId(), auth, comments.deleteComment);

module.exports = router;
