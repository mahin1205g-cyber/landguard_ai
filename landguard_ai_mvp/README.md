# LandGuard AI — Working MVP (P2 + P3 + P5)

A long, responsive single-page React dashboard backed by FastAPI and SQLite. All sample records are fictional synthetic data.

## Project structure
- `backend/main.py` — FastAPI read-only API
- `backend/landguard_synthetic.db` — generated SQLite database
- `backend/requirements.txt` — backend dependencies
- `frontend/` — React + Vite long-page web UI

## Requirements
- Python 3.10+
- Node.js 18+ and npm

## Start the backend (Terminal 1)
```bash
cd backend
python -m venv .venv
```
Windows:
```bash
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
macOS/Linux:
```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
API docs: http://127.0.0.1:8000/docs

## Start the frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```
Open the URL Vite prints (usually http://localhost:5173).

## Features
- Long responsive landing/dashboard page
- Overview stats from SQLite
- Synthetic parcel search and parcel details
- P2 deed inconsistency alerts
- P3 possible duplicate-sale alerts
- P5 mutation, legal-case, and acquisition risk flags
- Filterable alert centre
- Parcel check endpoint
- API docs link
- Clear synthetic-data disclaimer

## API endpoints
- `GET /`
- `GET /api/summary`
- `GET /api/parcels?q=&limit=`
- `GET /api/parcels/{parcel_id}`
- `GET /api/alerts?module=P2|P3|P5&severity=high`
- `POST /api/check` body: `{"parcel_id":"LP-0001"}`

## Important
This is a hackathon prototype. It is not connected to Bangladesh government land systems. Names, parcel IDs, deeds, cases, and notices are fictional. Risk flags are review signals only, not proof of fraud, ownership, or legal status. Do not present demo output as official verification.


## Language and login
- Bengali is the default interface language.
- The top bar has বাংলা / EN language controls.
- The Login page is a demo-only UI. It does not implement real user authentication, password storage, or account security. Do not enter a real password.
- Use the "Continue to demo without signing in" option to return to the app.


## Latest UI updates
- Login page is shown first on opening the app.
- Risk check result labels and disclaimer are Bengali by default, with English available via the language toggle.
