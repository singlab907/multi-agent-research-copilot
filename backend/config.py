import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

if not GEMINI_API_KEY:
    import warnings
    warnings.warn(
        "GEMINI_API_KEY is not set. Copy .env.example to .env and add your key.",
        stacklevel=2,
    )
