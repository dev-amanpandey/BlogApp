require("dotenv").config();
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const connectWithDb = require("./config/database");
const blog = require("./routes/blog");
const errorHandler = require("./middleware/errorHandler");
const openapi = require("./openapi");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapi));
app.use("/api/v1", blog);
app.get("/", (req, res) => res.json({ message: "Blog API", docs: "/api-docs" }));
app.use((req, res) => res.status(404).json({ error: { message: "Route not found" } }));
app.use(errorHandler);

if (require.main === module) {
  const port = process.env.PORT || 3000;
  connectWithDb().then(() => app.listen(port, () => console.log(`Blog API listening on port ${port}`)))
    .catch((error) => { console.error("Database connection failed", error.message); process.exit(1); });
}

module.exports = app;
