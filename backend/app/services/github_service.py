import subprocess
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
import httpx
from app.core.config import get_env_variable
from app.core.database import get_db_connection
from app.models.schemas import GitHubStreakResponse

GITHUB_API_URL = "https://api.github.com"

def resolve_github_token() -> str:
    env_token = get_env_variable("GITHUB_TOKEN")
    if env_token:
        return env_token

    with get_db_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("SELECT config_value FROM system_settings WHERE config_key = 'github_token'")
        row = cursor.fetchone()
        if row and row["config_value"]:
            return row["config_value"]

    try:
        token_output = subprocess.check_output(["gh", "auth", "token"], text=True, stderr=subprocess.DEVNULL).strip()
        if token_output.startswith("gh"):
            return token_output
    except Exception:
        pass

    return ""

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

    github_token = resolve_github_token()
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Personal-Companion-App"
    }
    if github_token:
        headers["Authorization"] = f"Bearer {github_token}"

    recent_commits: List[Dict[str, Any]] = []
    commit_dates: set[str] = set()

    # 1. Fetch exact contribution calendar via GraphQL if token is available
    if github_token:
        graphql_query = """
        query($login: String!) {
          user(login: $login) {
            contributionsCollection {
              contributionCalendar {
                weeks {
                  contributionDays {
                    contributionCount
                    date
                  }
                }
              }
            }
          }
        }
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                gql_res = await client.post(
                    f"{GITHUB_API_URL}/graphql",
                    json={"query": graphql_query, "variables": {"login": username}},
                    headers=headers
                )
                if gql_res.status_code == 200:
                    gql_data = gql_res.json()
                    user_data = gql_data.get("data", {}).get("user", {})
                    if user_data:
                        weeks = user_data.get("contributionsCollection", {}).get("contributionCalendar", {}).get("weeks", [])
                        for week in weeks:
                            for day in week.get("contributionDays", []):
                                if day.get("contributionCount", 0) > 0:
                                    commit_dates.add(day.get("date"))
        except Exception as gql_err:
            print(f"GraphQL fetch error: {gql_err}")

    # 2. Also fetch recent events for commit messages & repos
    events_endpoint = f"{GITHUB_API_URL}/users/{username}/events" if github_token else f"{GITHUB_API_URL}/users/{username}/events/public"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(events_endpoint, headers=headers)
            if response.status_code == 200:
                events = response.json()
                for event in events:
                    event_type = event.get("type")
                    created_timestamp = event.get("created_at", "")
                    date_str = created_timestamp[:10] if created_timestamp else ""
                    repo_name = event.get("repo", {}).get("name", "Repository")

                    if event_type == "PushEvent":
                        if date_str:
                            commit_dates.add(date_str)
                        commits_list = event.get("payload", {}).get("commits", [])
                        if commits_list:
                            for commit_item in commits_list:
                                recent_commits.append({
                                    "repo": repo_name,
                                    "message": commit_item.get("message", "Commit update"),
                                    "sha": commit_item.get("sha", "")[:7],
                                    "date": date_str
                                })
                                if len(recent_commits) >= 12:
                                    break
                        else:
                            head_sha = event.get("payload", {}).get("head", "")[:7] or "push"
                            recent_commits.append({
                                "repo": repo_name,
                                "message": f"Push update ke {repo_name}",
                                "sha": head_sha,
                                "date": date_str
                            })
                    elif event_type == "CreateEvent" and event.get("payload", {}).get("ref_type") in ("repository", "branch"):
                        if date_str:
                            commit_dates.add(date_str)
                        recent_commits.append({
                            "repo": repo_name,
                            "message": f"Inisialisasi & push {repo_name}",
                            "sha": "init",
                            "date": date_str
                        })

                    if len(recent_commits) >= 12:
                        break
    except Exception as connection_error:
        print(f"Events fetch error: {connection_error}")

    # 3. If recent_commits is still empty, fetch latest repo commits
    if not recent_commits and github_token:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                repo_res = await client.get(f"{GITHUB_API_URL}/users/{username}/repos?sort=updated&per_page=3", headers=headers)
                if repo_res.status_code == 200:
                    repos = repo_res.json()
                    for repo in repos:
                        repo_full = repo.get("full_name")
                        comm_res = await client.get(f"{GITHUB_API_URL}/repos/{repo_full}/commits?per_page=3", headers=headers)
                        if comm_res.status_code == 200:
                            comm_list = comm_res.json()
                            for c in comm_list:
                                c_date = c.get("commit", {}).get("author", {}).get("date", "")[:10]
                                if c_date:
                                    commit_dates.add(c_date)
                                recent_commits.append({
                                    "repo": repo_full,
                                    "message": c.get("commit", {}).get("message", "").split("\n")[0] or "Update",
                                    "sha": c.get("sha", "")[:7],
                                    "date": c_date
                                })
        except Exception:
            pass

    # Evaluation of Streak
    today_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_local = datetime.now().strftime("%Y-%m-%d")
    yesterday_local = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    
    committed_today = (today_utc in commit_dates) or (today_local in commit_dates)
    
    sorted_unique_dates = sorted(list(commit_dates), reverse=True)
    last_commit_date = sorted_unique_dates[0] if sorted_unique_dates else ""

    # Calculate streak count
    calculated_streak = 0
    reference_date = datetime.now().date()
    eval_date = reference_date if committed_today else (reference_date - timedelta(days=1))
    eval_ordinal = eval_date.toordinal()

    while True:
        date_str = datetime.fromordinal(eval_ordinal).strftime("%Y-%m-%d")
        if date_str in commit_dates:
            calculated_streak += 1
            eval_ordinal -= 1
        else:
            break

    # If user committed yesterday and hasn't committed today, their streak is still alive!
    if not committed_today and yesterday_local in commit_dates and calculated_streak == 0:
        calculated_streak = 1
    if committed_today and calculated_streak == 0:
        calculated_streak = 1

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
        reminder_message = f"Streak menyala! Kamu sudah commit hari ini ({last_commit_date}). Streak {calculated_streak} hari aktif terjaga! 🔥"
    elif calculated_streak > 0:
        reminder_message = f"Streak {calculated_streak} harimu kemarin aman! Hari ini belum ada commit. Kirim satu commit hari ini sebelum jam 23:59 agar streak berlanjut menjadi {calculated_streak + 1} hari! ⏳"
    else:
        reminder_message = "Belum ada commit aktif hari ini. Yuk kirim minimal satu commit untuk menyalakan streak baru! 🚀"

    return GitHubStreakResponse(
        username=username,
        committed_today=committed_today,
        current_streak=calculated_streak,
        longest_streak=longest_streak,
        last_commit_date=last_commit_date,
        recent_commits=recent_commits[:10],
        reminder_message=reminder_message
    )

def record_incoming_webhook(payload: Dict[str, Any]) -> Dict[str, Any]:
    sender_name = payload.get("sender", {}).get("login", "Unknown")
    repository_name = payload.get("repository", {}).get("full_name", "Unknown Repo")
    commits_batch = payload.get("commits", [])
    commit_count = len(commits_batch)
    
    today_str = datetime.now().strftime("%Y-%m-%d")
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
