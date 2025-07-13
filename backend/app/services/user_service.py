from typing import List
from app.database import get_db_pool
from app.models.response import LastUseResponse, SessionDetailResponse, UserResponse, UserWithSessionAndCenterResponse

class UserService:
    
    @staticmethod
    async def get_all_users() -> List[UserResponse]:
        pool = await get_db_pool()
        query = """
        SELECT email, user_id
        FROM users
        WHERE NOT (
            LOWER(COALESCE(email, login_username, '')) ~ '(eshaan|eshan|kyle|jesse|nick|eric|will|shahzaib|smcho)'
        )
        ORDER BY email
        """
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [
                UserResponse(
                    email=row['email'],
                    user_id=row['user_id']
                )
                for row in rows
            ]
    
    @staticmethod
    async def get_last_use() -> List[LastUseResponse]:
        pool = await get_db_pool()
        query = """
WITH pacific_now AS (
  SELECT NOW() AT TIME ZONE 'America/Los_Angeles' AS now_pacific
),
last_sessions AS (
  SELECT
    u.user_id,
    u.email,
    u.id,
    MAX(s.created_at AT TIME ZONE 'America/Los_Angeles') AS last_pacific_time
  FROM users u
  JOIN clinical_sessions s ON u.user_id = s.user_id
  WHERE NOT (
    LOWER(COALESCE(u.email, u.login_username, '')) ~ '(eshaan|eshan|kyle|jesse|nick|eric|will|shahzaib|smcho)'
  )
  GROUP BY u.user_id, u.email, u.id
),
two_days_ago AS (
  SELECT (now_pacific - INTERVAL '36 hours') AS threshold_pacific FROM pacific_now
)
SELECT
  l.email,
  l.id,
  TO_CHAR(l.last_pacific_time, 'YYYY-MM-DD HH12:MI AM') AS last_use_pacific
FROM last_sessions l, two_days_ago t
WHERE l.last_pacific_time < t.threshold_pacific
ORDER BY l.last_pacific_time DESC;
        """
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [
                LastUseResponse(
                    email=row['email'],
                    id=str(row['id']),
                    last_use_pacific=row['last_use_pacific']
                )
                for row in rows
            ]
    
    @staticmethod
    async def get_user_sessions(user_id: str) -> List[SessionDetailResponse]:
        pool = await get_db_pool()
        query = """
SELECT
  p.patient_name,
  cs.created_at,
  cs.display_name AS session_type,
  cs.status AS session_status,
  wi.status AS workflow_status,
  cs.id AS session_id,
  wi.workflow_id AS workflow_id,
  w.workflow_name,
  p.id AS patient_id,
  wi.data,
  c.extracted_info,
  c.s3_link
FROM
  clinical_sessions AS cs
JOIN
  patients AS p
  ON cs.patient_id = p.id
JOIN
  workflow_instances AS wi
  ON cs.id = wi.session_id
JOIN
  workflows AS w
  ON wi.workflow_id = w.workflow_id
LEFT JOIN
  conversations AS c
  ON wi.workflow_id = c.workflow_id AND cs.id = c.session_id
WHERE
  cs.user_id = $1
ORDER BY
  cs.created_at DESC,
  wi.created_at;
        """
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, user_id)
            return [
                SessionDetailResponse(
                    patient_name=row['patient_name'],
                    created_at=row['created_at'].isoformat() if row['created_at'] else '',
                    session_type=row['session_type'],
                    session_status=row['session_status'],
                    workflow_status=row['workflow_status'],
                    session_id=str(row['session_id']),
                    workflow_id=str(row['workflow_id']),
                    workflow_name=row['workflow_name'],
                    patient_id=str(row['patient_id']),
                    json_to_populate=row['data'],
                    diarized_transcription=row['extracted_info'],
                    audio_link=row['s3_link']
                )
                for row in rows
            ]
    
    @staticmethod
    async def get_users_with_session_and_center(sort_by: str = "recent_session") -> List[UserWithSessionAndCenterResponse]:
        pool = await get_db_pool()
        
        if sort_by == "center_name":
            order_clause = "ORDER BY c.center_name ASC, u.email ASC"
        else:
            order_clause = "ORDER BY last_session_time DESC NULLS LAST, u.email ASC"
        
        query = f"""
        SELECT DISTINCT
            u.user_id,
            u.email,
            c.center_name,
            MAX(cs.updated_at) as last_session_time
        FROM users u
        LEFT JOIN centers c ON u.center_id = c.center_id
        LEFT JOIN clinical_sessions cs ON u.user_id = cs.user_id
        WHERE NOT (
            LOWER(COALESCE(u.email, u.login_username, '')) ~ '(eshaan|eshan|kyle|jesse|nick|eric|will|shahzaib|smcho)'
        )
        GROUP BY u.user_id, u.email, c.center_name
        {order_clause}
        """
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [
                UserWithSessionAndCenterResponse(
                    user_id=row['user_id'],
                    email=row['email'],
                    center_name=row['center_name'],
                    last_session_time=row['last_session_time']
                )
                for row in rows
            ]