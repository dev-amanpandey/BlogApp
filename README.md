# Blog REST API

A MongoDB-backed blog API with JWT authentication, author-owned post/comment mutations, pagination, and Swagger documentation.

## Tech stack

- Node.js with Express 5
- MongoDB with Mongoose 8
- JWT (`jsonwebtoken`) and bcrypt (`bcryptjs`)
- Jest, Supertest, and `mongodb-memory-server` for tests
- Swagger UI at `/api-docs`

## Setup

Install Node.js (LTS) and MongoDB Community locally, or create a MongoDB Atlas cluster and database user. In Atlas, allow the application host in Network Access and copy the driver's connection URI. Do not commit secrets.

```sh
npm install
```

Copy `.env.example` to `.env` and set `MONGO_URI` and a long, random `JWT_SECRET`. Local MongoDB example: `mongodb://127.0.0.1:27017/blogAppDatabase`. Atlas example: `mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority`.

## Environment variables

| Variable | Purpose | Example |
| --- | --- | --- |
| `PORT` | HTTP port | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/blogAppDatabase` |
| `JWT_SECRET` | Secret used to sign access tokens | Set a unique random value |

## Run and seed

```sh
npm start
npm run dev
npm run seed
```

Seed adds two sample users (`alice`, `bob`), two posts, and three comments. Both sample users use password `samplePass123`. It is safe to rerun and does not delete existing records. Use it with a development database because the sample credentials are public.

## Tests

```sh
npm test
```

Tests use `mongodb-memory-server`; they create an isolated MongoDB instance and do not use `MONGO_URI`.

## Authentication

Register at `POST /api/v1/register`, then log in at `POST /api/v1/login`. Send the returned token on create, update, and delete requests as `Authorization: Bearer <token>`. A user can modify or delete only their own posts and comments. Read routes are public. Passwords are stored as bcrypt hashes and never included in API responses.

Full interactive API documentation is available at `http://localhost:3000/api-docs` when the app is running.

## API examples

The examples assume the server runs at `http://localhost:3000`. Replace `TOKEN`, `POST_ID`, and `COMMENT_ID` with returned values.

```sh
# Register
curl -X POST http://localhost:3000/api/v1/register -H 'Content-Type: application/json' -d '{"username":"reader1","email":"reader@example.com","password":"strongpass123"}'

# Login
curl -X POST http://localhost:3000/api/v1/login -H 'Content-Type: application/json' -d '{"email":"reader@example.com","password":"strongpass123"}'

# Create a post
curl -X POST http://localhost:3000/api/v1/posts -H 'Authorization: Bearer TOKEN' -H 'Content-Type: application/json' -d '{"title":"First post","content":"Hello blog"}'

# List posts (pagination is optional; defaults are page=1 and limit=10)
curl 'http://localhost:3000/api/v1/posts?page=1&limit=10'

# Get one post
curl http://localhost:3000/api/v1/posts/POST_ID

# Update a post
curl -X PUT http://localhost:3000/api/v1/posts/POST_ID -H 'Authorization: Bearer TOKEN' -H 'Content-Type: application/json' -d '{"title":"Updated title","content":"Updated text"}'

# Delete a post (also deletes its comments)
curl -X DELETE http://localhost:3000/api/v1/posts/POST_ID -H 'Authorization: Bearer TOKEN'

# Create a comment
curl -X POST http://localhost:3000/api/v1/comments -H 'Authorization: Bearer TOKEN' -H 'Content-Type: application/json' -d '{"post_id":"POST_ID","content":"Nice post"}'

# List comments on a post
curl 'http://localhost:3000/api/v1/comments?post_id=POST_ID'

# Get one comment
curl http://localhost:3000/api/v1/comments/COMMENT_ID

# Update a comment
curl -X PUT http://localhost:3000/api/v1/comments/COMMENT_ID -H 'Authorization: Bearer TOKEN' -H 'Content-Type: application/json' -d '{"content":"Updated comment"}'

# Delete a comment
curl -X DELETE http://localhost:3000/api/v1/comments/COMMENT_ID -H 'Authorization: Bearer TOKEN'
```
