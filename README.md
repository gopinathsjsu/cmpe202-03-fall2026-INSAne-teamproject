# INSAne

> **TODO:** One-sentence description of the app.

An end-to-end vacation rental booking and management platform (similar to Airbnb), built for CS 202 — Software Engineering.

---

## Table of Contents

- [Team](#team)
- [Project Journal](#project-journal)
- [Product & Sprint Backlog](#product--sprint-backlog)
- [Feature Set](#feature-set)
- [Tech Stack](#tech-stack)
- [Architecture & Diagrams](#architecture--diagrams)
- [UI Wireframes](#ui-wireframes)
- [Design Decisions](#design-decisions)

---

## Team

**Team Name:** _TODO_

| Name | GitHub | Component Owned | Areas of Contribution |
|------|--------|-----------------|----------------------|
| Alice Dao | [@alicemdao](https://github.com/alicemdao) | | |
| Suhail Tailor | [@Sptailor](https://github.com/Sptailor) | External APIs (Google Maps) | Address autocomplete, geocoding, location search by distance, and listing maps |
| Ishita Prakash | | | working on the frontend & backend|
| Navaneeth Puklath | [@NavaneethNairP](https://github.com/NavaneethNairP) | | |

> Each member owns at least one software component. Contribution summaries are updated at the end of each sprint.

---

## Project Journal

📓 **[Project Journal](docs/journal/)** — _TODO: link once the folder exists_

The journal contains, for each week:

- **Weekly Scrum Report** — what each member completed, what's next, what's blocked
- **Sprint Backlog** — stories committed for the sprint
- **Burndown Chart** — sprint progress

### XP Core Values

We selected the following two XP core values to follow throughout the project:

1. **_TODO: value #1_** — how the team practiced it
2. **_TODO: value #2_** — how the team practiced it

> Options: Communication · Simplicity · Feedback · Courage · Respect

---

## Product & Sprint Backlog

| Artifact | Link |
|----------|------|
| Product Backlog | _TODO_ |
| Sprint Backlog | _TODO_ |
| Task Board | _TODO_ |
| Burndown Chart | _TODO_ |

---

## Feature Set

All APIs accept and return **JSON**, with input validation and error handling. Access is gated by role.

### 👤 Customer

- [x] Register / Login as Customer
- [x] Search rentals by date, time, # guests, duration, availability
- [x] Optional search filters: city / state / zip code
- [x] Address search via Google Maps integration
- [~] Browse results with photos/videos, amenities, cost rating, reviews & ratings, and # of times booked today — photos, amenities, and reviews & ratings are live; video, cost-based sorting, and "# of times booked today" are not yet implemented
- [x] View listing locations on Google Maps
- [x] Book a stay (max. 14 days)
- [x] Cancel a booking
- [x] Submit reviews and ratings on past bookings
- [x] Message a host about a listing (added post-MVP — in-app inbox)

### 🏠 Host

- [x] Register / Login as Host
- [x] Add a new listing
- [x] Remove a listing
- [x] View my listings
- [x] Add / update name, address, contact info, hours, available booking times, max # guests
- [x] Add / update descriptions, photos
- [ ] Analytics dashboard — rentals and bookings by zip code over 30 / 60 / 90 day periods, scoped to my listings
- [x] Message a customer about their booking (added post-MVP — in-app inbox)

### 🛡️ Admin

- [x] Login as Admin
- [x] Remove incomplete or inaccurate listings (via reject)
- [x] Approve new rentals for inclusion on the app
- [ ] Analytics dashboard — rentals and bookings by zip code over 30 / 60 / 90 day periods, across all listings

> Legend: `[x]` done · `[~]` partially done · `[ ]` not started. Last verified against `main` @ `0ad3ec7`.

---

## Tech Stack

| Layer | Tech | Owner |
|-------|------|-------|
| Frontend | React.js | |
| Backend | Node.js | |
| Database | PostgreSQL | |
| External APIs | Google Maps JavaScript, Geocoding & Places API ([setup](docs/google-maps-setup.md)) | |
| Frontend Hosting | AWS Amplify — static build of `frontend/dist`, SPA rewrites, HSTS header ([amplify.yml](amplify.yml)) | |
| Backend Hosting | Docker container (`node:22-alpine`) on AWS — intended to run behind an Auto Scaling EC2 cluster + Load Balancer ([Dockerfile](backend/Dockerfile)) | |
| CI/CD | GitHub Actions | |
| Testing | _TODO_ | |

---

## Architecture & Diagrams

### Component Diagram

> **TODO:** Add `docs/diagrams/component-diagram.png` and embed it here.

### Deployment Diagram

> **TODO:** Add `docs/diagrams/deployment-diagram.png` and embed it here.
> Must show: AWS Amplify serving the built frontend (`amplify.yml`), the
> backend running from its Docker image (`backend/Dockerfile`, port 5001)
> on the auto-scaled EC2 cluster, the load balancer in front of it, and the
> PostgreSQL database tier.

### Database Schema

> **TODO:** Add ER diagram and describe the mock data set for listings.

---

## UI Wireframes

> **TODO:** Add one wireframe per screen to `docs/wireframes/` and link them below.

| Screen | Role | Wireframe |
|--------|------|-----------|
| | | |

---

## Design Decisions

> **TODO:** Record the significant choices and the reasoning behind each — stack selection, authentication and role handling, API structure, data model, and deployment topology.

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| | | |
