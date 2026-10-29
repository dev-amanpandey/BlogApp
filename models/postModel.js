const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 160 },
  content: { type: String, required: true, trim: true, minlength: 1, maxlength: 20000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

postSchema.index({ createdAt: -1 });
postSchema.post("findOneAndDelete", async function (post) {
  if (post) await mongoose.model("Comment").deleteMany({ post: post._id });
});

module.exports = mongoose.model("Post", postSchema);
