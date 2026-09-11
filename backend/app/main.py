from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.core.database import initialize_database, get_db_connection
from app.api.github import router as github_router
from app.api.finance import router as finance_router
from app.api.chat import router as chat_router
from app.api.settings import router as settings_router
from app.api.homework import router as homework_router
from app.api.voice import router as voice_router
from app.services.github_service import fetch_github_user_streak

scheduler = AsyncIOScheduler()

async def scheduled_streak_checker():
    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("SELECT config_value FROM system_settings WHERE config_key = 'github_username'")
        row = cursor.fetchone()
        if row and row["config_value"]:
            await fetch_github_user_streak(row["config_value"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    scheduler.add_job(scheduled_streak_checker, "interval", minutes=30)
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)

app = FastAPI(
    title="Personal AI Companion API",
    description="Backend for GitHub Streak, Financial Management, and Emotional Companion",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(github_router, prefix="/api")
app.include_router(finance_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(homework_router, prefix="/api")
app.include_router(voice_router, prefix="/api")

@app.get("/api/health")
def check_health():
    return {"status": "ok", "service": "Personal AI Companion"}
