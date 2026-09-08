import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

DATABASE_PATH = BASE_DIR / "companion.db"
DEFAULT_OPENAI_MODEL = "gpt-4o-mini"

def get_env_variable(key_name: str, fallback_value: str = "") -> str:
    return os.getenv(key_name, fallback_value)

def update_env_variable(key_name: str, value_to_store: str) -> None:
    os.environ[key_name] = value_to_store
    lines = []
    found = False
    
    if ENV_PATH.exists():
        with open(ENV_PATH, "r", encoding="utf-8") as env_file:
            for line in env_file:
                if line.startswith(f"{key_name}="):
                    lines.append(f"{key_name}={value_to_store}\n")
                    found = True
                else:
                    lines.append(line)
                    
    if not found:
        lines.append(f"{key_name}={value_to_store}\n")
        
    with open(ENV_PATH, "w", encoding="utf-8") as env_file:
        env_file.writelines(lines)
