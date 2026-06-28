# AccessRoute 🦽

An accessibility-first navigation app, designed to help people with mobility impairments plan, preview, and travel safe routes — with real-time obstacle alerts, ride-hailing integration, and safety features built in.

---

## Tech Stack

| Layer    | Technology                                                              |
|----------|-------------------------------------------------------------------------|
| Frontend | React 19, Vite, React Router v7, Zustand, MapLibre GL, CSS Modules      |
| Backend  | Node.js, Express.js, JWT Auth, bcryptjs, UUID (in-memory mock DB)       |
| Maps     | MapLibre GL / react-map-gl · OpenFreeMap vector tiles (no API key)      |

---

## Features

### 🗺️ Accessible Route Planning
- Search origin & destination with autocomplete from saved places and accessible POIs
- Choose transport mode: Walking, Walk + Bus, Walk + Motorbike (Grab/Be), Mixed
- Personalise by priority: Safest, Fastest, Cheapest, Most Accessible

### 📊 Route Comparison
- Side-by-side optimised vs normal route on a live map
- Accessibility scores, safety scores, obstacle warnings highlighted on map
- Per-segment scoring based on surface quality, sidewalk width, and ramp availability

### 🔍 Pre-Commute Route Preview
- Step through every segment of a route before leaving home
- Each step shows: street name, surface quality, wheelchair ramp, sidewalk width bar, active alerts
- Summary: ramp count, average width, total alerts on route

### 🏍️ Grab / Be Ride-Hailing Integration
- When a motorbike leg is detected, prompts "Do you want to book Grab/Be?"
- Mocked booking page with Grab & Be tabs, vehicle options, price estimates, ETA
- Booking confirmation screen with driver name, plate, rating, live countdown

### 🧭 Turn-by-Turn Navigation
- Animated user position follows route in real time
- Progress bar, remaining distance & ETA
- Route save + post-trip rating

### ⚠️ Accessibility Alerts
- Live obstacle feed (flooding, potholes, construction, narrow paths…)
- Each alert enriched with GPS coordinates and street name from its segment
- Tap any alert to open a detail view with a map showing the exact segment + hazard pin
- Filter by status: all / active / resolved

### 👁️ Transit Buddy
- Nominate a contact before departure — they receive a trip notification
- Buddy name and ETA displayed in the navigation screen throughout the trip

### 🆘 SOS Button
- Hold-to-activate (2 s) floating red button during navigation — prevents accidental press
- On activation: shows current GPS coordinates, notifies all emergency contacts, prominent "Call 113" link

### 👤 Profile
- Edit personal info, mobility type, max walking distance
- Bank account details
- Email / password change (UI)
- Emergency contacts management (persisted locally, used by SOS)

---

## Project Structure

```
GrabHackathon/
├── backend/
│   ├── config/              # env config
│   ├── controllers/         # route handlers (auth, user, map, route, trip…)
│   ├── data/
│   │   ├── mockdata.json    # seed data (segments, alerts, places, routes…)
│   │   └── mockDB.js        # in-memory DB + CRUD helpers
│   ├── middleware/          # JWT auth guard
│   ├── routes/              # Express routers
│   ├── services/
│   │   └── routeService.js  # route scoring & ranking engine
│   └── server.js
└── frontend/
    └── frontend/
        └── src/
            ├── components/
            │   ├── common/      # AlertCard, BackButton, RouteCard, TripCard…
            │   ├── layout/      # Header, BottomNav, AppLayout, ProtectedRoute
            │   ├── map/         # MapView (MapLibre wrapper)
            │   ├── BuddyInviteSheet.jsx
            │   └── SosButton.jsx
            ├── constants/       # labels, transport modes, issue types
            ├── hooks/           # useGeolocation
            ├── pages/
            │   ├── HomePage.jsx
            │   ├── SearchPage.jsx
            │   ├── ConfirmPage.jsx
            │   ├── OptionsPage.jsx
            │   ├── ComparePage.jsx
            │   ├── RoutePreviewPage.jsx
            │   ├── NavigationPage.jsx
            │   ├── GrabBookingPage.jsx
            │   ├── AlertsPage.jsx
            │   ├── SavedPage.jsx
            │   ├── TripsPage.jsx
            │   ├── ProfilePage.jsx
            │   └── ReportPage.jsx
            ├── services/        # API clients (auth, user, map, route, trip…)
            ├── store/           # Zustand global store
            ├── styles/          # Page-level CSS Modules
            └── utils/           # geo helpers, route formatters
```

---

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/ngochan0215/Grab-Future-Hackathon.git
cd GrabHackathon
```

### 2. Start the backend

```bash
cd backend
npm install
npm run dev
```

### 3. Start the frontend

Open a new terminal:

```bash
cd frontend/frontend
npm install
npm run dev
```

---

## User Flow

```
Home → Search (origin + destination)
     → Confirm trip
     → Personalise (mode + priority)
     → Compare routes  ──→  Preview route (segment by segment)
                       ──→  Invite Transit Buddy
                       ──→  [Motorbike mode] Book Grab / Be
     → Navigate (live map, SOS button, buddy status bar)
     → Arrived → Rate & save route
```

---

## Environment Variables

The backend reads from a `.env` file (optional — defaults are used if absent):

```env
PORT=3000
JWT_SECRET=your_jwt_secret
```
