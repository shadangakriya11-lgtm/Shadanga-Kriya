// Ensure dotenv is loaded first
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("connect", () => {
  console.log("Connected to Neon PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  // SECURITY: Don't crash the server, log and attempt reconnection
  console.error("Database connection error - attempting to continue...");
});

module.exports = pool;
