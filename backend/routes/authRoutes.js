
const express = require("express");

const {
  register,
  login
} = require("../controllers/authController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// Public endpoints
router.post("/register", register);
router.post("/login", login);

// Protected endpoint
router.get("/me", authenticate, (req, res) => {
  res.json({
    message: "Authenticated user",
    user: req.user
  });
});

// Temporary role authorization test
router.get(
  "/host-test",
  authenticate,
  authorize("host"),
  (req, res) => {
    res.json({
      message: "Host access granted"
    });
  }
);

module.exports = router;
