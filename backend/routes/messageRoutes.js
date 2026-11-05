const express = require("express");

const {
  startConversation,
  getConversations,
  getMessages,
  sendMessage,
  markMessagesRead
} = require("../controllers/messageController");

const {
  authenticate,
  authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// CUSTOMER: START CONVERSATION
// ==========================================
router.post(
  "/conversations",
  authenticate,
  authorize("customer"),
  startConversation
);

// ==========================================
// CUSTOMER / HOST: VIEW INBOX
// ==========================================
router.get(
  "/conversations",
  authenticate,
  authorize("customer", "host"),
  getConversations
);

// ==========================================
// CUSTOMER / HOST: VIEW MESSAGES
// ==========================================
router.get(
  "/conversations/:id/messages",
  authenticate,
  authorize("customer", "host"),
  getMessages
);

// ==========================================
// CUSTOMER / HOST: SEND MESSAGE
// ==========================================
router.post(
  "/conversations/:id/messages",
  authenticate,
  authorize("customer", "host"),
  sendMessage
);

// ==========================================
// CUSTOMER / HOST: MARK MESSAGES AS READ
// ==========================================
router.patch(
  "/conversations/:id/read",
  authenticate,
  authorize("customer", "host"),
  markMessagesRead
);

module.exports = router;
