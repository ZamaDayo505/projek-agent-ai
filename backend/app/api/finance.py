from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.schemas import (
    TransactionCreate,
    TransactionResponse,
    FinanceSummaryResponse,
    SmartExpenseParseResponse
)
from app.services.finance_service import (
    create_transaction,
    get_finance_summary,
    remove_transaction
)
from app.services.ai_service import parse_expense_from_text

router = APIRouter(prefix="/finance", tags=["Finance"])

class RawTextParseRequest(BaseModel):
    raw_statement: str

@router.get("/summary", response_model=FinanceSummaryResponse)
def get_summary():
    return get_finance_summary()

@router.post("/transaction", response_model=TransactionResponse)
def add_transaction(transaction: TransactionCreate):
    return create_transaction(transaction)

@router.post("/batch", response_model=List[TransactionResponse])
def add_batch_transactions(transactions: List[TransactionCreate]):
    created_items = [create_transaction(item) for item in transactions]
    return created_items

@router.post("/parse", response_model=SmartExpenseParseResponse)
async def parse_natural_expense(payload: RawTextParseRequest):
    return await parse_expense_from_text(payload.raw_statement)

@router.delete("/transaction/{transaction_id}")
def delete_transaction(transaction_id: int):
    success = remove_transaction(transaction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan")
    return {"status": "deleted", "id": transaction_id}
