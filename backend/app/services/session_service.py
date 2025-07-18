from typing import List
from app.database import get_db_pool
from app.models.response import SessionResponse, SessionsTodayByUserResponse

class SessionService:
    
    @staticmethod
    async def get_all_sessions() -> List[SessionResponse]:
        pool = await get_db_pool()
        query = """
SELECT
  s.id,
  u.user_id,
  u.email,
  TO_CHAR(
    s.created_at AT TIME ZONE 'America/Los_Angeles',
    'MM-DD'
  ) AS date,
  TO_CHAR(
    s.created_at AT TIME ZONE 'America/Los_Angeles',
    'HH12:MI AM'
  ) AS pacific_time
FROM users u
JOIN clinical_sessions s ON u.user_id = s.user_id
ORDER BY date DESC;
        """
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [
                SessionResponse(
                    id=str(row['id']),
                    user_id=str(row['user_id']),
                    email=row['email'],
                    date=row['date'],
                    pacific_time=row['pacific_time']
                )
                for row in rows
            ]
    
    @staticmethod
    async def get_sessions_today() -> List[SessionResponse]:
        pool = await get_db_pool()
        query = """
SELECT
  s.id,
  u.user_id,
  u.email,
  TO_CHAR(s.created_at AT TIME ZONE 'America/Los_Angeles', 'MM-DD') AS date,
  TO_CHAR(s.created_at AT TIME ZONE 'America/Los_Angeles', 'HH12:MI AM') AS pacific_time
FROM users u
JOIN clinical_sessions s ON u.user_id = s.user_id
WHERE DATE(s.created_at AT TIME ZONE 'America/Los_Angeles') = DATE(NOW() AT TIME ZONE 'America/Los_Angeles')
  AND NOT (
    LOWER(COALESCE(u.email, u.login_username, '')) ~ '(eshaan|eshan|kyle|jesse|nick|eric|will|shahzaib|smcho)'
  )
ORDER BY s.created_at DESC;
        """
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [
                SessionResponse(
                    id=str(row['id']),
                    user_id=str(row['user_id']),
                    email=row['email'],
                    date=row['date'],
                    pacific_time=row['pacific_time']
                )
                for row in rows
            ]
    
    @staticmethod
    async def get_sessions_today_by_user() -> List[SessionsTodayByUserResponse]:
        pool = await get_db_pool()
        query = """
WITH todays_sessions_pacific AS (
  SELECT
    s.id,
    u.user_id,
    u.email,
    s.created_at,
    s.created_at AT TIME ZONE 'America/Los_Angeles' AS pacific_timestamp,
    TO_CHAR(s.created_at AT TIME ZONE 'America/Los_Angeles', 'MM-DD') AS date,
    TO_CHAR(s.created_at AT TIME ZONE 'America/Los_Angeles', 'HH12:MI AM') AS pacific_time
  FROM users u
  JOIN clinical_sessions s ON u.user_id = s.user_id
  WHERE DATE(s.created_at AT TIME ZONE 'America/Los_Angeles') = DATE(NOW() AT TIME ZONE 'America/Los_Angeles')
    AND NOT (
      LOWER(COALESCE(u.email, u.login_username, '')) ~ '(eshaan|eshan|kyle|jesse|nick|eric|will|shahzaib|smcho)'
    )
)
SELECT
  user_id,
  email,
  COUNT(*) AS total_sessions,
  CASE 
    WHEN DATE(MAX(pacific_timestamp)) = DATE(NOW() AT TIME ZONE 'America/Los_Angeles') THEN
      TO_CHAR(MAX(pacific_timestamp), 'HH12:MI AM')
    ELSE
      TO_CHAR(MAX(pacific_timestamp), 'Mon DD, HH12:MI AM')
  END AS latest_pacific_time
FROM todays_sessions_pacific
GROUP BY user_id, email
ORDER BY email;
        """
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [
                SessionsTodayByUserResponse(
                    user_id=str(row['user_id']),
                    email=row['email'],
                    total_sessions=row['total_sessions'],
                    latest_pacific_time=row['latest_pacific_time']
                )
                for row in rows
            ]