import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createHostProperty } from "../services/hostProperties";
import AddressAutocomplete from "../components/AddressAutocomplete";

// ==========================================
// INITIAL FORM DATA
// ==========================================
const initialForm = {
  title: "",
  description: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  contactInfo: "",
  price: "",
  guests: 1,
  bedrooms: 1,
  amenities: [],
  image: "",
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

// ==========================================
// GET TODAY IN LOCAL TIME
// ==========================================
function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ==========================================
// ADD LISTING
// ==========================================
export default function AddListing({ user }) {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // UPDATE INPUT VALUES
  // ==========================================
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ==========================================
  // FILL LOCATION FROM A GOOGLE SUGGESTION
  // ==========================================
  function handleAddressSelect(place) {
    setForm((previous) => ({
      ...previous,
      address: place.streetAddress || place.formattedAddress,
      city: place.city || previous.city,
      state: place.state || previous.state,
      zipCode: place.zipCode || previous.zipCode,
    }));
  }

  // ==========================================
  // TOGGLE AMENITIES
  // ==========================================
  function toggleAmenity(amenity) {
    setForm((previous) => ({
      ...previous,
      amenities: previous.amenities.includes(amenity)
        ? previous.amenities.filter(
            (item) => item !== amenity
          )
        : [...previous.amenities, amenity],
    }));
  }

  // ==========================================
  // SUBMIT PROPERTY TO POSTGRESQL
  // ==========================================
  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) return;

    setError("");

    if (!user || user.role !== "host") {
      setError("Only hosts can create properties.");
      return;
    }

    if (
      !form.title.trim() ||
      !form.city.trim() ||
      !form.state.trim()
    ) {
      setError(
        "Property name, city and state are required."
      );
      return;
    }

    const price = Number(form.price);
    const guests = Number(form.guests);
    const bedrooms = Number(form.bedrooms);

    if (
      form.price === "" ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setError("Price must be greater than zero.");
      return;
    }

    if (!Number.isInteger(guests) || guests < 1) {
      setError(
        "Maximum guests must be at least 1."
      );
      return;
    }

    if (!Number.isInteger(bedrooms) || bedrooms < 1) {
      setError("Bedrooms must be at least 1.");
      return;
    }

    if (
      form.zipCode.trim() &&
      !/^\d{5}$/.test(form.zipCode.trim())
    ) {
      setError("Please enter a valid 5-digit ZIP code.");
      return;
    }

    // Ensure the availability window is valid.
    if (
      !form.availableFrom ||
      !form.availableTo ||
      form.availableTo <= form.availableFrom
    ) {
      setError(
        "Available Until must be after Available From."
      );
      return;
    }

    if (form.availableFrom < getToday()) {
      setError(
        "Availability cannot begin in the past."
      );
      return;
    }

    const timePattern =
      /^([01]\d|2[0-3]):[0-5]\d$/;

    if (
      !timePattern.test(form.checkInTime) ||
      !timePattern.test(form.checkOutTime)
    ) {
      setError(
        "Please select valid check-in and check-out times."
      );
      return;
    }

    // Exact JSON field names expected by Express.
    const propertyData = {
      title: form.title.trim(),
      description: form.description.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zipCode: form.zipCode.trim(),
      contactInfo: form.contactInfo.trim(),
      price,
      guests,
      bedrooms,
      amenities: form.amenities,
      image: form.image.trim(),
      availableFrom: form.availableFrom,
      availableTo: form.availableTo,
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
    };

    setLoading(true);

    try {
      await createHostProperty(propertyData);

      // New property is pending admin approval.
      navigate("/host");

    } catch (err) {
      console.error("Create property error:", err);

      setError(
        err.message || "Failed to submit listing."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="add-listing-page">

      <Link to="/host" className="back-link">
        ← Back to Host Dashboard
      </Link>

      <div className="listing-form-header">
        <span className="eyebrow">
          HOST MANAGEMENT
        </span>

        <h1>Add a New Property</h1>

        <p>
          Share your space with travelers on Insane Stays.
        </p>
      </div>

      <form
        className="listing-form"
        onSubmit={handleSubmit}
      >

        <h2>Property Information</h2>

        <label htmlFor="title">
          Property Name
        </label>

        <input
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          disabled={loading}
          placeholder="e.g. Mountain View Retreat"
          required
        />

        <label htmlFor="description">
          Description
        </label>

        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          disabled={loading}
          rows={5}
          placeholder="What makes your property special?"
          required
        />

        <label htmlFor="address">
          Street Address
        </label>

        <AddressAutocomplete
          id="address"
          name="address"
          value={form.address}
          onChange={handleChange}
          onPlaceSelect={handleAddressSelect}
          disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
              maxLength={5}
              inputMode="numeric"
              required
            />
          </div>
        </div>

        <label htmlFor="contactInfo">
          Contact Information
        </label>

        <input
          id="contactInfo"
          name="contactInfo"
          value={form.contactInfo}
          onChange={handleChange}
          disabled={loading}
          placeholder="Host phone or email"
          required
        />

        <div className="listing-form-row">
          <div>
            <label htmlFor="price">
              Price per Night ($)
            </label>

            <input
              id="price"
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="guests">
              Maximum Guests
            </label>

            <input
              id="guests"
              name="guests"
              type="number"
              min="1"
              step="1"
              value={form.guests}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="bedrooms">
              Bedrooms
            </label>

            <input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min="1"
              step="1"
              value={form.bedrooms}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>
        </div>

        <h2>Amenities</h2>

        <div className="amenities-checkboxes">
          {amenityOptions.map((amenity) => (
            <label
              key={amenity}
              className="amenity-checkbox"
            >
              <input
                type="checkbox"
                checked={form.amenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
                disabled={loading}
              />

              {amenity}
            </label>
          ))}
        </div>

        <h2>Photos</h2>

        <label htmlFor="image">
          Property Image URL (optional)
        </label>

        <input
          id="image"
          name="image"
          type="url"
          value={form.image}
          onChange={handleChange}
          disabled={loading}
          placeholder="https://example.com/property.jpg"
        />

        {form.image && (
          <img
            src={form.image}
            alt="Property preview"
            className="listing-image-preview"
          />
        )}

        <h2>Availability and Check-in/out</h2>

        <p className="muted-text">
          Available Until means the last permitted
          checkout date. Reservations must fall
          completely within the chosen dates.
        </p>

        <div className="listing-form-row">
          <div>
            <label htmlFor="availableFrom">
              Available From
            </label>

            <input
              id="availableFrom"
              name="availableFrom"
              type="date"
              min={getToday()}
              value={form.availableFrom}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="availableTo">
              Available Until (last checkout)
            </label>

            <input
              id="availableTo"
              name="availableTo"
              type="date"
              min={form.availableFrom || getToday()}
              value={form.availableTo}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="listing-form-row">
          <div>
            <label htmlFor="checkInTime">
              Check-in Time
            </label>

            <input
              id="checkInTime"
              name="checkInTime"
              type="time"
              value={form.checkInTime}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="checkOutTime">
              Check-out Time
            </label>

            <input
              id="checkOutTime"
              name="checkOutTime"
              type="time"
              value={form.checkOutTime}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>
        </div>

        <p className="listing-approval-note">
          New listings require admin approval
          before appearing in public search results.
        </p>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        <div className="listing-form-actions">
          <Link
            to="/host"
            className="review-cancel-btn"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading
              ? "Submitting Listing..."
              : "Submit Listing"}
          </button>
        </div>

      </form>
    </main>
  );
}
