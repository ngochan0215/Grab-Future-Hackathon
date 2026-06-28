# G-Scores 🎯

A web application to look up and analyse 2024 Vietnamese High School Graduation Exam (THPT) scores.

🔗 **Demo:** https://golden-owl-assigment.vercel.app/

---

## Tech Stack

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Frontend | React, Vite, CSS Modules    |
| Backend  | Node.js, Express.js, MongoDB, Mongoose              |
| Infra    | Docker, Docker Compose                              |

---

## Project Structure

```
g-scores/
├── backend/
│   └── src/
│       ├── config/          # database connection, csv -> mongodb seeder
│       ├── models/          # mongoose schema
│       ├── utils/           # dataset 
│       ├── services/        # business logic
│       ├── controllers/     # route handlers
│       ├── routes/          # express routes
│       ├── middleware/      # error handler
├── frontend/
│   └── src/
│       ├── pages/           # ScoreLookup, Report, Top10
│       ├── components/      # Navbar
│       ├── hooks/           # Custom React hooks
│       ├── services/        # API calls
│       └── styles/          # Global CSS
└── docker-compose.yml
```

---

## Run Locally (without Docker)

### 1. Clone the repository

```bash
git clone <https://github.com/ngochan0215/golden-owl-assigment.git>
cd golden-owl
```

### 2. Setup Backend

```bash
cd backend
npm install
# Create your .env file by asking the owner for it
```

```

### 3. Seed the database

Make sure MongoDB is running, then:

```bash
npm run seed
```

You should see output like:
```
MongoDB connected: localhost
Đọc CSV từ: .../dataset/diem_thi_thpt_2024.csv
Đang seed dữ liệu...
✔ Batch 1: 1000 dòng đã xử lý
...
Seed xong — XXXXXX thí sinh đã được import vào MongoDB
```

### 4. Start the backend

```bash
npm run dev
# → http://localhost:3000
```

### 5. Setup & start the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Run with Docker

Make sure Docker Desktop is running, then from the project root:

```bash
docker compose up --build -d
docker compose run --rm seed
```

Frontend is not containerised — run it separately like the above instruction

---

## API Endpoints

| Method | Endpoint                   | Description                              |
|--------|----------------------------|------------------------------------------|
| GET    | `/api/scores`              | Get all scores (paginated)               |
| GET    | `/api/scores/:sbd`         | Look up a student by registration number |
| GET    | `/api/report/distribution` | Score band counts per subject            |
| GET    | `/api/report/top10`        | Top 10 students in Group A               |

---

## Features

- 🔍 **Score lookup** — search by 8-digit registration number
- 📊 **Report chart** — bar chart showing score distribution across 4 bands (≥8, 6–8, 4–6, <4) for each subject
- 🏆 **Top 10 Group A** — leaderboard ranked by Toán + Vật lý + Hoá học total
- 📱 **Responsive** — works on desktop, tablet, and mobile
