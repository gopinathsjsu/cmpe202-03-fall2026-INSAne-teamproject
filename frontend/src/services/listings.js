const LISTINGS_KEY = "insane_stays_listings";

export function getListings() {
  try {
    const listings = JSON.parse(
      localStorage.getItem(LISTINGS_KEY) || "[]"
    );
    return Array.isArray(listings) ? listings : [];
  } catch {
    return [];
  }
}

export function getHostListings(hostId) {
  return getListings().filter(
    (listing) => listing.hostId === hostId
  );
}

export function addListing(data, hostId) {
  const listings = getListings();

  const newListing = {
    ...data,
    id: crypto.randomUUID(),
    hostId,
    status: "pending",
    bookings: 0,
    createdAt: new Date().toISOString(),
  };

  listings.push(newListing);
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));

  return newListing;
}

export function deleteListing(listingId, hostId) {
  const listings = getListings();

  const listing = listings.find(
    (item) => item.id === listingId && item.hostId === hostId
  );

  if (!listing) {
    throw new Error("Listing not found or access denied.");
  }

  const updated = listings.filter(
    (item) => item.id !== listingId
  );

  localStorage.setItem(LISTINGS_KEY, JSON.stringify(updated));
  return updated;
}


export function updateListing(listingId, hostId, changes) {
  const listings = getListings();

  // Find the property belonging to this host
  const listing = listings.find(
    (item) =>
      item.id === listingId &&
      item.hostId === hostId
  );

  if (!listing) {
    throw new Error("Listing not found or access denied.");
  }

  // Update the listing information
  const updatedListings = listings.map((item) =>
    item.id === listingId
      ? {
          ...item,
          ...changes,
          id: item.id,
          hostId: item.hostId,
          status: "pending",
          updatedAt: new Date().toISOString(),
        }
      : item
  );

  // Save the updated listings
  localStorage.setItem(
    LISTINGS_KEY,
    JSON.stringify(updatedListings)
  );

  return updatedListings.find(
    (item) => item.id === listingId
  );
}
