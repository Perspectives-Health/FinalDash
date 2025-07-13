from fastapi import APIRouter
from typing import List
from app.services.metrics_service import MetricsService
from app.models.response import UsersTodayResponse, DAUResponse, WeeklyUsersResponse

router = APIRouter()

@router.get("/users-today", response_model=UsersTodayResponse)
async def get_users_today():
    return await MetricsService.get_users_today()

@router.get("/dau", response_model=List[DAUResponse])
async def get_dau():
    return await MetricsService.get_dau()

@router.get("/weekly", response_model=List[WeeklyUsersResponse])
async def get_weekly_users():
    return await MetricsService.get_weekly_users()