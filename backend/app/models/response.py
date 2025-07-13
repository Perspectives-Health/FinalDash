from pydantic import BaseModel
from typing import List, Any, Optional
from datetime import datetime

class UsersTodayResponse(BaseModel):
    unique_users: int
    unique_sessions: int
    date: str

class LastUseResponse(BaseModel):
    email: str
    id: str
    last_use_pacific: str

class DAUResponse(BaseModel):
    date: str
    unique_users: int
    user_emails: List[str]
    unique_sessions: int

class WeeklyUsersResponse(BaseModel):
    week_start: str
    unique_users: int
    user_emails: List[str]
    unique_sessions: int

class SessionsTodayByUserResponse(BaseModel):
    user_id: str
    email: str
    total_sessions: int
    latest_pacific_time: str

class SessionResponse(BaseModel):
    id: str
    user_id: str
    email: str
    date: str
    pacific_time: str

class UserResponse(BaseModel):
    email: str
    user_id: str

class SessionDetailResponse(BaseModel):
    patient_name: str
    created_at: str
    session_type: str
    session_status: str
    workflow_status: str
    session_id: str
    workflow_id: str
    workflow_name: str
    patient_id: str
    json_to_populate: Any
    diarized_transcription: Any
    audio_link: Optional[str]

class UserWithSessionAndCenterResponse(BaseModel):
    user_id: str
    email: str
    center_name: Optional[str]
    last_session_time: Optional[datetime]