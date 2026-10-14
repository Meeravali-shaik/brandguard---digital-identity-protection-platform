# BrandGuard — Digital Identity Protection Platform (Backend)

BrandGuard is a deterministic digital risk protection platform against brand impersonation, deceptive mobile apps, and rogue social profiles.

## Architecture

- **Runtime**: Python 3.12 + FastAPI
- **Database**: PostgreSQL 16 + SQLAlchemy 2.x + Alembic
- **Detection Engine**: RapidFuzz, Unicode confusable analysis, ImageHash perceptual hashing, scikit-learn TF-IDF
- **Architecture**: Modular monolith with REST API prefixed with `/api/v1`

## Quick Start with Docker Compose

To start PostgreSQL and the FastAPI backend locally:

```bash
cd backend
docker compose up --build
```

The FastAPI server will be available at:
- **API Base**: `http://localhost:8000/api/v1`
- **Swagger OpenAPI Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/v1/health/live`

## Running Locally Without Docker

1. Create a Python 3.12 virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. Configure environment variables in `.env`:
   ```bash
   DATABASE_URL=postgresql+psycopg://brandguard:brandguard@localhost:5432/brandguard
   API_HOST=0.0.0.0
   API_PORT=8000
   ```

3. Run database migrations:
   ```bash
   alembic upgrade head
   ```

4. Start development server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

5. Run test suite:
   ```bash
   pytest tests/ -v
   ```
