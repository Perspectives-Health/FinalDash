from typing import List
from app.database import get_db_pool
from app.models.response import UsersTodayResponse, DAUResponse, WeeklyUsersResponse

class MetricsService:
    
    @staticmethod
    async def get_users_today() -> UsersTodayResponse:
        pool = await get_db_pool()
        query = """
WITH pacific_day_bounds AS (
  SELECT
    date_trunc('day', NOW() AT TIME ZONE 'America/Los_Angeles') AT TIME ZONE 'UTC' AS utc_day_start,
    (date_trunc('day', NOW() AT TIME ZONE 'America/Los_Angeles') + INTERVAL '1 day') AT TIME ZONE 'UTC' AS utc_day_end
)
SELECT
  TO_CHAR(NOW() AT TIME ZONE 'America/Los_Angeles', 'MM-DD') AS date,
  COUNT(DISTINCT u.user_id) AS unique_users,
  COUNT(DISTINCT s.id) AS unique_sessions
FROM pacific_day_bounds p
LEFT JOIN clinical_sessions s ON s.created_at >= p.utc_day_start AND s.created_at < p.utc_day_end
LEFT JOIN users u ON s.user_id = u.user_id
WHERE u.user_id IS NULL OR NOT (LOWER(COALESCE(u.email, u.login_username, '')) ~ '(eshaan|eshan|kyle|jesse|nick|eric|will|shahzaib|smcho)');
        """
        
        async with pool.acquire() as conn:
            row = await conn.fetchrow(query)
            if row:
                return UsersTodayResponse(
                    unique_users=row['unique_users'],
                    unique_sessions=row['unique_sessions'],
                    date=row['date']
                )
            else:
                # Fallback to today's date if query fails
                from datetime import datetime
                import pytz
                pst = pytz.timezone('America/Los_Angeles')
                today = datetime.now(pst).strftime('%m-%d')
                return UsersTodayResponse(
                    unique_users=0,
                    unique_sessions=0,
                    date=today
                )
    
    @staticmethod
    async def get_dau() -> List[DAUResponse]:
        pool = await get_db_pool()
        query = """
SELECT
  TO_CHAR(s.created_at AT TIME ZONE 'America/Los_Angeles', 'MM-DD') AS date,
  COUNT(DISTINCT u.user_id) AS unique_users,
  ARRAY_AGG(DISTINCT u.email) AS user_emails,
  COUNT(DISTINCT s.id) AS unique_sessions
FROM users u
JOIN clinical_sessions s ON u.user_id = s.user_id
WHERE NOT (
  LOWER(COALESCE(u.email, u.login_username, '')) ~ '(eshaan|eshan|kyle|jesse|nick|eric|will|shahzaib|smcho)'
)
GROUP BY date
ORDER BY date DESC;
        """
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [
                DAUResponse(
                    date=row['date'],
                    unique_users=row['unique_users'],
                    user_emails=row['user_emails'],
                    unique_sessions=row['unique_sessions']
                )
                for row in rows
            ]
    
    @staticmethod
    async def get_weekly_users() -> List[WeeklyUsersResponse]:
        pool = await get_db_pool()
        query = """
SELECT
  TO_CHAR(DATE_TRUNC('week', s.created_at AT TIME ZONE 'America/Los_Angeles'), 'YYYY-MM-DD') AS week_start,
  COUNT(DISTINCT u.user_id) AS unique_users,
  ARRAY_AGG(DISTINCT u.email) AS user_emails,
  COUNT(DISTINCT s.id) AS unique_sessions
FROM users u
JOIN clinical_sessions s ON u.user_id = s.user_id
WHERE NOT (
  LOWER(COALESCE(u.email, u.login_username, '')) ~ '(eshaan|eshan|kyle|jesse|nick|eric|will|shahzaib|smcho)'
)
GROUP BY week_start
ORDER BY week_start DESC;
        """
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [
                WeeklyUsersResponse(
                    week_start=row['week_start'],
                    unique_users=row['unique_users'],
                    user_emails=row['user_emails'],
                    unique_sessions=row['unique_sessions']
                )
                for row in rows
            ]