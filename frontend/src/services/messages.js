
const API_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:5001"
}/api/messages`;

// ==========================================
// HELPER: AUTHENTICATED API REQUEST
// ==========================================
async function messagingRequest(
  endpoint,
  token,
  options = {}
) {
  if (!token) {
    throw new Error("Please log in to use messaging.");
  }

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Cannot connect to the messaging server."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }

    throw new Error(
      data.message || "Messaging request failed."
    );
  }

  return data;
}

// ==========================================
// CUSTOMER: START CONVERSATION
// ==========================================
export async function startConversation(
  propertyId,
  token
) {
  return messagingRequest("/conversations", token, {
    method: "POST",
    body: JSON.stringify({ propertyId }),
  });
}

// ==========================================
// CUSTOMER / HOST: GET INBOX
// ==========================================
export async function getConversations(token) {
  const data = await messagingRequest(
    "/conversations",
    token
  );

  return Array.isArray(data.conversations)
    ? data.conversations
    : [];
}

// ==========================================
// CUSTOMER / HOST: GET MESSAGE HISTORY
// ==========================================
export async function getMessages(
  conversationId,
  token
) {
  const data = await messagingRequest(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    token
  );

  return {
    conversation: data.conversation,
    messages: Array.isArray(data.messages)
      ? data.messages
      : [],
  };
}

// ==========================================
// CUSTOMER / HOST: SEND MESSAGE
// ==========================================
export async function sendMessage(
  conversationId,
  messageText,
  token
) {
  if (
    typeof messageText !== "string" ||
    !messageText.trim()
  ) {
    throw new Error("Message cannot be empty.");
  }

  if (messageText.trim().length > 2000) {
    throw new Error(
      "Messages cannot exceed 2000 characters."
    );
  }

  return messagingRequest(
    `/conversations/${encodeURIComponent(conversationId)}/messages`,
    token,
    {
      method: "POST",
      body: JSON.stringify({
        messageText: messageText.trim(),
      }),
    }
  );
}

// ==========================================
// CUSTOMER / HOST: MARK MESSAGES READ
// ==========================================
export async function markMessagesRead(
  conversationId,
  token
) {
  return messagingRequest(
    `/conversations/${encodeURIComponent(conversationId)}/read`,
    token,
    {
      method: "PATCH",
    }
  );
}
