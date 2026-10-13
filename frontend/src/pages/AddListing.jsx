
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { addListing } from "../services/listings.js";

const initialForm = {
  title: "",
  description: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  contactInfo: "",
  price: "",
  maxGuests: 1,
  bedrooms: 1,
  image: "",
  amenities: [],
  availableFrom: "",
  availableTo: "",
  checkInTime: "15:00",
  checkOutTime: "11:00",
};

const amenityOptions = [
  "WiFi",
  "Pool",
  "Parking",
  "Kitchen",
  "Air Conditioning",
  "Hot Tub",
  "Pet Friendly",
  "Workspace",
];

export default function AddListing({ user }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function toggleAmenity(amenity) {
    setForm((previous) => ({
      ...previous,
      amenities: previous.amenities.includes(amenity)
        ? previous.amenities.filter((item) => item !== amenity)
        : [...previous.amenities, amenity],
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (Number(form.price) <= 0) {
      setError("Nightly price must be greater than zero.");
      return;
    }

    if (Number(form.maxGuests) < 1) {
      setError("Guest capacity must be at least 1.");
      return;
    }

    if (!/^\d{5}$/.test(form.zipCode)) {
      setError("Please enter a valid 5-digit ZIP code.");
      return;
    }

    if (form.availableTo < form.availableFrom) {
      setError("Availability end date must be after the start date.");
      return;
    }

    try {
      addListing(
        {
          ...form,
          price: Number(form.price),
          maxGuests: Number(form.maxGuests),
          bedrooms: Number(form.bedrooms),
        },
        user.id
      );

      navigate("/host");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="add-listing-page">
      <Link to="/host" className="back-link">
        ← Back to Host Dashboard
      </Link>

      <div className="listing-form-header">
        <span className="eyebrow">BECOME A HOST</span>
        <h1>Add a New Property</h1>
        <p>Share your space with travelers on Insane Stays.</p>
      </div>

      <form className="listing-form" onSubmit={handleSubmit}>
        <h2>Property Information</h2>

        <label htmlFor="title">Property Name</label>
        <input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Modern Beachfront Villa"
          required
        />

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={5}
          placeholder="Describe what makes your property special..."
          required
        />

        <label htmlFor="address">Street Address</label>
        <input
          id="address"
          name="address"
          value={form.address}
          onChange={handleChange}
          required
        />

        <div className="listing-form-row">
          <div>
            <label htmlFor="city">City</label>
            <input
              id="city"
              name="city"
              value={form.city}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="state">State</label>
            <input
              id="state"
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="CA"
              required
            />
          </div>

          <div>
            <label htmlFor="zipCode">ZIP Code</label>
            <input
              id="zipCode"
              name="zipCode"
              value={form.zipCode}
              onChange={handleChange}
              maxLength={5}
              required
            />
          </div>
        </div>

        <label htmlFor="contactInfo">Contact Information</label>
        <input
          id="contactInfo"
          name="contactInfo"
          value={form.contactInfo}
          onChange={handleChange}
          placeholder="Phone or email"
          required
        />

        <div className="listing-form-row">
          <div>
            <label htmlFor="price">Price per Night ($)</label>
            <input
              id="price"
              name="price"
              type="number"
              min="1"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="maxGuests">Maximum Guests</label>
            <input
              id="maxGuests"
              name="maxGuests"
              type="number"
              min="1"
              value={form.maxGuests}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="bedrooms">Bedrooms</label>
            <input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min="1"
              value={form.bedrooms}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <h2>Amenities</h2>

        <div className="amenities-checkboxes">
          {amenityOptions.map((amenity) => (
            <label key={amenity} className="amenity-checkbox">
              <input
                type="checkbox"
                checked={form.amenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
              />
              {amenity}
            </label>
          ))}
        </div>

        <h2>Photos</h2>

        <label htmlFor="image">Property Image URL</label>
        <input
          id="image"
          name="image"
          type="url"
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

        <h2>Availability</h2>

        <div className="listing-form-row">
          <div>
            <label htmlFor="availableFrom">Available From</label>
            <input
              id="availableFrom"
              name="availableFrom"
              type="date"
              value={form.availableFrom}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="availableTo">Available Until</label>
            <input
              id="availableTo"
              name="availableTo"
              type="date"
              value={form.availableTo}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="listing-form-row">
          <div>
            <label htmlFor="checkInTime">Check-in Time</label>
            <input
              id="checkInTime"
              name="checkInTime"
              type="time"
              value={form.checkInTime}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="checkOutTime">Check-out Time</label>
            <input
              id="checkOutTime"
              name="checkOutTime"
              type="time"
              value={form.checkOutTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <p className="listing-approval-note">
          New properties require Admin approval before appearing
          in public search results.
        </p>

        {error && <p className="error-message">{error}</p>}

        <div className="listing-form-actions">
          <Link to="/host" className="review-cancel-btn">
            Cancel
          </Link>

          <button type="submit" className="primary-btn">
            Submit Listing
          </button>
        </div>
      </form>
    </main>
  );
}
