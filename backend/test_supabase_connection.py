import httpx
import os

SUPABASE_URL = os.environ.get("SUPABASE_URL")  # 從環境變數讀
SUPABASE_API_KEY = os.environ.get("SUPABASE_API_KEY")

DEFAULT_HEADERS = {
    "apikey": SUPABASE_API_KEY,
    "Authorization": f"Bearer {SUPABASE_API_KEY}",
}

def main():
    try:
        print(f"🔍 測試連線到 {SUPABASE_URL} ...")
        res = httpx.get(f"{SUPABASE_URL}/rest/v1/", headers=DEFAULT_HEADERS, timeout=10.0)
        print(f"✅ 成功！狀態碼: {res.status_code}")
        print("📄 回應內容:", res.text[:200], "...")
    except Exception as e:
        print(f"❌ 連線失敗: {type(e).__name__} - {e}")

if __name__ == "__main__":
    main()
