from fastapi import APIRouter
from typing import List
from app.services.session_service import SessionService
from app.models.response import SessionResponse, SessionsTodayByUserResponse

router = APIRouter()

@router.get("/", response_model=List[SessionResponse])
async def get_all_sessions():
    return await SessionService.get_all_sessions()

@router.get("/today", response_model=List[SessionResponse])
async def get_sessions_today():
    return await SessionService.get_sessions_today()

@router.get("/today/by-user", response_model=List[SessionsTodayByUserResponse])
async def get_sessions_today_by_user():
    return await SessionService.get_sessions_today_by_user()