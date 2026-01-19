# Quick Start Guide

## Prerequisites

- Python 3.10+
- Docker and Docker Compose
- Git

## Setup Steps

### 1. Start Docker Services

```bash
cd /home/akash/Documents/FASTAPI/Lost_and_found_management_system
docker-compose up -d
```

This starts:

- PostgreSQL (port 5432)
- Redis (port 6379)
- MinIO (ports 9000, 9001)
- Elasticsearch (ports 9200, 9300)
- Flower (port 5555)

### 2. Create Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:

- `SECRET_KEY` - Generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- Database, Redis, and other service URLs (defaults should work with Docker Compose)

### 5. Run Database Migrations

```bash
alembic upgrade head
```

### 6. Start FastAPI Server

```bash
uvicorn app.main:app --reload
```

API will be available at: http://localhost:8000

### 7. Start Celery Worker (New Terminal)

```bash
cd backend
source venv/bin/activate
celery -A app.workers.celery_app worker --loglevel=info
```

### 8. Start Celery Beat (New Terminal)

```bash
cd backend
source venv/bin/activate
celery -A app.workers.celery_app beat --loglevel=info
```

## Access Points

- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **Flower (Celery Monitor)**: http://localhost:5555
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

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

Save the `access_token` from the response.

### 3. Get Current User

```bash
curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Create an Item

```bash
curl -X POST "http://localhost:8000/api/v1/items/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "lost",
    "title": "Lost Wallet",
    "description": "Black leather wallet with cards",
    "category": "wallet",
    "location_found": "Library",
    "date_lost_found": "2026-01-19",
    "tags": ["wallet", "black", "leather"]
  }'
```

## Troubleshooting

### Database Connection Error

- Ensure PostgreSQL is running: `docker ps | grep postgres`
- Check connection string in `.env`

### Redis Connection Error

- Ensure Redis is running: `docker ps | grep redis`
- Check Redis URL in `.env`

### Import Errors

- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

### Alembic Migration Errors

- Check database is running
- Verify DATABASE_URL in `.env` and `alembic.ini`

## Stop Services

```bash
# Stop Docker services
docker-compose down

# Stop FastAPI (Ctrl+C in terminal)
# Stop Celery worker (Ctrl+C in terminal)
# Stop Celery beat (Ctrl+C in terminal)
```

## Development Tips

1. **Auto-reload**: FastAPI auto-reloads on code changes when using `--reload`
2. **Database changes**: Run `alembic revision --autogenerate -m "description"` then `alembic upgrade head`
3. **View logs**: `docker-compose logs -f postgres` or `docker-compose logs -f redis`
4. **Reset database**: `docker-compose down -v` (WARNING: Deletes all data)

## Production Deployment

For production:

1. Set `DEBUG=False` in `.env`
2. Use strong `SECRET_KEY`
3. Configure production database
4. Set proper CORS origins
5. Use Gunicorn: `gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker`
6. Set up SSL/TLS
7. Configure monitoring and logging
