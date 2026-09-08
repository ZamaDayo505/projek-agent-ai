from datetime import datetime, timezone
from typing import Dict, Any, List
import httpx
from app.core.database import get_db_connection
from app.models.schemas import GitHubStreakResponse

GITHUB_API_URL = "https://api.github.com"

async def fetch_github_user_streak(username: str) -> GitHubStreakResponse:
    if not username:
        return GitHubStreakResponse(
            username="",
            committed_today=False,
            current_streak=0,
            longest_streak=0,
            last_commit_date="",
            recent_commits=[],
            reminder_message="Silakan atur GitHub username di Pengaturan terlebih dahulu."
        )

    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Personal-Companion-App"
    }

    recent_commits: List[Dict[str, Any]] = []
    commit_dates: set[str] = set()

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{GITHUB_API_URL}/users/{username}/events/public",
                headers=headers
            )
            
            if response.status_code == 200:
                events = response.json()
                for event in events:
                    if event.get("type") == "PushEvent":
                        created_timestamp = event.get("created_at")
                        date_str = created_timestamp[:10] if created_timestamp else ""
                        if date_str:
                            commit_dates.add(date_str)
                            
                        repo_name = event.get("repo", {}).get("name", "Unknown Repo")
                        commits_list = event.get("payload", {}).get("commits", [])
                        for commit_item in commits_list:
                            recent_commits.append({
                                "repo": repo_name,
                                "message": commit_item.get("message", "Commit update"),
                                "sha": commit_item.get("sha", "")[:7],
                                "date": date_str
                            })
                            if len(recent_commits) >= 10:
                                break
                    if len(recent_commits) >= 10:
                        break
            elif response.status_code == 404:
                return GitHubStreakResponse(
                    username=username,
                    committed_today=False,
                    current_streak=0,
                    longest_streak=0,
                    last_commit_date="",
                    recent_commits=[],
                    reminder_message=f"Username '{username}' tidak ditemukan di GitHub."
                )
    except Exception as connection_error:
        pass

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    sorted_unique_dates = sorted(list(commit_dates), reverse=True)
    
    committed_today = today_str in commit_dates
    last_commit_date = sorted_unique_dates[0] if sorted_unique_dates else ""
    
    calculated_streak = 0
    reference_date = datetime.now(timezone.utc).date()
    
    # Check streak backwards
    check_date = reference_date if committed_today else (reference_date - datetime.resolution)
    
    current_eval_date = reference_date if committed_today else None
    if not committed_today:
        yesterday_str = (reference_date.fromordinal(reference_date.toordinal() - 1)).strftime("%Y-%m-%d")
        if yesterday_str in commit_dates:
            current_eval_date = reference_date.fromordinal(reference_date.toordinal() - 1)
            
    if current_eval_date:
        eval_ordinal = current_eval_date.toordinal()
        while True:
            date_key = datetime.fromordinal(eval_ordinal).strftime("%Y-%m-%d")
            if date_key in commit_dates:
                calculated_streak += 1
                eval_ordinal -= 1
            else:
                break

    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("SELECT longest_streak FROM github_streaks WHERE username = ?", (username,))
        row = cursor.fetchone()
        saved_longest = row["longest_streak"] if row else 0
        longest_streak = max(saved_longest, calculated_streak)
        
        cursor.execute("""
            INSERT INTO github_streaks (username, current_streak, longest_streak, last_commit_date, committed_today, last_checked_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(username) DO UPDATE SET
                current_streak = excluded.current_streak,
                longest_streak = excluded.longest_streak,
                last_commit_date = excluded.last_commit_date,
                committed_today = excluded.committed_today,
                last_checked_at = CURRENT_TIMESTAMP
        """, (username, calculated_streak, longest_streak, last_commit_date, 1 if committed_today else 0))

    if committed_today:
        reminder_message = f"Luar biasa! Kamu sudah commit hari ini. Streak {calculated_streak} hari tetap menyala! 🔥"
    elif calculated_streak > 0:
        reminder_message = f"Peringatan streak! Kamu belum commit hari ini. Jaga streak {calculated_streak} harimu sebelum tengah malam! ⏳"
    else:
        reminder_message = "Hari ini belum ada commit. Yuk kirim minimal satu commit untuk memulai streak baru! 🚀"

    return GitHubStreakResponse(
        username=username,
        committed_today=committed_today,
        current_streak=calculated_streak,
        longest_streak=longest_streak,
        last_commit_date=last_commit_date,
        recent_commits=recent_commits,
        reminder_message=reminder_message
    )

def record_incoming_webhook(payload: Dict[str, Any]) -> Dict[str, Any]:
    sender_name = payload.get("sender", {}).get("login", "Unknown")
    repository_name = payload.get("repository", {}).get("full_name", "Unknown Repo")
    commits_batch = payload.get("commits", [])
    commit_count = len(commits_batch)
    
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("""
            UPDATE github_streaks
            SET committed_today = 1,
                last_commit_date = ?,
                last_checked_at = CURRENT_TIMESTAMP
            WHERE username = ?
        """, (today_str, sender_name))
        
    return {
        "status": "success",
        "sender": sender_name,
        "repository": repository_name,
        "commits_received": commit_count
    }
