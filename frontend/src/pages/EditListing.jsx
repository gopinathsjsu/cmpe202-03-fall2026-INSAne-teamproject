import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  Link,
} from "react-router-dom";

import {
  getMyHostProperties,
  updateHostProperty,
} from "../services/hostProperties";

// ==========================================
// AMENITY OPTIONS
// ==========================================
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
// INITIAL FORM
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

// ==========================================
// FORMAT POSTGRESQL DATE FOR DATE INPUT
// ==========================================
function formatDate(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

// ==========================================
// FORMAT POSTGRESQL TIME FOR TIME INPUT
// ==========================================
function formatTime(value, fallback) {
  if (!value) return fallback;

  return String(value).slice(0, 5);
}

// ==========================================
// NORMALIZE AMENITIES
// ==========================================
function normalizeAmenities(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

// ==========================================
// CONVERT PROPERTY FROM BACKEND TO FORM
// ==========================================
function propertyToForm(property) {
  return {
    title: property.title || "",
    description: property.description || "",
    address: property.address || "",
    city: property.city || "",
    state: property.state || "",
    zipCode: property.zip_code || "",
    contactInfo: property.contact_info || "",
    price: property.price_per_night ?? "",
    guests: property.max_guests ?? 1,
    bedrooms: property.bedrooms ?? 1,
    amenities: normalizeAmenities(property.amenities),
    image: property.image_url || "",
    availableFrom: formatDate(property.available_from),
    availableTo: formatDate(property.available_to),
    checkInTime: formatTime(
      property.check_in_time,
      "15:00"
    ),
    checkOutTime: formatTime(
      property.check_out_time,
      "11:00"
    ),
  };
}

// ==========================================
// EDIT LISTING COMPONENT
// ==========================================
export default function EditListing({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // FETCH THE HOST'S PROPERTY
  // ==========================================
  useEffect(() => {
    let active = true;

    async function loadListing() {
      setLoading(true);
      setError("");
      setListing(null);

      try {
        const properties = await getMyHostProperties();

        const found = properties.find(
          (property) =>
            String(property.id) === String(id)
        );

        if (!found) {
          throw new Error(
            "Property not found or you do not have permission to edit it."
          );
        }

        if (active) {
          setListing(found);
          setForm(propertyToForm(found));
        }

      } catch (err) {
        if (active) {
          setError(
            err.message || "Failed to load property."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (user?.role === "host") {
      loadListing();
    } else {
      setLoading(false);
      setError("Only hosts can edit properties.");
    }

    return () => {
      active = false;
    };
  }, [id, user?.id, user?.role]);

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ==========================================
  // HANDLE AMENITY SELECTION
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
  // SUBMIT UPDATED PROPERTY
  // ==========================================
  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || !listing) return;

    setError("");

    if (!user || user.role !== "host") {
      setError("Only hosts can edit properties.");
      return;
    }

    if (
      !form.title.trim() ||
      !form.city.trim() ||
      !form.state.trim()
    ) {
      setError(
        "Property name, city, and state are required."
      );
      return;
    }

    // Validate price
    const price = Number(form.price);

    if (
      form.price === "" ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      setError("Price must be greater than zero.");
      return;
    }

    // Validate guests
    const guests = Number(form.guests);

    if (
      !Number.isInteger(guests) ||
      guests < 1
    ) {
      setError(
        "Maximum guests must be at least 1."
      );
      return;
    }

    // Validate bedrooms
    const bedrooms = Number(form.bedrooms);

    if (
      !Number.isInteger(bedrooms) ||
      bedrooms < 1
    ) {
      setError("Bedrooms must be at least 1.");
      return;
    }

    // Validate ZIP code
    if (
      form.zipCode.trim() &&
      !/^\d{5}$/.test(form.zipCode.trim())
    ) {
      setError("Please enter a valid 5-digit ZIP code.");
      return;
    }

    // ======================================
    // VALIDATE AVAILABILITY
    // Older properties may have no schedule.
    // ======================================
    const hasAvailability =
      Boolean(form.availableFrom) ||
      Boolean(form.availableTo);

    if (hasAvailability) {
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
    }

    // ======================================
    // VALIDATE CHECK-IN / CHECK-OUT TIMES
    // ======================================
    const timePattern =
      /^([01]\d|2[0-3]):[0-5]\d$/;

    if (
      !timePattern.test(form.checkInTime) ||
      !timePattern.test(form.checkOutTime)
    ) {
      setError(
        "Please enter valid check-in and checkout times."
      );
      return;
    }

    // ======================================
    // MATCH EXPRESS BACKEND FIELD NAMES
    // ======================================
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
    };

    // Include a complete schedule only when
    // availability dates have been configured.
    // This preserves legacy properties that
    // do not yet have availability dates.
    if (hasAvailability) {
      propertyData.availableFrom = form.availableFrom;
      propertyData.availableTo = form.availableTo;
      propertyData.checkInTime = form.checkInTime;
      propertyData.checkOutTime = form.checkOutTime;
    }

    setSaving(true);

    try {
      await updateHostProperty(id, propertyData);

      // After editing, backend marks listing
      // as pending for admin review.
      navigate("/host");

    } catch (err) {
      console.error("Update property error:", err);

      setError(
        err.message || "Failed to update property."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // LOADING STATE
  // ==========================================
  if (loading) {
    return (
      <main className="add-listing-page">
        <Link to="/host" className="back-link">
          ← Back to Host Dashboard
        </Link>

        <h2>Loading property...</h2>
        <p>Retrieving property information.</p>
      </main>
    );
  }

  // ==========================================
  // PROPERTY NOT FOUND / ACCESS DENIED
  // ==========================================
  if (!listing) {
    return (
      <main className="add-listing-page">
        <Link to="/host" className="back-link">
          ← Back to Host Dashboard
        </Link>

        <h2>Unable to load listing</h2>

        <p className="error-message">
          {error || "Property not found."}
        </p>
      </main>
    );
  }

  // ==========================================
  // EDIT LISTING FORM
  // ==========================================
  return (
    <main className="add-listing-page">

      {/* BACK LINK */}
      <Link to="/host" className="back-link">
        ← Back to Host Dashboard
      </Link>

      {/* HEADER */}
      <div className="listing-form-header">
        <span className="eyebrow">
          HOST MANAGEMENT
        </span>

        <h1>Edit Property</h1>

        <p>
          Update your property information on Insane Stays.
        </p>
      </div>

      {/* FORM */}
      <form
        className="listing-form"
        onSubmit={handleSubmit}
      >

        <h2>Property Information</h2>

        {/* PROPERTY NAME */}
        <label htmlFor="edit-title">
          Property Name
        </label>

        <input
          id="edit-title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          disabled={saving}
          required
        />

        {/* DESCRIPTION */}
        <label htmlFor="edit-description">
          Description
        </label>

        <textarea
          id="edit-description"
          name="description"
          value={form.description}
          onChange={handleChange}
          disabled={saving}
          rows={5}
          required
        />

        {/* STREET ADDRESS */}
        <label htmlFor="edit-address">
          Street Address
        </label>

        <input
          id="edit-address"
          name="address"
          type="text"
          value={form.address}
          onChange={handleChange}
          disabled={saving}
        />

        {/* LOCATION */}
        <div className="listing-form-row">

          <div>
            <label htmlFor="edit-city">
              City
            </label>

            <input
              id="edit-city"
              name="city"
              value={form.city}
              onChange={handleChange}
              disabled={saving}
              required
            />
          </div>

          <div>
            <label htmlFor="edit-state">
              State
            </label>

            <input
              id="edit-state"
              name="state"
              value={form.state}
              onChange={handleChange}
              disabled={saving}
              required
            />
          </div>

          <div>
            <label htmlFor="edit-zipCode">
              ZIP Code
            </label>

            <input
              id="edit-zipCode"
              name="zipCode"
              value={form.zipCode}
              onChange={handleChange}
              disabled={saving}
              maxLength={5}
              inputMode="numeric"
            />
          </div>

        </div>

        {/* CONTACT INFORMATION */}
        <label htmlFor="edit-contactInfo">
          Contact Information
        </label>

        <input
          id="edit-contactInfo"
          name="contactInfo"
          type="text"
          value={form.contactInfo}
          onChange={handleChange}
          disabled={saving}
        />

        {/* PRICE / GUESTS / BEDROOMS */}
        <div className="listing-form-row">

          <div>
            <label htmlFor="edit-price">
              Price per Night ($)
            </label>

            <input
              id="edit-price"
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              disabled={saving}
              required
            />
          </div>

          <div>
            <label htmlFor="edit-guests">
              Maximum Guests
            </label>

            <input
              id="edit-guests"
              name="guests"
              type="number"
              min="1"
              step="1"
              value={form.guests}
              onChange={handleChange}
              disabled={saving}
              required
            />
          </div>

          <div>
            <label htmlFor="edit-bedrooms">
              Bedrooms
            </label>

            <input
              id="edit-bedrooms"
              name="bedrooms"
              type="number"
              min="1"
              step="1"
              value={form.bedrooms}
              onChange={handleChange}
              disabled={saving}
              required
            />
          </div>

        </div>

        {/* AMENITIES */}
        <h2>Amenities</h2>

        <div className="amenities-checkboxes">
          {[
            ...new Set([
              ...amenityOptions,
              ...form.amenities,
            ]),
          ].map((amenity) => (
            <label
              key={amenity}
              className="amenity-checkbox"
            >
              <input
                type="checkbox"
                checked={form.amenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
                disabled={saving}
              />

              {amenity}
            </label>
          ))}
        </div>

        {/* IMAGE */}
        <h2>Photos</h2>

        <label htmlFor="edit-image">
          Property Image URL (optional)
        </label>

        <input
          id="edit-image"
          name="image"
          type="url"
          value={form.image}
          onChange={handleChange}
          disabled={saving}
          placeholder="https://example.com/property.jpg"
        />

        {form.image && (
          <img
            src={form.image}
            alt="Property preview"
            className="listing-image-preview"
          />
        )}

        {/* AVAILABILITY */}
        <h2>Availability and Check-in/out</h2>

        <p className="muted-text">
          Available Until is the last permitted
          checkout date. Changing the schedule
          cannot exclude existing confirmed bookings.
        </p>

        <div className="listing-form-row">

          <div>
            <label htmlFor="edit-availableFrom">
              Available From
            </label>

            <input
              id="edit-availableFrom"
              name="availableFrom"
              type="date"
              value={form.availableFrom}
              onChange={handleChange}
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="edit-availableTo">
              Available Until (last checkout)
            </label>

            <input
              id="edit-availableTo"
              name="availableTo"
              type="date"
              min={form.availableFrom || undefined}
              value={form.availableTo}
              onChange={handleChange}
              disabled={saving}
            />
          </div>

        </div>

        <div className="listing-form-row">

          <div>
            <label htmlFor="edit-checkInTime">
              Check-in Time
            </label>

            <input
              id="edit-checkInTime"
              name="checkInTime"
              type="time"
              value={form.checkInTime}
              onChange={handleChange}
              disabled={saving}
              required
            />
          </div>

          <div>
            <label htmlFor="edit-checkOutTime">
              Check-out Time
            </label>

            <input
              id="edit-checkOutTime"
              name="checkOutTime"
              type="time"
              value={form.checkOutTime}
              onChange={handleChange}
              disabled={saving}
              required
            />
          </div>

        </div>

        {/* ADMIN APPROVAL NOTE */}
        <p className="listing-approval-note">
          Updating your property will return it to
          pending status until an Admin reviews
          the changes.
        </p>

        {/* ERROR MESSAGE */}
        {error && (
          <p
            className="error-message"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* ACTION BUTTONS */}
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
            disabled={saving}
          >
            {saving
              ? "Saving Changes..."
              : "Save Changes"}
          </button>

        </div>

      </form>
    </main>
  );
}
