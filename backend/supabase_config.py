from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_API_KEY = os.getenv("SUPABASE_API_KEY")

DEFAULT_HEADERS = {
  "apikey": SUPABASE_API_KEY,
  "Authorization": f"Bearer {SUPABASE_API_KEY}",
  "Content-Type": "application/json"
}