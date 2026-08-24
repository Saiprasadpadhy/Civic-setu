# CivicSetu – Community Grievance Management Platform

> A modern, full‑stack web app that empowers citizens, officers, and administrators to submit, track, and resolve civic grievances with AI‑enhanced triage, multilingual support, and rich analytics.

---

## 🗺️ Overview

CivicSetu (pronounced _see‑vick‑set‑you_) is a **hackathon‑grade** platform built for municipal administrations. It streamlines the entire grievance lifecycle:

1. **Citizens** submit complaints (text, images, voice, location) in English, Hindi, or Odia.
2. **AI** (Gemini 2.0) automatically categorises, scores severity, predicts priority, flags duplicates, and generates an analysis report.
3. **Officers** claim and resolve grievances, upload evidence, and add remarks.
4. **Admins** monitor city‑wide performance via dashboards, heat‑maps, SLA tracking, and participatory budget simulations.

All data lives in **MongoDB** and the API is secured with **JWT** and role‑based access control.

---

## ✨ Key Features

- **AI‑powered triage** – instant categorisation, severity scoring, priority calculation, duplicate detection, and multilingual support.
- **Voice‑to‑text** input for complaints (English/Hindi/Odia).
- **Image upload & analysis** – pictures of potholes, garbage, broken streetlights, etc.
- **Location picker** using **React‑Leaflet** – citizens pinpoint exact locations on a map.
- **Dynamic dashboards** – Recharts visualisations for admins (ward heat‑maps, SLA metrics, budget voting).
- **Role‑based UI** – distinct portals for Public, Citizen, Officer, and Admin users.
- **Responsive design** – Tailwind CSS with dark‑mode and glassmorphism aesthetics.
- **Comprehensive testing** – 27 backend unit/integration tests, including Phase‑5 AI scenarios.

---

## 🛠️ Tech Stack

| Layer     | Technology                                                                 |
| --------- | -------------------------------------------------------------------------- |
| Frontend  | React 18, Vite, Tailwind CSS, React‑Router, Axios, Recharts, React‑Leaflet |
| Backend   | Node 18, Express, MongoDB (Mongoose), JWT, Gemini AI SDK                   |
| CI/CD     | GitHub Actions (run tests, lint, build)                                    |
| Testing   | Vitest / Supertest                                                         |
| Dev Tools | ESLint, Prettier                                                           |

---

## 🚀 Getting Started

### Prerequisites

- **Node >= 18**
- **npm** (comes with Node)
- **MongoDB** instance (local or Atlas)
- **Gemini API KEY** (for AI features)

### Clone & Install

```bash
git clone https://github.com/Saiprasadpadhy/hackathon-project.git
cd hackathon-project
```

#### Backend

```bash
cd server
cp .env.example .env   # edit with your MONGODB_URI, JWT_SECRET, GEMINI_API_KEY
npm install
npm run seed           # seed reference data & test users
npm run dev            # API runs at http://localhost:5000
```

#### Frontend

```bash
cd ../client
npm install
npm run dev            # Frontend runs at http://localhost:5173
```

Open `http://localhost:5173` in your browser and log in with one of the seeded users (e.g. `citizen@civicsetu.test` / `password123`).

---

## 📦 Deployment

The app can be containerised with Docker (Dockerfile present in each sub‑folder). For a quick production build:

```bash
# Frontend
npm run build   # creates ./dist
# Serve with any static web server (e.g., Nginx)
```

Backend can be deployed to any Node‑compatible environment (Heroku, Vercel, Railway, etc.) – just set the same environment variables.

---

## 🤝 Contributing

1. Fork the repo and create a feature branch.
2. Follow the existing coding style (ESLint + Prettier).
3. Write unit tests for new logic.
4. Open a Pull Request – ensure CI passes.

---

## 📜 License

This project is licensed under the **MIT License** – see `LICENSE` for details.

---

## 📞 Contact

- **Maintainer:** Saiprasad Padhy – [GitHub](https://github.com/Saiprasadpadhy)
- **Issues:** Open a GitHub Issue for bugs or feature requests.

---

<<<<<<< HEAD
_Built for the Smart India Hackathon 2026._
=======
_Built for the Smart India Hackathon 2026._

> > > > > > > 7a4944e5399006d2a72d9a8782b299835b0431df
