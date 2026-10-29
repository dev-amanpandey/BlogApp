const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

process.env.JWT_SECRET = "test-secret-that-is-never-used-outside-tests";
const app = require("../index");
let mongo;
let token;
let otherToken;
let postId;
let commentId;

async function register(username, email) {
  return request(app).post("/api/v1/register").send({ username, email, password: "strongpass123" });
}
async function login(email) {
  const response = await request(app).post("/api/v1/login").send({ email, password: "strongpass123" });
  return response.body.token;
}

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})));
});

describe("authentication", () => {
  test("registers, hides password, logs in, and rejects invalid/duplicate credentials", async () => {
    const created = await register("author_one", "author@example.com");
    expect(created.status).toBe(201);
    expect(created.body.user.password).toBeUndefined();
    expect((await register("author_one", "other@example.com")).status).toBe(409);
    expect((await register("bad", "nope",)).status).toBe(400);
    token = await login("author@example.com");
    expect(token).toBeTruthy();
    expect((await request(app).post("/api/v1/login").send({ email: "author@example.com", password: "wrong" })).status).toBe(401);
    await register("author_two", "other@example.com");
    otherToken = await login("other@example.com");
  });

  test("serves docs and a consistent not-found error", async () => {
    expect((await request(app).get("/")).status).toBe(200);
    expect((await request(app).get("/api-docs/")).status).toBe(200);
    const missing = await request(app).get("/missing");
    expect(missing.status).toBe(404);
    expect(missing.body.error.message).toBe("Route not found");
  });
});

describe("posts", () => {
  beforeEach(async () => {
    await register("post_author", "post-author@example.com");
    token = await login("post-author@example.com");
    await register("post_other", "post-other@example.com");
    otherToken = await login("post-other@example.com");
  });

  test("requires auth, validates payloads and IDs, then performs full post lifecycle and pagination", async () => {
    expect((await request(app).post("/api/v1/posts").send({ title: "Valid title", content: "Text" })).status).toBe(401);
    expect((await request(app).post("/api/v1/posts").set("Authorization", `Bearer ${token}`).send({ title: "x", content: "" })).status).toBe(400);
    const created = await request(app).post("/api/v1/posts").set("Authorization", `Bearer ${token}`).send({ title: "Valid title", content: "Post body" });
    expect(created.status).toBe(201);
    postId = created.body.post._id;
    expect((await request(app).get("/api/v1/posts?page=0")).status).toBe(400);
    expect((await request(app).get("/api/v1/posts")).body.posts).toHaveLength(1);
    expect((await request(app).get(`/api/v1/posts/${postId}`)).status).toBe(200);
    expect((await request(app).get(`/api/v1/posts/${new mongoose.Types.ObjectId()}`)).status).toBe(404);
    expect((await request(app).get("/api/v1/posts/not-an-id")).status).toBe(400);
    expect((await request(app).put(`/api/v1/posts/${postId}`).send({ title: "New title" })).status).toBe(401);
    expect((await request(app).put(`/api/v1/posts/${postId}`).set("Authorization", `Bearer ${otherToken}`).send({ title: "New title" })).status).toBe(403);
    expect((await request(app).put(`/api/v1/posts/${postId}`).set("Authorization", `Bearer ${token}`).send({})).status).toBe(400);
    expect((await request(app).put(`/api/v1/posts/${postId}`).set("Authorization", `Bearer ${token}`).send({ title: "New title" })).status).toBe(200);
    expect((await request(app).delete(`/api/v1/posts/${postId}`).set("Authorization", `Bearer ${otherToken}`)).status).toBe(403);
    expect((await request(app).delete(`/api/v1/posts/${postId}`)).status).toBe(401);
    expect((await request(app).delete(`/api/v1/posts/not-an-id`).set("Authorization", `Bearer ${token}`)).status).toBe(400);
    expect((await request(app).delete(`/api/v1/posts/${new mongoose.Types.ObjectId()}`).set("Authorization", `Bearer ${token}`)).status).toBe(404);
  });
});

describe("comments and integration flow", () => {
  beforeEach(async () => {
    await register("flow_author", "flow-author@example.com");
    token = await login("flow-author@example.com");
    await register("flow_other", "flow-other@example.com");
    otherToken = await login("flow-other@example.com");
    const post = await request(app).post("/api/v1/posts").set("Authorization", `Bearer ${token}`).send({ title: "Flow post", content: "Original content" });
    postId = post.body.post._id;
  });

  test("creates, reads, updates, deletes comment and cascades when its post is deleted", async () => {
    expect((await request(app).post("/api/v1/comments").send({ post_id: postId, content: "hello" })).status).toBe(401);
    expect((await request(app).post("/api/v1/comments").set("Authorization", `Bearer ${token}`).send({ post_id: "bad", content: "hello" })).status).toBe(400);
    expect((await request(app).post("/api/v1/comments").set("Authorization", `Bearer ${token}`).send({ post_id: new mongoose.Types.ObjectId().toString(), content: "hello" })).status).toBe(404);
    const created = await request(app).post("/api/v1/comments").set("Authorization", `Bearer ${token}`).send({ post_id: postId, content: "First comment" });
    expect(created.status).toBe(201);
    commentId = created.body.comment._id;
    expect((await request(app).get(`/api/v1/comments?post_id=${postId}`)).body.comments).toHaveLength(1);
    expect((await request(app).get(`/api/v1/comments/${commentId}`)).status).toBe(200);
    expect((await request(app).get("/api/v1/comments/not-an-id")).status).toBe(400);
    expect((await request(app).get("/api/v1/comments?post_id=bad")).status).toBe(400);
    expect((await request(app).put(`/api/v1/comments/${commentId}`).send({ content: "No" })).status).toBe(401);
    expect((await request(app).put(`/api/v1/comments/${commentId}`).set("Authorization", `Bearer ${otherToken}`).send({ content: "No" })).status).toBe(403);
    expect((await request(app).put(`/api/v1/comments/${commentId}`).set("Authorization", `Bearer ${token}`).send({ content: "Updated" })).status).toBe(200);
    expect((await request(app).delete(`/api/v1/comments/${commentId}`)).status).toBe(401);
    expect((await request(app).delete(`/api/v1/comments/${commentId}`).set("Authorization", `Bearer ${otherToken}`)).status).toBe(403);
    expect((await request(app).delete(`/api/v1/comments/${commentId}`).set("Authorization", `Bearer ${token}`)).status).toBe(204);
    const again = await request(app).post("/api/v1/comments").set("Authorization", `Bearer ${token}`).send({ post_id: postId, content: "Cascade" });
    expect(again.status).toBe(201);
    commentId = again.body.comment._id;
    expect((await request(app).delete(`/api/v1/posts/${postId}`).set("Authorization", `Bearer ${token}`)).status).toBe(204);
    expect(await mongoose.model("Comment").countDocuments({ post: postId })).toBe(0);
    expect((await request(app).get(`/api/v1/posts/${postId}`)).status).toBe(404);
  });
});
