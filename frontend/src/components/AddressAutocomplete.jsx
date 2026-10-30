import { useEffect, useId, useRef, useState } from "react";

import {
  importGoogleLibrary,
  isGoogleMapsEnabled,
} from "../services/googleMaps";

const MIN_INPUT_LENGTH = 3;
const DEBOUNCE_MS = 250;

// ==========================================
// HELPER: READ GOOGLE ADDRESS COMPONENTS
// ==========================================
function getComponent(components, type, useShort = false) {
  const match = components.find((component) =>
    component.types.includes(type)
  );

  if (!match) return "";

  return useShort ? match.shortText : match.longText;
}

function placeToAddress(place) {
  const components = place.addressComponents || [];

  const streetNumber = getComponent(components, "street_number");
  const route = getComponent(components, "route");

  return {
    formattedAddress: place.formattedAddress || "",
    streetAddress: [streetNumber, route]
      .filter(Boolean)
      .join(" "),
    city:
      getComponent(components, "locality") ||
      getComponent(components, "postal_town") ||
      getComponent(components, "sublocality"),
    state: getComponent(
      components,
      "administrative_area_level_1",
      true
    ),
    zipCode: getComponent(components, "postal_code"),
    latitude: place.location?.lat() ?? null,
    longitude: place.location?.lng() ?? null,
  };
}

// ==========================================
// ADDRESS AUTOCOMPLETE
// A normal text input with Google Places
// suggestions. Without a key it is a plain
// input. onPlaceSelect receives:
// { formattedAddress, streetAddress, city,
//   state, zipCode, latitude, longitude }
// ==========================================
export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeTypes,
  ...inputProps
}) {
  const listId = useId();

  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);

  const sessionTokenRef = useRef(null);
  const requestIdRef = useRef(0);

  // Skip the lookup right after a selection
  // fills the input.
  const skipNextLookupRef = useRef(false);

  const enabled = isGoogleMapsEnabled();

  // ==========================================
  // FETCH SUGGESTIONS AS THE USER TYPES
  // ==========================================
  useEffect(() => {
    if (!enabled) return;

    if (skipNextLookupRef.current) {
      skipNextLookupRef.current = false;
      return;
    }

    const input = (value || "").trim();

    // Short input hides the list (see showList).
    if (input.length < MIN_INPUT_LENGTH) {
      return;
    }

    const requestId = ++requestIdRef.current;

    const timer = setTimeout(async () => {
      try {
        const {
          AutocompleteSessionToken,
          AutocompleteSuggestion,
        } = await importGoogleLibrary("places");

        // One token per search session keeps
        // Google billing it as a single session.
        if (!sessionTokenRef.current) {
          sessionTokenRef.current =
            new AutocompleteSessionToken();
        }

        const request = {
          input,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: ["us"],
        };

        if (placeTypes) {
          request.includedPrimaryTypes = placeTypes;
        }

        const { suggestions: results } =
          await AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request
          );

        if (requestId !== requestIdRef.current) return;

        setSuggestions(
          results
            .map((result) => result.placePrediction)
            .filter(Boolean)
        );
        setActiveIndex(-1);
        setOpen(true);

      } catch (error) {
        console.error("Address suggestions failed:", error);

        if (requestId === requestIdRef.current) {
          setSuggestions([]);
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [enabled, value, placeTypes]);

  // ==========================================
  // SELECT A SUGGESTION
  // ==========================================
  async function selectSuggestion(prediction) {
    setOpen(false);
    setSuggestions([]);

    try {
      const place = prediction.toPlace();

      await place.fetchFields({
        fields: [
          "formattedAddress",
          "location",
          "addressComponents",
        ],
      });

      // The session ends once a place is fetched.
      sessionTokenRef.current = null;

      skipNextLookupRef.current = true;
      onPlaceSelect?.(placeToAddress(place));

    } catch (error) {
      console.error("Address lookup failed:", error);
    }
  }

  // ==========================================
  // KEYBOARD NAVIGATION
  // ==========================================
  function handleKeyDown(event) {
    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        Math.min(index + 1, suggestions.length - 1)
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  if (!enabled) {
    return (
      <input
        {...inputProps}
        value={value}
        onChange={onChange}
      />
    );
  }

  const showList =
    open &&
    suggestions.length > 0 &&
    (value || "").trim().length >= MIN_INPUT_LENGTH;

  return (
    <div className="address-autocomplete">
      <input
        {...inputProps}
        value={value}
        onChange={(event) => {
          // Typing always triggers a fresh lookup.
          skipNextLookupRef.current = false;
          onChange(event);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        // Delay so a click on a suggestion lands first.
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={
          showList && activeIndex >= 0
            ? `${listId}-${activeIndex}`
            : undefined
        }
      />

      {showList && (
        <ul
          id={listId}
          className="address-suggestions"
          role="listbox"
        >
          {suggestions.map((prediction, index) => (
            <li
              key={prediction.placeId}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={
                index === activeIndex
                  ? "address-suggestion active"
                  : "address-suggestion"
              }
              onMouseDown={(event) => {
                event.preventDefault();
                selectSuggestion(prediction);
              }}
            >
              {prediction.text.toString()}
            </li>
          ))}

          <li
            className="address-suggestions-credit"
            aria-hidden="true"
          >
            Powered by Google
          </li>
        </ul>
      )}
    </div>
  );
}
