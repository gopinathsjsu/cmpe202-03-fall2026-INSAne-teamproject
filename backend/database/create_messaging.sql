BEGIN;

-- ==========================================
-- TABLE 1: CONVERSATIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS conversations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    property_id BIGINT NOT NULL
        REFERENCES properties(id),

    customer_id BIGINT NOT NULL
        REFERENCES users(id),

    host_id BIGINT NOT NULL
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_customer_property_conversation
        UNIQUE (property_id, customer_id),

    CONSTRAINT conversation_distinct_participants
        CHECK (customer_id <> host_id)
);

-- ==========================================
-- TABLE 2: MESSAGES
-- ==========================================

CREATE TABLE IF NOT EXISTS messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    conversation_id BIGINT NOT NULL
        REFERENCES conversations(id),

    sender_id BIGINT NOT NULL
        REFERENCES users(id),

    message_text TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    read_at TIMESTAMPTZ,

    CONSTRAINT message_length_check
        CHECK (
            char_length(btrim(message_text))
            BETWEEN 1 AND 2000
        )
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_conversations_customer
    ON conversations(customer_id);

CREATE INDEX IF NOT EXISTS idx_conversations_host
    ON conversations(host_id);

CREATE INDEX IF NOT EXISTS idx_conversations_updated
    ON conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages(conversation_id, created_at, id);

CREATE INDEX IF NOT EXISTS idx_messages_unread
    ON messages(conversation_id, read_at)
    WHERE read_at IS NULL;

COMMIT;
