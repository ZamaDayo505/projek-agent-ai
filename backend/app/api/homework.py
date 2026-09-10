from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.homework_service import (
    create_homework_task,
    fetch_all_homework_tasks,
    toggle_homework_task_status,
    remove_homework_task
)

router = APIRouter(prefix="/homework", tags=["Homework Tasks"])

class HomeworkCreatePayload(BaseModel):
    title: str = Field(..., min_length=1)
    subject: str = Field(..., min_length=1)
    deadline: str = Field(..., min_length=1)
    notes: Optional[str] = ""

@router.get("")
def get_homework_list():
    return fetch_all_homework_tasks()

@router.post("")
def add_homework_item(payload: HomeworkCreatePayload):
    return create_homework_task(
        title=payload.title,
        subject=payload.subject,
        deadline=payload.deadline,
        notes=payload.notes or ""
    )

@router.patch("/{task_id}/toggle")
def toggle_homework_item(task_id: int):
    result = toggle_homework_task_status(task_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail="PR tidak ditemukan")
    return result

@router.delete("/{task_id}")
def delete_homework_item(task_id: int):
    deleted = remove_homework_task(task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="PR tidak ditemukan")
    return {"status": "deleted", "id": task_id}
