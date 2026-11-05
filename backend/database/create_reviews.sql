
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    booking_id BIGINT NOT NULL UNIQUE
        REFERENCES bookings(id),

    user_id BIGINT NOT NULL
        REFERENCES users(id),

    property_id BIGINT NOT NULL
        REFERENCES properties(id),

    rating SMALLINT NOT NULL
        CHECK (rating BETWEEN 1 AND 5),

    comment TEXT NOT NULL
        CHECK (char_length(btrim(comment)) BETWEEN 10 AND 2000),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_property_id
    ON reviews(property_id);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id
    ON reviews(user_id);

-- Integration note:
-- Backend must verify:
--1. JWT user matches booking.user_id
-- 2. Booking belongs to property_id
-- 3. Booking status = 'confirmed'
-- 4. Booking checkout date <= CURRENT_DATE
-- 5. A booking can only receive one review
--
-- These checks should run inside the review
-- creation transaction before inserting data.
--
-- Cloud Work:
-- Run this migration against production PostgreSQL
-- after the existing users, properties, and bookings
-- tables have been created.
