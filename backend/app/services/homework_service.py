from typing import List, Dict, Any
from app.core.database import get_db_connection

def create_homework_task(title: str, subject: str, deadline: str, notes: str = "") -> Dict[str, Any]:
    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("""
            INSERT INTO homework_tasks (title, subject, deadline, notes, is_completed)
            VALUES (?, ?, ?, ?, 0)
        """, (title.strip(), subject.strip(), deadline.strip(), notes.strip()))
        new_id = cursor.lastrowid
        cursor.execute("""
            SELECT id, title, subject, deadline, notes, is_completed, created_at
            FROM homework_tasks WHERE id = ?
        """, (new_id,))
        row = cursor.fetchone()
        
    return {
        "id": row["id"],
        "title": row["title"],
        "subject": row["subject"],
        "deadline": row["deadline"],
        "notes": row["notes"],
        "is_completed": bool(row["is_completed"]),
        "created_at": row["created_at"]
    }

def fetch_all_homework_tasks() -> List[Dict[str, Any]]:
    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("""
            SELECT id, title, subject, deadline, notes, is_completed, created_at
            FROM homework_tasks
            ORDER BY is_completed ASC, deadline ASC, id DESC
        """)
        rows = cursor.fetchall()
        
    return [
        {
            "id": row["id"],
            "title": row["title"],
            "subject": row["subject"],
            "deadline": row["deadline"],
            "notes": row["notes"],
            "is_completed": bool(row["is_completed"]),
            "created_at": row["created_at"]
        }
        for row in rows
    ]

def toggle_homework_task_status(task_id: int) -> Dict[str, Any]:
    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("SELECT is_completed FROM homework_tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        if not row:
            return {"error": "Task not found"}
            
        new_status = 0 if row["is_completed"] else 1
        cursor.execute("UPDATE homework_tasks SET is_completed = ? WHERE id = ?", (new_status, task_id))
        
        cursor.execute("SELECT id, title, subject, deadline, notes, is_completed, created_at FROM homework_tasks WHERE id = ?", (task_id,))
        updated_row = cursor.fetchone()
        
    return {
        "id": updated_row["id"],
        "title": updated_row["title"],
        "subject": updated_row["subject"],
        "deadline": updated_row["deadline"],
        "notes": updated_row["notes"],
        "is_completed": bool(updated_row["is_completed"]),
        "created_at": updated_row["created_at"]
    }

def remove_homework_task(task_id: int) -> bool:
    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM homework_tasks WHERE id = ?", (task_id,))
        return cursor.rowcount > 0
