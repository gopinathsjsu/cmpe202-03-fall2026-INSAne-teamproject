
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  getAuthToken,
  getCurrentUser,
} from "../services/auth";

import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesRead,
} from "../services/messages";

// ==========================================
// HELPERS
// ==========================================
function formatMessageTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getOtherPerson(conversation, role) {
  if (role === "host") {
    return conversation.customer_name || "Customer";
  }

  return conversation.host_name || "Host";
}

// ==========================================
// MESSAGES PAGE
// ==========================================
export default function Messages() {
  const user = getCurrentUser();
  const token = getAuthToken();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const selectedId = searchParams.get("conversation");

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);

  const [activeConversation, setActiveConversation] =
    useState(null);

  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");

  const [inboxError, setInboxError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [sendError, setSendError] = useState("");

  // ==========================================
  // LOAD INBOX
  // ==========================================
  const loadInbox = useCallback(async () => {
    if (!token) {
      setLoadingInbox(false);
      return;
    }

    try {
      const data = await getConversations(token);
      setConversations(data);
      setInboxError("");
    } catch (error) {
      setInboxError(
        error.message || "Unable to load inbox."
      );
    } finally {
      setLoadingInbox(false);
    }
  }, [token]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  // ==========================================
  // LOAD SELECTED CONVERSATION
  // ==========================================
  const loadSelectedMessages = useCallback(
    async (conversationId) => {
      if (!token || !conversationId) return;

      setLoadingMessages(true);
      setMessageError("");

      try {
        const data = await getMessages(
          conversationId,
          token
        );

        setActiveConversation(data.conversation);
        setMessages(data.messages);

        // Only mark messages read after loading.
        await markMessagesRead(
          conversationId,
          token
        );

        // Refresh unread counts.
        await loadInbox();
      } catch (error) {
        setMessageError(
          error.message || "Unable to load messages."
        );
      } finally {
        setLoadingMessages(false);
      }
    },
    [token, loadInbox]
  );

  useEffect(() => {
    if (!selectedId) {
      setActiveConversation(null);
      setMessages([]);
      return;
    }

    setActiveConversation(null);
    setMessages([]);

    loadSelectedMessages(selectedId);
  }, [selectedId, loadSelectedMessages]);

  // ==========================================
  // CHANGE CONVERSATION
  // ==========================================
  function selectConversation(id) {
    setDraft("");
    setSendError("");

    setSearchParams({
      conversation: String(id),
    });
  }

  // ==========================================
  // SEND MESSAGE
  // ==========================================
  async function handleSend(event) {
    event.preventDefault();

    const text = draft.trim();

    if (!text || !selectedId || sending) {
      return;
    }

    setSendError("");
    setSending(true);

    try {
      await sendMessage(
        selectedId,
        text,
        token
      );

      setDraft("");

      await loadSelectedMessages(selectedId);
    } catch (error) {
      setSendError(
        error.message || "Unable to send message."
      );
    } finally {
      setSending(false);
    }
  }

  // ==========================================
  // AUTHENTICATION CHECK
  // ==========================================
  if (
    !user ||
    !token ||
    !["customer", "host"].includes(user.role)
  ) {
    return (
      <main className="messages-page">
        <h1>Messages</h1>

        <p>
          Please log in as a customer or host
          to access messaging.
        </p>

        <Link to="/login">
          Go to Login
        </Link>
      </main>
    );
  }

  const currentConversation =
    conversations.find(
      (item) => String(item.id) === String(selectedId)
    );

  const inboxPath =
    user.role === "host" ? "/host" : "/dashboard";

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <main
      className="messages-page"
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "32px 20px",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <Link to={inboxPath}>
          ← Back to Dashboard
        </Link>

        <h1 style={{ marginTop: "16px" }}>
          {user.role === "host"
            ? "Host Inbox"
            : "My Messages"}
        </h1>

        <p>
          {user.role === "host"
            ? "View and reply to customer inquiries."
            : "Contact hosts and manage your conversations."}
        </p>
      </div>

      <div
        className="messages-layout"
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(220px, 1fr) minmax(0, 2fr)",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* ==================================
            CONVERSATION LIST
        ================================== */}
        <aside
          className="messages-sidebar"
          style={{
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "16px",
            minWidth: 0,
          }}
        >
          <h2>Conversations</h2>

          <button
            type="button"
            onClick={loadInbox}
            disabled={loadingInbox}
          >
            Refresh Inbox
          </button>

          {loadingInbox && (
            <p>Loading conversations...</p>
          )}

          {inboxError && (
            <p role="alert" className="error-message">
              {inboxError}
            </p>
          )}

          {!loadingInbox &&
            !inboxError &&
            conversations.length === 0 && (
              <p>No conversations yet.</p>
            )}

          <div
            style={{
              display: "grid",
              gap: "10px",
              marginTop: "16px",
            }}
          >
            {conversations.map((conversation) => {
              const selected =
                String(conversation.id) ===
                String(selectedId);

              const unread =
                Number(conversation.unread_count) || 0;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() =>
                    selectConversation(conversation.id)
                  }
                  aria-pressed={selected}
                  style={{
                    textAlign: "left",
                    padding: "12px",
                    borderRadius: "10px",
                    border: selected
                      ? "2px solid #333"
                      : "1px solid #ddd",
                    background: selected
                      ? "#f2f2f2"
                      : "#fff",
                    cursor: "pointer",
                    width: "100%",
                    color: "#222",
                  }}
                >
                  <strong>
                    {conversation.property_title}
                  </strong>

                  <p style={{ margin: "6px 0" }}>
                    {getOtherPerson(
                      conversation,
                      user.role
                    )}
                  </p>

                  {conversation.last_message && (
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#666",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {conversation.last_message}
                    </p>
                  )}

                  {unread > 0 && (
                    <span
                        className="unread-badge"
                        aria-label={`${unread} unread messages`}
                        style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#c62828",
                        color: "#fff",
                        padding: "5px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        marginTop: "8px",
                        }}
                    >
                        {unread} unread
                    </span>
                    )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* ==================================
            CHAT PANEL
        ================================== */}
        <section
          className="messages-chat-panel"
          style={{
            border: "1px solid #ddd",
            borderRadius: "12px",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {!selectedId ? (
            <div style={{ padding: "24px" }}>
              <h2>Select a conversation</h2>

              <p>
                Choose a conversation to view
                messages.
              </p>
            </div>
          ) : (
            <>
              {/* CHAT HEADER */}
              <header
                style={{
                  padding: "18px",
                  borderBottom: "1px solid #ddd",
                }}
              >
                <h2>
                  {currentConversation?.property_title ||
                    "Conversation"}
                </h2>

                <p>
                  {currentConversation
                    ? getOtherPerson(
                        currentConversation,
                        user.role
                      )
                    : "Loading conversation..."}
                </p>
              </header>

              {/* MESSAGE HISTORY */}
              <div
                className="messages-history"
                aria-live="polite"
                style={{
                  padding: "20px",
                  minHeight: "350px",
                  maxHeight: "550px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {loadingMessages && (
                  <p>Loading messages...</p>
                )}

                {messageError && (
                  <p
                    role="alert"
                    className="error-message"
                  >
                    {messageError}
                  </p>
                )}

                {!loadingMessages &&
                  !messageError &&
                  messages.length === 0 && (
                    <p>
                      No messages yet. Start the conversation!
                    </p>
                  )}

                {!loadingMessages &&
                  !messageError &&
                  messages.map((message) => {
                    const mine =
                      String(message.sender_id) ===
                      String(user.id);

                    return (
                      <article
                        key={message.id}
                        style={{
                          alignSelf: mine
                            ? "flex-end"
                            : "flex-start",
                          maxWidth: "80%",
                          background: mine
                            ? "#e8f4ed"
                            : "#f3f3f3",
                          padding: "12px 16px",
                          borderRadius: "14px",
                          overflowWrap: "anywhere",
                        }}
                      >
                        <strong>
                          {mine
                            ? "You"
                            : message.sender_name ||
                              "Participant"}
                        </strong>

                        <p
                          style={{
                            margin: "8px 0",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {message.message_text}
                        </p>

                        <small>
                          {formatMessageTime(
                            message.created_at
                          )}
                        </small>
                      </article>
                    );
                  })}
              </div>

              {/* SEND MESSAGE FORM */}
              <form
                onSubmit={handleSend}
                style={{
                  padding: "18px",
                  borderTop: "1px solid #ddd",
                  display: "grid",
                  gap: "12px",
                }}
              >
                {sendError && (
                  <p
                    role="alert"
                    className="error-message"
                  >
                    {sendError}
                  </p>
                )}

                <label htmlFor="messageText">
                  Write a message
                </label>

                <textarea
                  id="messageText"
                  value={draft}
                  onChange={(event) =>
                    setDraft(event.target.value)
                  }
                  placeholder="Type your message here..."
                  maxLength={2000}
                  rows={3}
                  disabled={
                    sending ||
                    loadingMessages ||
                    !activeConversation ||
                    !!messageError
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <small>
                    {draft.length}/2000
                  </small>

                  <button
                    type="submit"
                    className="primary-btn"
                    disabled={
                      sending ||
                      !draft.trim() ||
                      !activeConversation ||
                      !!messageError
                    }
                  >
                    {sending
                      ? "Sending..."
                      : "Send Message"}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
