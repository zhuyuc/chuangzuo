const path = require("path");
const storage = require("./storage");

module.exports = {
  PORT: Number(process.env.LY_PORT || 8765),
  HOST: process.env.LY_HOST || "0.0.0.0",
  WEB_DIR: path.join(storage.ROOT, "web"),
  SHARED_DIR: path.join(storage.ROOT, "shared"),
  MAX_BODY: 64 * 1024 * 1024
};