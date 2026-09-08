from typing import List
from app.core.database import get_db_connection
from app.models.schemas import (
    TransactionCreate,
    TransactionResponse,
    FinanceSummaryResponse,
    CategoryBreakdown
)

def create_transaction(transaction: TransactionCreate) -> TransactionResponse:
    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("""
            INSERT INTO transactions (entry_type, amount, category, note)
            VALUES (?, ?, ?, ?)
        """, (transaction.entry_type, transaction.amount, transaction.category, transaction.note or ""))
        created_id = cursor.lastrowid
        
        cursor.execute("SELECT id, entry_type, amount, category, note, created_at FROM transactions WHERE id = ?", (created_id,))
        row = cursor.fetchone()
        
    return TransactionResponse(
        id=row["id"],
        entry_type=row["entry_type"],
        amount=row["amount"],
        category=row["category"],
        note=row["note"],
        created_at=row["created_at"]
    )

def get_finance_summary() -> FinanceSummaryResponse:
    with get_db_connection() as connection:
        cursor = connection.cursor()
        
        cursor.execute("""
            SELECT 
                COALESCE(SUM(CASE WHEN entry_type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN entry_type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
            FROM transactions
        """)
        totals_row = cursor.fetchone()
        total_income = float(totals_row["total_income"])
        total_expense = float(totals_row["total_expense"])
        net_balance = total_income - total_expense
        
        cursor.execute("""
            SELECT category, SUM(amount) as category_sum
            FROM transactions
            WHERE entry_type = 'expense'
            GROUP BY category
            ORDER BY category_sum DESC
        """)
        category_rows = cursor.fetchall()
        
        distribution: List[CategoryBreakdown] = []
        for cat_row in category_rows:
            category_sum = float(cat_row["category_sum"])
            percentage = round((category_sum / total_expense * 100), 1) if total_expense > 0 else 0
            distribution.append(CategoryBreakdown(
                category=cat_row["category"],
                total_spent=category_sum,
                percentage=percentage
            ))
            
        cursor.execute("""
            SELECT id, entry_type, amount, category, note, created_at
            FROM transactions
            ORDER BY id DESC
            LIMIT 20
        """)
        recent_rows = cursor.fetchall()
        recent_transactions = [
            TransactionResponse(
                id=item["id"],
                entry_type=item["entry_type"],
                amount=item["amount"],
                category=item["category"],
                note=item["note"],
                created_at=item["created_at"]
            )
            for item in recent_rows
        ]

    return FinanceSummaryResponse(
        total_income=total_income,
        total_expense=total_expense,
        net_balance=net_balance,
        category_distribution=distribution,
        recent_transactions=recent_transactions
    )

def remove_transaction(transaction_id: int) -> bool:
    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
        return cursor.rowcount > 0
