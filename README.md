# Digital Footprint Map ⚡

[![Deployment Status](https://img.shields.io/badge/Deployment-Live%20on%20Vercel-brightgreen?style=for-the-badge&logo=vercel)](https://digital-footprint-map.vercel.app/)

**Digital Footprint Map** is an interactive web application built on a that *Groovy* aesthetic, designed to help users track, map, and analyze their hidden digital footprint. By securely scanning a Gmail inbox, the system detects historical registration emails from various digital services and assembles them into an interactive radial network topology.

This application was developed as a self-project to learn more about API usage, especially Google API

🔗 **Live Demo:** [https://digital-footprint-map.vercel.app/](https://digital-footprint-map.vercel.app/)

---

## 🚀 Key Features & System Updates

- **Secure Google OAuth Handshake**: Integrated login using Google Sign-In. The user's access token (`google_access_token`) is immediately isolated and secured in the database using the industry-standard **Fernet (AES-128)** cryptographic algorithm.
- **High-Concurrency Radar Scanner**: The backend scanning engine uses an asynchronous pattern (`httpx` + `asyncio.gather`) to fetch metadata from 100 emails in parallel. Reduces execution time from 15 seconds to under 2 seconds, avoiding Vercel's *Serverless Timeout*.
- **Automated Risk & Category Assessment**: Equipped with a dynamic rules dictionary (*Radar Rules Engine*) that automatically categorizes platforms (e.g. *Social Media*, *Entertainment*, *Finance*) and assigns personal data risk labels (*HIGH*, *MEDIUM*, *LOW*).
- **Interactive Radial Graph Topology**: Uses `@xyflow/react` (ReactFlow) to render a dynamic spider-web data visualization. Node positions are optimized with an anti-overlap *staggered ring layers* algorithm, with responsive 1-finger *pan-on-drag* support on mobile.
- **Real-Time Data Purge Protocol**: The data deletion button connects directly to the backend API (`DELETE`). On click, it severs the cyber-trace records from the NeonDB database and instantly re-renders the visual map topology on the frontend with no page reload (*real-time collapse*).
- **Dynamic Viewport Height Layout**: Uses the modern CSS unit `100dvh` to ensure all visual control tools and scan buttons are never clipped by the browser navigation bar on mobile.

---

## 🛠️ Technology Architecture

### Backend (`/backend`)
- **Core Framework**: FastAPI (Python 3.10+) — High performance, async, with automatic OpenAPI/Swagger documentation.
- **ORM Database Engine**: SQLModel (SQLAlchemy + Pydantic v2 combined) connected to the **NeonDB (PostgreSQL)** serverless cloud database.
- **Database Migrations**: Alembic for versioned, structured schema tracking.
- **Security & Crypto**: PyJWT (User session authentication) & Cryptography Fernet.

### Frontend (`/frontend`)
- **Framework & Build Tools**: React 19 + TypeScript + Vite.
- **Interactive Canvas Engine**: React Flow (`@xyflow/react`) for rendering the cyber diagram.
- **Styling Architecture**: Tailwind CSS v4 with a *Modern Neo-Brutalist* aesthetic approach.

---

## 📦 Local Installation Guide

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- A Google Cloud Console project with **Gmail API** enabled & OAuth 2.0 Credentials configured.

### 1. Clone the Repository
```bash
git clone https://github.com/revansyahfaris/digital-footprint-map.git
cd digital-footprint-map
```

### 2. Backend Configuration

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder and fill in the following variables:

```env
DATABASE_URL="postgresql://user:password@your-neondb-url/dbname?sslmode=require"
JWT_SECRET="your-random-secret-jwt-string"
ENCRYPTION_KEY="your-fernet-key-32-bytes-base64-url-safe"
OAUTH_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
OAUTH_CLIENT_SECRET="your-google-client-secret"
```

Run the local database migration and start the uvicorn server:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

### 3. Frontend Configuration

Open a new terminal tab outside the backend folder:

```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend/` folder and register your Google Client ID:

```env
VITE_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
```

Start the local development server (supports mobile access via laptop IP):

```bash
npm run dev -- --host
```

---

## 📡 Vercel Serverless Deployment Configuration

This application is fully configured so that the Python backend and React frontend can run harmoniously side by side as a single *Serverless Monorepo* domain via the `vercel.json` file:

```json
{
  "version": 2,
  "builds": [
    { "src": "backend/index.py", "use": "@vercel/python" },
    { "src": "frontend/package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } }
  ],
  "rewrites": [
    { "source": "/api/(.*)", "destination": "backend/index.py" },
    { "source": "/((?!api/).*)", "destination": "/frontend/$1" }
  ]
}
```

---

## ⚖️ Privacy Notice & Disclaimer

This application is an **Self Sandbox Project**. The Gmail scan reads only the sender metadata (`From` header) of the 100 most recent registration emails *in-memory* and **NEVER** reads, opens, or stores the content of any email message body. The *Request Data Deletion* feature severs and removes all historical cyber-trace data from the application's local database (NeonDB).