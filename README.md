# Lost and Found Management System - Backend

A comprehensive Lost and Found Management System built with FastAPI, featuring real-time notifications, AI-powered matching, and secure verification workflows.

## Features

- 🔐 **JWT Authentication** - Secure user authentication with access and refresh tokens
- 👥 **User Management** - Role-based access control (Student/Admin)
- 📦 **Item Management** - Lost and found item tracking with multi-image support
- 🤖 **AI Matching** - Intelligent matching algorithm for lost and found items
- 🔔 **Real-time Notifications** - WebSocket-based live updates
- 💬 **Messaging System** - User-to-user communication
- ✅ **Claim Verification** - Secure verification workflow with admin approval
- 🔍 **Full-text Search** - Elasticsearch-powered search
- 📊 **Background Jobs** - Celery workers for async tasks
- 🗄️ **File Storage** - S3/MinIO integration for images
- ⚡ **Caching** - Redis-based caching and session management
- 🚦 **Rate Limiting** - Redis-based rate limiting

## Tech Stack

- **Framework**: FastAPI 0.109+
- **Database**: PostgreSQL with SQLAlchemy 2.0 (async)
- **Cache/Queue**: Redis
- **Search**: Elasticsearch
- **Storage**: MinIO/AWS S3
- **Background Jobs**: Celery
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt

## Project Structure

```
backend/
├── app/
│   ├── api/v1/          # API endpoints
│   ├── core/            # Core utilities (security, cache, websocket)
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   ├── workers/         # Celery tasks
│   ├── utils/           # Helper functions
│   ├── config.py        # Configuration
│   ├── database.py      # Database connection
│   └── main.py          # FastAPI application
├── alembic/             # Database migrations
├── tests/               # Test suite
├── requirements.txt     # Python dependencies
└── .env.example         # Environment variables template
```

## Setup

### Prerequisites

- Python 3.10+
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

### Installation

1. **Clone the repository**

   ```bash
   cd backend
   ```

2. **Create virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start services with Docker Compose**

   ```bash
   cd ..
   docker-compose up -d
   ```

6. **Run database migrations**

   ```bash
   cd backend
   alembic upgrade head
   ```

7. **Start the application**
   ```bash
   uvicorn app.main:app --reload
   ```

The API will be available at `http://localhost:8000`

## API Documentation

Once the application is running, visit:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## Running Celery Workers

```bash
# Start Celery worker
celery -A app.workers.celery_app worker --loglevel=info

# Start Celery beat (scheduled tasks)
celery -A app.workers.celery_app beat --loglevel=info

# Monitor with Flower
# Access at http://localhost:5555
```

## Docker Services

The `docker-compose.yml` includes:

- **PostgreSQL** (port 5432)
- **Redis** (port 6379)
- **MinIO** (ports 9000, 9001)
- **Elasticsearch** (ports 9200, 9300)
- **Flower** (port 5555)

## Environment Variables

Key environment variables (see `.env.example` for full list):

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/lost_found_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key
S3_ENDPOINT_URL=http://localhost:9000
ELASTICSEARCH_URL=http://localhost:9200
```

## Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app tests/
```

## Development

```bash
# Format code with black
black app/

# Lint with ruff
ruff check app/
```

## Production Deployment

1. Set `DEBUG=False` in `.env`
2. Use a strong `SECRET_KEY`
3. Configure production database
4. Set up proper CORS origins
5. Use a production ASGI server (Gunicorn + Uvicorn)
6. Set up SSL/TLS
7. Configure monitoring and logging

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.
