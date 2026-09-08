from fastapi import APIRouter, Query
from app.models.schemas import CurhatRequest, CurhatResponse
from app.services.ai_service import generate_curhat_reply
from app.core.database import get_db_connection

router = APIRouter(prefix="/chat", tags=["Curhat & Companion"])

@router.post("/curhat", response_model=CurhatResponse)
async def post_curhat(payload: CurhatRequest):
    return await generate_curhat_reply(payload.session_id, payload.message_content)

@router.get("/history")
def get_chat_history(session_id: str = Query("default-session"), limit: int = 50):
    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("""
            SELECT id, session_id, sender_role, message_body, created_at
            FROM chat_messages
            WHERE session_id = ?
            ORDER BY id ASC
            LIMIT ?
        """, (session_id, limit))
        rows = cursor.fetchall()
        
    return [
        {
            "id": row["id"],
            "session_id": row["session_id"],
            "role": row["sender_role"],
            "message": row["message_body"],
            "timestamp": row["created_at"]
        }
        for row in rows
    ]

@router.delete("/history")
def clear_chat_history(session_id: str = Query("default-session")):
    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
    return {"status": "cleared", "session_id": session_id}
