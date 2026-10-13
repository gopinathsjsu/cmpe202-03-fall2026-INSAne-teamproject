
import { useState } from "react";

export default function ReviewForm({ booking, onSubmit, onCancel }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (comment.trim().length < 10) {
      setError("Please write at least 10 characters.");
      return;
    }

    onSubmit({
      bookingId: booking.id,
      propertyId: booking.propertyId,
      rating,
      comment: comment.trim(),
    });
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h3>How was your stay?</h3>
      <p>Rate your experience from 1 to 5 stars.</p>

      <div className="review-stars" role="group" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            className={star <= rating ? "selected" : ""}
            onClick={() => setRating(star)}
            aria-label={`${star} stars`}
            aria-pressed={rating === star}
          >
            ★
          </button>
        ))}
      </div>

      <label htmlFor={`review-${booking.id}`}>
        Write your review
      </label>

      <textarea
        id={`review-${booking.id}`}
        value={comment}
        onChange={(event) => {
          setComment(event.target.value);
          setError("");
        }}
        placeholder="Tell others about your experience..."
        rows={4}
        maxLength={1000}
        required
      />

      {error && <p className="error-message">{error}</p>}

      <div className="review-form-actions">
        <button type="submit" className="primary-btn">
          Submit review
        </button>
        <button
          type="button"
          className="review-cancel-btn"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
