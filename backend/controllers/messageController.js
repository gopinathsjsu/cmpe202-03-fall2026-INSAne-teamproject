const { pool } = require("../config/db");

// ==========================================
// HELPERS
// ==========================================

// Validate PostgreSQL BIGINT identifiers.
function validId(value) {
  if (typeof value !== "string" &&
      typeof value !== "number") {
    return false;
  }

  const text = String(value);

  return (
    /^[1-9]\d*$/.test(text) &&
    BigInt(text) <= 9223372036854775807n
  );
}

function canAccessConversation(conversation, user) {
  const userId = String(user.id);

  return (
    String(conversation.customer_id) === userId ||
    String(conversation.host_id) === userId
  );
}

async function findConversation(id) {
  const result = await pool.query(
    `SELECT id, property_id, customer_id, host_id,
            created_at, updated_at
     FROM conversations
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

// ==========================================
// POST /api/messages/conversations
// CUSTOMER: START A CONVERSATION
// ==========================================
async function startConversation(req, res) {
  try {
    const { propertyId } = req.body || {};

    if (!validId(propertyId)) {
      return res.status(400).json({
        message: "Valid propertyId is required"
      });
    }

    const propertyResult = await pool.query(
      `SELECT
         p.id,
         p.host_id,
         p.status,
         u.role AS host_role
       FROM properties p
       JOIN users u ON u.id = p.host_id
       WHERE p.id = $1`,
      [propertyId]
    );

    if (propertyResult.rows.length === 0) {
      return res.status(404).json({
        message: "Property not found"
      });
    }

    const property = propertyResult.rows[0];

    if (property.status !== "approved") {
      return res.status(403).json({
        message: "This property is not available for messaging"
      });
    }

    if (property.host_role !== "host") {
      return res.status(409).json({
        message: "Property host is not available"
      });
    }

    if (String(property.host_id) === String(req.user.id)) {
      return res.status(403).json({
        message: "You cannot message yourself"
      });
    }

    // Unique(property_id, customer_id) prevents duplicates.
    const inserted = await pool.query(
      `INSERT INTO conversations
         (property_id, customer_id, host_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (property_id, customer_id)
       DO NOTHING
       RETURNING *`,
      [property.id, req.user.id, property.host_id]
    );

    let conversation = inserted.rows[0];

    if (!conversation) {
      const existing = await pool.query(
        `SELECT *
         FROM conversations
         WHERE property_id = $1
           AND customer_id = $2`,
        [property.id, req.user.id]
      );

      conversation = existing.rows[0];
    }

    if (!conversation) {
      return res.status(500).json({
        message: "Unable to open conversation"
      });
    }

    // Do not silently grant access to a changed property owner.
    if (String(conversation.host_id) !== String(property.host_id)) {
      return res.status(409).json({
        message: "The property host has changed"
      });
    }

    return res.status(inserted.rows.length ? 201 : 200).json({
      message: inserted.rows.length
        ? "Conversation created"
        : "Conversation already exists",
      conversation
    });

  } catch (error) {
    console.error("Start conversation error:", error);

    return res.status(500).json({
      message: "Failed to start conversation"
    });
  }
}

// ==========================================
// GET /api/messages/conversations
// CUSTOMER/HOST: VIEW PERSONAL INBOX
// ==========================================
async function getConversations(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         c.id,
         c.property_id,
         c.customer_id,
         c.host_id,
         c.created_at,
         c.updated_at,

         p.title AS property_title,

         customer.name AS customer_name,
         host.name AS host_name,

         last_msg.message_text AS last_message,
         last_msg.created_at AS last_message_at,
         last_msg.sender_id AS last_sender_id,

         (
           SELECT COUNT(*)::int
           FROM messages unread
           WHERE unread.conversation_id = c.id
             AND unread.sender_id <> $1
             AND unread.read_at IS NULL
         ) AS unread_count

       FROM conversations c

       JOIN properties p
         ON p.id = c.property_id

       JOIN users customer
         ON customer.id = c.customer_id

       JOIN users host
         ON host.id = c.host_id

       LEFT JOIN LATERAL (
         SELECT message_text, created_at, sender_id
         FROM messages
         WHERE conversation_id = c.id
         ORDER BY created_at DESC, id DESC
         LIMIT 1
       ) last_msg ON TRUE

       WHERE c.customer_id = $1
          OR c.host_id = $1

       ORDER BY c.updated_at DESC, c.id DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      conversations: result.rows
    });

  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      message: "Failed to retrieve conversations"
    });
  }
}

// ==========================================
// GET /api/messages/conversations/:id/messages
// CUSTOMER/HOST: VIEW MESSAGE HISTORY
// ==========================================
async function getMessages(req, res) {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        message: "Invalid conversation ID"
      });
    }

    const conversation = await findConversation(id);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found"
      });
    }

    if (!canAccessConversation(conversation, req.user)) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    // Load the latest 100 messages, oldest first.
    const result = await pool.query(
      `SELECT *
       FROM (
         SELECT
           m.id,
           m.conversation_id,
           m.sender_id,
           u.name AS sender_name,
           m.message_text,
           m.created_at,
           m.read_at

         FROM messages m
         JOIN users u ON u.id = m.sender_id

         WHERE m.conversation_id = $1

         ORDER BY m.created_at DESC, m.id DESC
         LIMIT 100
       ) recent
       ORDER BY created_at ASC, id ASC`,
      [id]
    );

    return res.status(200).json({
      conversation,
      messages: result.rows
    });

  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      message: "Failed to retrieve messages"
    });
  }
}

// ==========================================
// POST /api/messages/conversations/:id/messages
// CUSTOMER/HOST: SEND MESSAGE
// ==========================================
async function sendMessage(req, res) {
  const { id } = req.params;
  const { messageText } = req.body || {};

  if (!validId(id)) {
    return res.status(400).json({
      message: "Invalid conversation ID"
    });
  }

  if (typeof messageText !== "string") {
    return res.status(400).json({
      message: "Message text is required"
    });
  }

  const trimmedMessage = messageText.trim();

  if (
    trimmedMessage.length < 1 ||
    trimmedMessage.length > 2000
  ) {
    return res.status(400).json({
      message: "Message must contain 1 to 2000 characters"
    });
  }

  let client;

  try {
    client = await pool.connect();

    await client.query("BEGIN");

    const conversationResult = await client.query(
      `SELECT id, customer_id, host_id
       FROM conversations
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    const conversation = conversationResult.rows[0];

    if (!conversation) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Conversation not found"
      });
    }

    if (!canAccessConversation(conversation, req.user)) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        message: "Access denied"
      });
    }

    // Sender ID comes from verified JWT, never request body.
    const result = await client.query(
      `INSERT INTO messages
         (conversation_id, sender_id, message_text)
       VALUES ($1, $2, $3)
       RETURNING
         id,
         conversation_id,
         sender_id,
         message_text,
         created_at,
         read_at`,
      [id, req.user.id, trimmedMessage]
    );

    await client.query(
      `UPDATE conversations
       SET updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Message sent",
      data: result.rows[0]
    });

  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    console.error("Send message error:", error);

    return res.status(500).json({
      message: "Failed to send message"
    });

  } finally {
    if (client) client.release();
  }
}

// ==========================================
// PATCH /api/messages/conversations/:id/read
// CUSTOMER/HOST: MARK RECEIVED MESSAGES READ
// ==========================================
async function markMessagesRead(req, res) {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        message: "Invalid conversation ID"
      });
    }

    const conversation = await findConversation(id);

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found"
      });
    }

    if (!canAccessConversation(conversation, req.user)) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    const result = await pool.query(
      `UPDATE messages
       SET read_at = CURRENT_TIMESTAMP
       WHERE conversation_id = $1
         AND sender_id <> $2
         AND read_at IS NULL
       RETURNING id`,
      [id, req.user.id]
    );

    return res.status(200).json({
      message: "Messages marked as read",
      updatedCount: result.rowCount
    });

  } catch (error) {
    console.error("Mark messages read error:", error);

    return res.status(500).json({
      message: "Failed to update messages"
    });
  }
}

module.exports = {
  startConversation,
  getConversations,
  getMessages,
  sendMessage,
  markMessagesRead
};
