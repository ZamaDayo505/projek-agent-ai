from fastapi import APIRouter
from app.models.schemas import SettingsUpdateRequest, SettingsResponse
from app.core.config import get_env_variable, update_env_variable
from app.core.database import get_db_connection

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=SettingsResponse)
def read_system_settings():
    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("SELECT config_key, config_value FROM system_settings")
        settings_map = {row["config_key"]: row["config_value"] for row in cursor.fetchall()}

    env_openai_key = get_env_variable("OPENAI_API_KEY")
    db_openai_key = settings_map.get("openai_api_key", "")
    has_key = bool(env_openai_key or db_openai_key)
    
    github_user = settings_map.get("github_username", get_env_variable("GITHUB_USERNAME", ""))
    reminder_hr = int(settings_map.get("reminder_hour", 20))

    return SettingsResponse(
        has_openai_key=has_key,
        github_username=github_user,
        reminder_hour=reminder_hr
    )

@router.post("", response_model=SettingsResponse)
def save_system_settings(payload: SettingsUpdateRequest):
    with get_db_connection() as connection:
        cursor = connection.cursor()
        
        if payload.openai_api_key is not None and payload.openai_api_key.strip():
            clean_key = payload.openai_api_key.strip()
            update_env_variable("OPENAI_API_KEY", clean_key)
            cursor.execute("""
                INSERT INTO system_settings (config_key, config_value)
                VALUES ('openai_api_key', ?)
                ON CONFLICT(config_key) DO UPDATE SET config_value = excluded.config_value
            """, (clean_key,))
            
        if payload.github_username is not None:
            clean_username = payload.github_username.strip()
            update_env_variable("GITHUB_USERNAME", clean_username)
            cursor.execute("""
                INSERT INTO system_settings (config_key, config_value)
                VALUES ('github_username', ?)
                ON CONFLICT(config_key) DO UPDATE SET config_value = excluded.config_value
            """, (clean_username,))
            
        if payload.reminder_hour is not None:
            cursor.execute("""
                INSERT INTO system_settings (config_key, config_value)
                VALUES ('reminder_hour', ?)
                ON CONFLICT(config_key) DO UPDATE SET config_value = excluded.config_value
            """, (str(payload.reminder_hour),))

    return read_system_settings()
