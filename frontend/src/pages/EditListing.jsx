
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getHostListings,
  updateListing,
} from "../services/listings.js";

export default function EditListing({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const listing = getHostListings(user.id).find(
    (item) => item.id === id
  );

  const [form, setForm] = useState(() => ({
    title: listing?.title || "",
    description: listing?.description || "",
    price: listing?.price ?? "",
    maxGuests: listing?.maxGuests ?? 1,
    image: listing?.image || "",
  }));

  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) <= 0 ||
      !Number.isInteger(Number(form.maxGuests)) ||
      Number(form.maxGuests) < 1
    ) {
      setError("Please enter a valid price and guest capacity.");
      return;
    }

    try {
      updateListing(id, user.id, {
        ...form,
        price: Number(form.price),
        maxGuests: Number(form.maxGuests),
      });

      navigate("/host");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!listing) {
    return (
      <main className="add-listing-page">
        <h2>Listing not found</h2>
        <p>This property may have been removed.</p>
        <Link to="/host">Return to Host Dashboard</Link>
      </main>
    );
  }

  return (
    <main className="add-listing-page">
      <Link to="/host" className="back-link">
        ← Back to Host Dashboard
      </Link>

      <div className="listing-form-header">
        <h1>Edit Property</h1>
        <p>Update your property information on Insane Stays.</p>
      </div>

      <form className="listing-form" onSubmit={handleSubmit}>
        <h2>Property Information</h2>

        <label htmlFor="edit-title">Property Name</label>
        <input
          id="edit-title"
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
        />

        <label htmlFor="edit-description">Description</label>
        <textarea
          id="edit-description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={5}
          required
        />

        <label htmlFor="edit-price">Price per Night ($)</label>
        <input
          id="edit-price"
          type="number"
          name="price"
          min="0.01"
          step="0.01"
          value={form.price}
          onChange={handleChange}
          required
        />

        <label htmlFor="edit-guests">Maximum Guests</label>
        <input
          id="edit-guests"
          type="number"
          name="maxGuests"
          min="1"
          step="1"
          value={form.maxGuests}
          onChange={handleChange}
          required
        />

        <label htmlFor="edit-image">Property Image URL</label>
        <input
          id="edit-image"
          type="url"
          name="image"
          value={form.image}
          onChange={handleChange}
          placeholder="https://example.com/property.jpg"
          required
        />

        {form.image && (
          <img
            src={form.image}
            alt="Property preview"
            className="listing-image-preview"
          />
        )}

        <p className="listing-approval-note">
          Updating a property will return it to pending
          approval until an Admin reviews the changes.
        </p>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        <div className="listing-form-actions">
          <Link to="/host" className="review-cancel-btn">
            Cancel
          </Link>

          <button type="submit" className="primary-btn">
            Save Changes
          </button>
        </div>
      </form>
    </main>
  );
}
