# FoodRescue

**Surplus food, rescued in minutes.**

FoodRescue connects surplus food from restaurants, hostels, households and events with nearby volunteers and NGOs. Donors post what's left, collectors are ranked by an explainable match score, and every pickup is tracked live from claim to delivery.

Built for the **Vision2Web Full Stack Web Development Hackathon** (Theme 2, Community & Social Impact: Food Donation Coordinator).

---

## Features

**Donors**
- Post food in under a minute: category, veg/non-veg, servings, expiry and collect-by time (IST), pickup spot on a map
- See the top collectors for each donation, ranked with a score breakdown and a plain-language reason
- Follow the pickup live on a map, with a status timeline and notifications

**Volunteers and NGOs**
- Discover feed sorted by urgency, match or distance, with filters and a list/map view
- Match score on every donation (urgency 40, distance 30, capacity 20, food fit 10)
- Claim (atomic: two simultaneous claims never both succeed), then start the trip to share location with consent
- Step through Arrived, Picked up, In transit, Delivered; release a pickup if plans change

**Admins**
- Operations: live map of all active pickups, stalled-pickup alerts, food expiring within 3 hours, cancel or take down
- Users directory with role filter and search
- Platform impact dashboard

**Everyone:** role-aware dashboards, notifications bell, responsive down to phone width, light and dark mode.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, Motion, Leaflet + OpenStreetMap |
| Backend | Spring Boot 4.1, Java 21, Maven |
| Persistence | Spring Data JPA (Hibernate), Flyway migrations |
| Database | PostgreSQL (hosted on Supabase, used as plain Postgres) |
| Auth | Spring Security, JWT (HS256), BCrypt; the JWT lives in an httpOnly cookie set by Next.js |
| Realtime | Server-Sent Events from Spring, relayed through the Next.js proxy |
| API docs | springdoc-openapi (Swagger UI) |

### How a request flows

```
Browser ──(httpOnly cookie)──> Next.js  /api/session/*   login/signup/logout, sets the cookie
                                        /api/backend/*   adds "Authorization: Bearer", forwards to Spring,
                                                         streams SSE, blocks cross-site writes
Next.js ─────────────────────> Spring Boot /api/*  ────> PostgreSQL
```

The token never reaches browser JavaScript. Spring checks the token and the user's role on every call.

---

## Project structure

```
food-donation-app/
├── frontend/                     Next.js app
│   ├── app/                      routes: landing, signin, signup, (app)/dashboard, donations, discover, pickups, admin
│   ├── app/api/                  session routes and the backend proxy
│   ├── components/               landing, auth, app shell, map, donations, pickups, admin
│   ├── lib/                      API client, session, IST time helpers, types
│   └── proxy.ts                  redirects signed-out visitors
├── backend/                      Spring Boot API
│   ├── src/main/java/com/foodrescue/
│   │   ├── controller/           REST endpoints
│   │   ├── service/              matching, pickup state machine, expiry job, SSE, notifications
│   │   ├── repository/           Spring Data JPA (atomic claim query lives here)
│   │   ├── entity/               JPA entities and enums
│   │   ├── dto/                  request/response records with Bean Validation
│   │   ├── security/ config/     JWT, Spring Security, CORS, OpenAPI
│   │   ├── exception/            ProblemDetail error responses
│   │   └── seed/                 demo data and reset
│   └── src/main/resources/db/migration/   Flyway SQL
└── README.md
```

---

## Running locally

**Backend** (Java 21 + Maven)

1. Copy `backend/.env.example` to `backend/.env` and fill in the database connection (Supabase **Session pooler**, or a local Postgres) and a `JWT_SECRET` of 32+ characters.
2. Start it:

```bash
cd backend
mvn spring-boot:run
```

Flyway creates the schema on first start and demo data is seeded into an empty database.

- API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger-ui.html
- Tests: `mvn test`

**Frontend**

1. Copy `frontend/.env.example` to `frontend/.env.local`. Set `NEXT_PUBLIC_DEMO_TOOLS=true` for demos.
2. Start it:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

**Demo accounts** (password `demo12345`)

| Role | Email |
|---|---|
| Donor | `donor@foodrescue.dev` |
| Volunteer | `volunteer@foodrescue.dev` |
| NGO | `ngo@foodrescue.dev` |
| Admin | `admin@foodrescue.dev` |

The sign-in page has one-click buttons for each.

---

## Demo

**Before presenting:** demo donations expire in real time. Sign in as admin, open **Operations**, and use **Reset demo data** (needs `NEXT_PUBLIC_DEMO_TOOLS=true` on the frontend and `SEED_DEMO_DATA=true` on the backend). Accounts are kept.

**Suggested flow**
1. As the donor, post "80 vegetarian meals" expiring in 1 hour. Show the ranked matches and the reason text.
2. As the volunteer, open Discover: it shows up as urgent, with the match score and breakdown.
3. Claim it. Try claiming from a second volunteer: the second one is refused.
4. Start the trip. On a laptop, use **Simulate movement (demo)**; on a phone, real GPS needs HTTPS.
5. In a second window as the donor, open the pickup: the marker moves live.
6. Step through Arrived, Picked up, In transit, Delivered. The donor's page updates on its own.
7. Show the dashboard servings go up, and the admin Operations page.

---

## Design decisions worth explaining

- **Atomic claim:** a single conditional `UPDATE ... WHERE status = 'AVAILABLE' AND expiry_time > now()`, plus a unique partial index on active pickups as a backstop.
- **State machine:** allowed pickup transitions live in the `PickupStatus` enum. Invalid jumps return 422 with a readable message.
- **Expiry:** reads treat uncollected food past expiry as expired immediately; a scheduled job persists it every minute.
- **Explainable matching:** fixed weights and a reason string, unit-tested.
- **Privacy:** location sharing needs an explicit tap, stops on delivery, and is only visible to the donor, the collector and admins. Phone numbers are only shown to people on the same pickup.
- **Supabase lock-down:** Row Level Security is enabled with no policies, so Supabase's public Data API can't read the tables; only the Spring app (table owner) can.
- **Times:** stored and exchanged in UTC; shown and entered in IST.

---

## Database

`users`, `organizations`, `donations`, `pickups`, `location_updates`, `notifications`. The schema is in `backend/src/main/resources/db/migration/`.

---

## Git workflow

Changes are committed locally and pushed manually by Tarun. Nothing is pushed automatically.
