from fastapi import APIRouter, Query
from typing import List
from app.services.user_service import UserService
from app.models.response import LastUseResponse, SessionDetailResponse, UserResponse, UserWithSessionAndCenterResponse

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
async def get_all_users():
    return await UserService.get_all_users()

@router.get("/last-use", response_model=List[LastUseResponse])
async def get_last_use():
    return await UserService.get_last_use()

@router.get("/{user_id}/sessions", response_model=List[SessionDetailResponse])
async def get_user_sessions(user_id: str):
    return await UserService.get_user_sessions(user_id)

@router.get("/with-session-and-center", response_model=List[UserWithSessionAndCenterResponse])
async def get_users_with_session_and_center(sort_by: str = Query("recent_session", description="Sort by 'recent_session' or 'center_name'")):
    return await UserService.get_users_with_session_and_center(sort_by)