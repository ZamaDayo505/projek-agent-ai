from typing import List, Optional
from pydantic import BaseModel, Field

class TransactionCreate(BaseModel):
    entry_type: str = Field(..., description="'expense' or 'income'")
    amount: float = Field(..., gt=0)
    category: str
    note: Optional[str] = ""

class TransactionResponse(BaseModel):
    id: int
    entry_type: str
    amount: float
    category: str
    note: str
    created_at: str

class CategoryBreakdown(BaseModel):
    category: str
    total_spent: float
    percentage: float

class FinanceSummaryResponse(BaseModel):
    total_income: float
    total_expense: float
    net_balance: float
    category_distribution: List[CategoryBreakdown]
    recent_transactions: List[TransactionResponse]

class CurhatRequest(BaseModel):
    session_id: str = "default-session"
    message_content: str

class CurhatResponse(BaseModel):
    reply_content: str
    sentiment_tag: str
    suggested_action: Optional[str] = None

class ParsedExpenseItem(BaseModel):
    entry_type: str = "expense"
    amount: float
    category: str
    note: str

class SmartExpenseParseResponse(BaseModel):
    extracted_items: List[ParsedExpenseItem]
    detected_summary: str

class GitHubStreakResponse(BaseModel):
    username: str
    committed_today: bool
    current_streak: int
    longest_streak: int
    last_commit_date: str
    recent_commits: List[dict]
    reminder_message: str

class SettingsUpdateRequest(BaseModel):
    openai_api_key: Optional[str] = None
    github_username: Optional[str] = None
    reminder_hour: Optional[int] = None

class SettingsResponse(BaseModel):
    has_openai_key: bool
    github_username: str
    reminder_hour: int
