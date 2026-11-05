import { useState } from "react";
import { createReview } from "../services/reviews";

export default function ReviewForm({
  bookingId,
  token,
  onSubmitted,
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    setError("");
    setSuccess("");

    if (rating < 1 || rating > 5) {
      setError("Please select a star rating.");
      return;
    }

    const trimmed = comment.trim();

    if (trimmed.length < 10 || trimmed.length > 2000) {
      setError("Review must be 10–2000 characters.");
      return;
    }

    if (!token) {
      setError("Please log in to submit a review.");
      return;
    }

    setLoading(true);

    try {
      const result = await createReview({
        token,
        bookingId,
        rating,
        comment: trimmed,
      });

      setSuccess("Your review was submitted successfully!");
      setRating(0);
      setComment("");

      if (onSubmitted) {
        onSubmitted(result.review);
      }
    } catch (err) {
      setError(err.message || "Unable to submit review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <h3>Leave a Review</h3>

      <p>How would you rate your stay?</p>

      <div
        className="review-stars"
        role="group"
        aria-label="Choose a rating"
        style={{ display: "flex", gap: "8px" }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            aria-pressed={rating === star}
            style={{
              fontSize: "32px",
              cursor: "pointer",
              color: star <= rating ? "#f4b400" : "#aaa",
              background: "none",
              border: "none",
            }}
          >
            ★
          </button>
        ))}
      </div>

      <p>{rating ? `${rating}/5 stars` : "Select a rating"}</p>

      <label htmlFor={`review-${bookingId}`}>
        Write your review
      </label>

      <textarea
        id={`review-${bookingId}`}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Tell other guests about your experience..."
        maxLength={2000}
        rows={4}
        required
        style={{
          width: "100%",
          padding: "12px",
          marginTop: "8px",
          borderRadius: "8px",
        }}
      />

      <p>{comment.trim().length}/2000 characters</p>

      {error && (
        <p role="alert" style={{ color: "crimson" }}>
          {error}
        </p>
      )}

      {success && (
        <p role="status" style={{ color: "green" }}>
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || rating === 0}
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
