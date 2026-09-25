# FoodRescue 🍽️

**Intelligent Surplus Food Coordination & Live Delivery Tracking**

A full-stack web platform that connects surplus food donors (restaurants, hostels, households, event organizers) with nearby volunteers and NGOs to rescue edible food before it expires.

---

## 📖 Project Context

This is a **Vision2Web Full Stack Web Development Hackathon** submission (2-day build).
- **Track:** Theme 2 — Community & Social Impact
- **Challenge:** Food Donation Coordinator
- **Status:** 🚧 In Progress

---

## 🎯 Core Features (MVP)

### Donor Workflow
- Create surplus food donations with quantity, location, pickup deadline, and expiry time
- View donation status and assigned volunteer
- Track active pickups in real-time
- See donation counts and impact metrics

### Volunteer Workflow
- Discover nearby donations sorted by urgency (expiry time)
- Search and filter by distance, category, expiry status
- Claim pickups with intelligent matching recommendations
- Share live location during active delivery
- Update status: Arrived → Picked Up → In Transit → Delivered

### Admin Workflow
- Monitor all donations and active pickups
- View platform impact metrics (rescued servings, completed deliveries, expired donations)
- Intervene in exceptions
- Review user activity

### Key Capabilities
- ✅ Donation lifecycle tracking (8 states: AVAILABLE, MATCHED, CLAIMED, PICKED_UP, IN_TRANSIT, DELIVERED, EXPIRED, CANCELLED)
- ✅ Expiry-aware urgency filtering
- ✅ Smart matching engine (distance + urgency + capacity + food compatibility)
- ✅ Live tracking map with volunteer geolocation
- ✅ Realtime status updates
- ✅ Role-based access control
- ✅ Activity dashboard with impact metrics
- ✅ Responsive UI (desktop & mobile)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 + TypeScript + Tailwind CSS v4 + Motion |
| **Backend** | Spring Boot 4.1 (Java 21) REST API, Maven |
| **Persistence** | Spring Data JPA (Hibernate) + Flyway migrations |
| **Database** | PostgreSQL hosted on Supabase (used as plain Postgres) |
| **Authentication** | Spring Security + JWT (HS256), BCrypt passwords, role-based access |
| **Realtime** | Server-Sent Events from Spring for live pickup tracking |
| **API docs** | springdoc-openapi (Swagger UI) |
| **Mapping** | Leaflet + OpenStreetMap |

---

## 📁 Project Structure

```
food-donation-app/
├── frontend/               # Next.js + TypeScript
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   └── package.json
├── backend/                # Spring Boot (Java 21, Maven)
│   ├── src/main/java/com/foodrescue/
│   │   ├── controller/     # REST endpoints
│   │   ├── service/        # business rules, matching, state machine
│   │   ├── repository/     # Spring Data JPA
│   │   ├── entity/         # JPA entities + enums
│   │   ├── dto/            # request/response records
│   │   ├── security/       # JWT issuing, current user
│   │   ├── config/         # security, CORS, OpenAPI
│   │   ├── exception/      # ProblemDetail error handling
│   │   └── seed/           # demo data
│   ├── src/main/resources/db/migration/   # Flyway SQL
│   ├── .env.example
│   └── pom.xml
├── .gitignore
└── README.md

```

---

## 🚀 Getting Started (Setup Checklist)

### Backend Setup (Java 21 + Maven)
1. Copy `backend/.env.example` to `backend/.env` and fill in the Supabase **Session pooler** connection details and a `JWT_SECRET` (32+ characters). `.env` is git-ignored.
2. Run:
```bash
cd backend
mvn spring-boot:run
```
Flyway creates the schema on first start and demo data is seeded automatically.

- API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger-ui.html
- Tests: `mvn test`

**Demo accounts** (password `demo12345`): `donor@foodrescue.dev`, `volunteer@foodrescue.dev`, `ngo@foodrescue.dev`, `admin@foodrescue.dev`

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📅 Development Timeline

### Day 1
- ✅ Backend foundation (Spring Boot, JPA, Flyway schema)
- ✅ Authentication & roles
- ✅ Donation CRUD & search endpoints
- ✅ Frontend: Sign in, create donation form, donation discovery

### Day 2
- ✅ Status updates & pickup workflows
- ✅ Live tracking map & geolocation
- ✅ Dashboards (donor, volunteer, admin)
- ✅ Realtime updates
- ✅ Testing & demo data
- ✅ Responsive design polish

---

## 💾 Git Workflow

⚠️ **Important:** All changes are staged locally. You will push manually to remote.

**Never push without approval from Tarun.**

To push when ready:
```bash
git push origin main
```

---

## 📊 Database Schema (Quick Reference)

- `users` — Donors, volunteers, admins
- `donations` — Surplus food postings
- `pickup_requests` — Pickup claims and status
- `location_updates` — Live volunteer locations
- `organizations` — NGOs and collection organizations
- `notifications` — User notifications

---

## 🎬 Demo Flow

1. Create donation: "80 vegetarian meals, pickup 6pm, expires 7pm"
2. Show HIGH URGENCY in discovery feed
3. Display matching recommendations (94% match)
4. Volunteer claims donation
5. Start live tracking → location updates on map
6. Update status through pickup workflow
7. Dashboard shows +80 rescued servings
8. Explain expiry urgency algorithm

---

## 📋 Evaluation Criteria (Vision2Web)

- ✅ Problem understanding and completeness
- ✅ Frontend usability and responsive design
- ✅ Backend/API design and database integration
- ✅ Functional correctness and validation
- ✅ Innovation and meaningful use of theme
- ✅ Code quality, security awareness, error handling
- ✅ Demo quality and technical explanations

---

## 🤝 Team Roles

| Workstream | Responsibilities |
|-----------|-----------------|
| **Frontend** | Dashboards, forms, discovery, donation details, tracking map, responsive UX |
| **Backend** | APIs, validation, state machine, matching logic, authorization |
| **Database/Realtime** | Supabase schema, RLS, realtime channels, seed data |
| **Integration/QA** | Maps, end-to-end flow, demo data, edge cases, deployment |

---

## 📝 License

For hackathon submission purposes.

---

## 👤 Author

Built during Vision2Web Hackathon 2026.

---

**Last Updated:** September 25, 2026 | **Status:** In Progress 🚧
