from fastapi import APIRouter, Query, Request
from app.services.github_service import fetch_github_user_streak, record_incoming_webhook
from app.models.schemas import GitHubStreakResponse
from app.core.database import get_db_connection

router = APIRouter(prefix="/github", tags=["GitHub"])

@router.get("/streak", response_model=GitHubStreakResponse)
async def get_streak(username: str = Query(None)):
    target_username = username
    if not target_username:
        with get_db_connection() as connection:
            cursor = connection.cursor()
            cursor.execute("SELECT config_value FROM system_settings WHERE config_key = 'github_username'")
            row = cursor.fetchone()
            if row:
                target_username = row["config_value"]
                
    return await fetch_github_user_streak(target_username or "")

@router.post("/webhook")
async def github_webhook(request: Request):
    payload = await request.json()
    return record_incoming_webhook(payload)
