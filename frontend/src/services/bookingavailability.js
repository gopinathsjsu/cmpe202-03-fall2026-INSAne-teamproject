const BOOKINGS_KEY = "staynest_bookings";

// Convert YYYY-MM-DD into a UTC timestamp.
function dateToUTC(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

// Calculate the number of nights.
export function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;

  const start = dateToUTC(checkIn);
  const end = dateToUTC(checkOut);

  return (end - start) / (1000 * 60 * 60 * 24);
}

// Read existing bookings.
export function getBookings() {
  try {
    return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
  } catch {
    return [];
  }
}

// Check whether two date ranges overlap.
// A guest may check in on another guest's checkout date.
export function datesOverlap(
  start1,
  end1,
  start2,
  end2
) {
  return start1 < end2 && end1 > start2;
}

// Check availability for one property.
export function checkAvailability(propertyId, checkIn, checkOut) {
  if (!checkIn || !checkOut) {
    return {
      available: false,
      message: "Please select check-in and check-out dates.",
    };
  }

  const nights = calculateNights(checkIn, checkOut);

  if (!Number.isFinite(nights) || nights < 1) {
    return {
      available: false,
      message: "Check-out must be after check-in.",
    };
  }

  if (nights > 14) {
    return {
      available: false,
      message: "Reservations cannot exceed 14 nights.",
    };
  }

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  if (checkIn < todayString) {
    return {
      available: false,
      message: "Check-in cannot be in the past.",
    };
  }

  const bookings = getBookings();

  const conflictingBooking = bookings.find((booking) => {
    if (String(booking.propertyId) !== String(propertyId)) {
      return false;
    }

    if (booking.status !== "confirmed") {
      return false;
    }

    return datesOverlap(
      checkIn,
      checkOut,
      booking.checkIn,
      booking.checkOut
    );
  });

  if (conflictingBooking) {
    return {
      available: false,
      message: "This property is already booked for the selected dates.",
    };
  }

  return {
    available: true,
    message: "This property is available for your selected dates!",
  };
}