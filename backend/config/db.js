const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  ...(process.env.DB_PASSWORD
    ? { password: process.env.DB_PASSWORD }
    : {}),
});

pool.on("error", (error) => {
  console.error("PostgreSQL connection error:", error.message);
});

module.exports = { pool };