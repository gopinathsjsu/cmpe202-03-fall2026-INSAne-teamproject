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
| Suhail Tailor | [@stailor-creator](https://github.com/stailor-creator) | | |
| Ishita Prakash | | | working on the frontend |
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

- [o] Register / Login as Customer
- [0 ] Search rentals by date, time, # guests, duration, availability
- [ ] Optional search filters: city / state / zip code
- [ ] Address search via Google Maps integration
- [ ] Browse results with photos/videos, amenities, cost rating, reviews & ratings, and # of times booked today
- [ ] View listing locations on Google Maps
- [0 ] Book a stay (max. 14 days)
- [0] Cancel a booking
- [ ] Submit reviews and ratings on past bookings

### 🏠 Host

- [ 0] Register / Login as Host
- [ 0] Add a new listing
- [0 ] Remove a listing
- [ 0] View my listings
- [0 ] Add / update name, address, contact info, hours, available booking times, max # guests
- [0 ] Add / update descriptions, photos
- [0 ] Analytics dashboard — rentals and bookings by zip code over 30 / 60 / 90 day periods, scoped to my listings

### 🛡️ Admin

- [ 0] Login as Admin
- [ ] Remove incomplete or inaccurate listings
- [ ] Approve new rentals for inclusion on the app
- [ ] Analytics dashboard — rentals and bookings by zip code over 30 / 60 / 90 day periods, across all listings

---

## Tech Stack

| Layer | Tech | Owner |
|-------|------|-------|
| Frontend | React.js | |
| Backend | Node.js | |
| Database | PostgreSQL | |
| External APIs | Google Maps JavaScript & Geocoding API | |
| Cloud Hosting | AWS (for now) — Auto Scaling EC2 cluster behind a Load Balancer | |
| CI/CD | GitHub Actions | |
| Testing | _TODO_ | |

---

## Architecture & Diagrams

### Component Diagram

> **TODO:** Add `docs/diagrams/component-diagram.png` and embed it here.

### Deployment Diagram

> **TODO:** Add `docs/diagrams/deployment-diagram.png` and embed it here.
> Must show the auto-scaled EC2 cluster, load balancer, and database tier.

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
