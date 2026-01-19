# Quick Start Guide (Using UV)

## Prerequisites

- Python 3.10+
- UV package manager (`pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`)
- Docker and Docker Compose

## Setup Steps

### 1. Start Docker Services

```bash
cd /home/akash/Documents/FASTAPI/Lost_and_found_management_system
docker-compose up -d
```

### 2. Install Dependencies with UV

```bash
cd backend
uv sync
```

This will:

- Create a virtual environment in `.venv`
- Install all dependencies from `pyproject.toml`
- Lock dependencies in `uv.lock`

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:

- `SECRET_KEY` - Generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`

### 4. Run Database Migrations

```bash
uv run alembic upgrade head
```

### 5. Start FastAPI Server

```bash
uv run uvicorn app.main:app --reload
```

API will be available at: http://localhost:8000

### 6. Start Celery Worker (New Terminal)

```bash
cd backend
uv run celery -A app.workers.celery_app worker --loglevel=info
```

### 7. Start Celery Beat (New Terminal)

```bash
cd backend
uv run celery -A app.workers.celery_app beat --loglevel=info
```

## Access Points

- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **Flower (Celery Monitor)**: http://localhost:5555
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

## Common UV Commands

```bash
# Install dependencies
uv sync

# Add a new dependency
uv add package-name

# Add a dev dependency
uv add --dev package-name

# Update dependencies
uv sync --upgrade

# Run a command in the virtual environment
uv run python script.py

# Activate the virtual environment manually
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows
```

## Test the API

### 1. Register a User

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "full_name": "Test User",
    "student_id": "STU001"
  }'
```

### 2. Login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

### 3. Get Current User (use token from login)

```bash
curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Troubleshooting

### UV Sync Fails

- Ensure Python 3.10+ is installed: `python --version`
- Try: `uv sync --reinstall`

### Database Connection Error

- Ensure PostgreSQL is running: `docker ps | grep postgres`
- Check connection string in `.env`

### Import Errors

- Run: `uv sync` to ensure all dependencies are installed
- Check that you're using `uv run` prefix for commands

## Development Workflow

```bash
# Make code changes...

# Run migrations if you changed models
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head

# Run the server (auto-reloads on changes)
uv run uvicorn app.main:app --reload
```

## Stop Services

```bash
# Stop Docker services
docker-compose down

# Stop FastAPI (Ctrl+C in terminal)
# Stop Celery worker (Ctrl+C in terminal)
# Stop Celery beat (Ctrl+C in terminal)
```

## Why UV?

UV is faster than pip and provides:

- ⚡ Faster dependency resolution
- 🔒 Automatic lock file management
- 📦 Better dependency isolation
- 🚀 Simpler workflow with `uv run`
