from fastapi import APIRouter, Depends
from pydantic import BaseModel
import httpx
from httpx import HTTPStatusError
from backend.supabase_config import SUPABASE_URL, DEFAULT_HEADERS
from urllib.parse import quote

router = APIRouter(prefix="/api/home", tags=["Home"])

class CityRequest(BaseModel):
  keyword: str

def mask_key(key: str) -> str:
    if not key or len(key) < 8:
        return "****"
    return key[:4] + "****" + key[-4:]

masked_apikey = mask_key(DEFAULT_HEADERS["apikey"])

@router.post("/cities")
async def get_cities(value: CityRequest):
  print(f"SUPABASE_URL: {SUPABASE_URL}")
  print(f"DEFAULT_HEADERS: {{'apikey': '{masked_apikey}', 'Authorization': 'Bearer {masked_apikey}', 'Content-Type': 'application/json'}}")

  # Validate the keyword
  keyword = value.keyword.strip()
  if not keyword or len(keyword) < 2:
    return { "error": "Please provide a keyword at least two characters long." }

  async with httpx.AsyncClient() as client:
    # Encode the keyword for URL, since it contain % character
    keyword_encoded = quote(f"%{value.keyword}%")

    params={
      "name": f"ilike.{keyword_encoded}",
      "limit": "20"
    }
    print(f"Requesting cities with params: {params}")

    try:
      res = await client.get(
        f"{SUPABASE_URL}/rest/v1/cities",
        headers=DEFAULT_HEADERS,
        params={
          "name": f"ilike.{keyword_encoded}",
          "limit": "20"
        }
      )

      # Throw a HTTPStatusError if the response status >= 400
      res.raise_for_status()

      return { 
        "cities": [
          { 
            "city": city["name"],
            "admin1_name": city["admin1_name"],
            "country": city["country_name"]
          }
          for city in res.json()
        ]
      }
    
    except HTTPStatusError as e:
      print(f"HTTP error occurred: {e}")
      return { "error": f"Error fetching cities: {e.response.text}" }
    
    except Exception as e:
      print(f"Other error occurred: {e}")
      return { "error": "Unexpected error occurred." }
