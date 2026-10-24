import { properties as demoProperties } from "../data/properties";
import { getListings } from "./listings";

// Convert host listings to the same format as demo properties.
function normalizeHostListing(listing) {
  return {
    ...listing,
    id: String(listing.id),
    title: listing.title,
    city: listing.city,
    state: listing.state,
    zipCode: listing.zipCode,
    price: Number(listing.price) || 0,
    rating: 0,
    reviews: 0,
    guests: Number(listing.maxGuests) || 1,
    bedrooms: Number(listing.bedrooms) || 1,
    amenities: listing.amenities || [],
    bookedToday: 0,
    image: listing.image,
    isHostListing: true,
  };
}

export function getAvailableProperties() {
  const approvedHostListings = getListings()
    .filter((listing) => listing.status === "approved")
    .map(normalizeHostListing);

  return [
    ...demoProperties,
    ...approvedHostListings,
  ];
}

export function getPropertyById(id) {
  return getAvailableProperties().find(
    (property) => String(property.id) === String(id)
  );
}