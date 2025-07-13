# FinalDash Backend API

FastAPI backend for the FinalDash clinical session tracking system.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables in `.env`:
```bash
PROD_DB_USER=postgres
PROD_DB_PASSWORD=your-super-secret-and-long-postgres-password
PROD_DB_PORT=5432
PROD_DB_HOST=165.227.120.106
PROD_DB_NAME=postgres
```

3. Run the server:
```bash
python run.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

## Endpoints

### Metrics
- `GET /metrics/users-today` - Today's unique users and sessions
- `GET /metrics/dau` - Daily active users over time
- `GET /metrics/weekly` - Weekly user metrics

### Users
- `GET /users/last-use` - Last usage timestamp for all users
- `GET /users/{user_id}/sessions` - Detailed session data for a user

### Sessions
- `GET /sessions` - All sessions
- `GET /sessions/today` - Today's sessions
- `GET /sessions/today/by-user` - Today's sessions grouped by user