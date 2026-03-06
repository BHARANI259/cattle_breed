# Cattle Breed Predictor Web App

## Overview
AI-powered cattle breed prediction system using YOLOv8 object detection and Ollama LLM for breed information generation.

---

## Prerequisites

- **Python 3.11+**
- **Node.js 20+**
- **PostgreSQL 15** running locally on `localhost:5432`
- **Ollama** installed and running with `llama3.2` model
- **YOLOv8 weights** (`best.pt`) placed in `backend/best.pt`

---

## Setup Instructions

### 1. PostgreSQL Setup

Ensure PostgreSQL 15 is running on `localhost:5432`. Create the database:

```bash
createdb cattle_db
```

Update the `.env` file in `backend/` with your PostgreSQL credentials.

---

### 2. Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Create and activate a Python virtual environment:

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure your `.env` file (update the database password):

```bash
cp .env.example .env
# Edit .env with your database credentials
```

Run the FastAPI development server:

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

Health check: `http://localhost:8000/health`

---

### 3. Frontend Setup

Navigate to the frontend folder (in a new terminal):

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

### 4. Ollama Setup

Ensure Ollama is installed from https://ollama.com

In a new terminal, start Ollama:

```bash
ollama serve
```

Pull the required model (in another terminal):

```bash
ollama pull llama3.2
```

Ollama will be available at `http://localhost:11434`

---

## Project Structure

```
cattle-breed-predictor/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   └── prediction.py    ← ORM models
│   │   ├── routes/              ← [Phase 2]
│   │   ├── services/            ← [Phase 2]
│   │   ├── schemas/             ← [Phase 2]
│   │   ├── database.py          ← Async SQLAlchemy setup
│   │   ├── config.py            ← Settings
│   │   └── main.py              ← FastAPI app
│   ├── uploads/                 ← Saved prediction images
│   ├── best.pt                  ← YOLOv8 weights (user provided)
│   ├── requirements.txt
│   ├── .env                     ← Local config (not in git)
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/          ← [Phase 2]
│   │   ├── pages/               ← [Phase 2]
│   │   ├── api/
│   │   │   └── axiosClient.js   ← API client
│   │   ├── hooks/               ← [Phase 2]
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js           ← Vite + proxy to backend
│   ├── tailwind.config.js       ← Custom colors
│   ├── postcss.config.js
│   └── package.json
├── .env.example
└── README.md
```

---

## Database Schema

### predictions table
- `id` (UUID, PK)
- `image_filename` (VARCHAR)
- `image_path` (VARCHAR)
- `predicted_breed` (VARCHAR)
- `confidence_score` (FLOAT)
- `all_class_scores` (JSONB) — Full YOLO probability distribution
- `bounding_boxes` (JSONB) — Detection boxes with coordinates
- `breed_info` (JSONB, nullable) — LLM-generated description
- `llm_model_used` (VARCHAR, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### breeds_cache table
- `id` (UUID, PK)
- `breed_name` (VARCHAR, UNIQUE)
- `breed_info` (JSONB) — Cached LLM response
- `cached_at` (TIMESTAMP)

---

## API Architecture (PHASE 1: Database Layer)

✅ **Complete:**
- Async SQLAlchemy ORM with asyncpg
- PostgreSQL database schema
- FastAPI application scaffold
- CORS middleware
- Static file serving for uploads
- Health check endpoint

📋 **Phase 2: Routes & Services**
- Prediction endpoints
- Breed cache endpoints
- File upload handling
- YOLO inference
- Ollama integration

🎨 **Phase 3: Frontend UI**
- Upload interface
- Results display
- Prediction history
- Breed information display

---

## Troubleshooting

**Database connection error:** Ensure PostgreSQL is running and the `.env` file has correct credentials.

**Ollama not connecting:** Ensure `ollama serve` is running and `llama3.2` is pulled.

**Port conflicts:** Change ports in `.env` and `vite.config.js` if needed.

**Module not found errors:** Ensure you've installed dependencies with `pip install -r requirements.txt` and `npm install`.

---

## Next Steps

- **Phase 2:** Implement prediction routes, YOLO inference, and Ollama LLM integration
- **Phase 3:** Build React UI components for upload, display, and history

---

## License

[Your License Here]
