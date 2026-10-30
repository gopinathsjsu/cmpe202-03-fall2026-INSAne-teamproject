# Google Maps Integration — Setup

The app uses Google Maps for:

| Feature | Where | Google API |
|---------|-------|------------|
| Address → coordinates when a host saves a listing | Backend | Geocoding API |
| Customer address search (listings within X miles) | Home page | Places API (New) |
| Address autocomplete for hosts (fills city/state/ZIP) | Add / Edit Listing | Places API (New) |
| Map of search results with price pins | Home page | Maps JavaScript API |
| Approximate-area map on each listing | Listing page | Maps JavaScript API |

Everything works without keys: maps and suggestions are simply hidden, and
search falls back to matching city, state, or ZIP text.

## 1. Create the keys (one person, once)

1. In [Google Cloud Console](https://console.cloud.google.com/), create a
   project and link a billing account. Usage for this project stays within
   Google's free monthly allowance.
2. Under **APIs & Services → Library**, enable:
   - **Geocoding API**
   - **Maps JavaScript API**
   - **Places API (New)**
3. Under **APIs & Services → Credentials**, create two API keys:
   - **Server key**: restrict to *Geocoding API*. If the backend has a fixed
     IP (e.g. the EC2 NAT / Elastic IP), add it under application restrictions.
   - **Browser key**: restrict to *Maps JavaScript API* and *Places API (New)*,
     and under *Websites* add `http://localhost:5173/*` and the deployed
     frontend URL.
4. Protect against surprise charges:
   - **Billing → Budgets & alerts**: add a budget (e.g. $1) with email alerts.
   - **APIs & Services → each API → Quotas**: set a requests-per-day cap.

Share the keys privately. Never commit them.

## 2. Configure the app

`backend/.env`:

```
GOOGLE_MAPS_SERVER_KEY=your_server_key
```

`frontend/.env`:

```
VITE_GOOGLE_MAPS_BROWSER_KEY=your_browser_key
# Optional; DEMO_MAP_ID works for development
VITE_GOOGLE_MAPS_MAP_ID=
```

Restart both servers after changing `.env` files.

## 3. Update the database (once per database)

```
psql -d insane_stays -f backend/database/add_property_location.sql
```

This adds `latitude` and `longitude` to `properties`. It is safe to run again.

Then geocode listings that already exist:

```
cd backend
npm run geocode
```

New and edited listings are geocoded automatically when saved.

## How it works

- **Saving a listing** stores it immediately, then looks up its coordinates in
  the background. If Google is down or the address is not found, the listing
  is still saved, just without a map location. Editing the address, city,
  state, or ZIP clears the old coordinates and looks them up again.
- **Privacy:** the exact address is never sent to the public. Public API
  responses round coordinates to 2 decimal places (about 1 km), and the
  listing page shows a circle over the approximate area instead of a pin.
- **Nearby search:** `GET /api/properties?lat=37.33&lng=-121.88&radius=25`
  returns approved listings within `radius` miles (default 25, max 100),
  nearest first, each with `distance_miles`. Invalid values return `400` with
  a JSON `message`.
