from fastapi import APIRouter
from pydantic import BaseModel
import httpx
from httpx import HTTPStatusError
from backend.supabase_config import SUPABASE_URL, DEFAULT_HEADERS
from urllib.parse import quote
import os
from backend.api_clients.eventbrite_search_by_city import search_events_by_city

router = APIRouter(prefix="/api/home", tags=["Home"])

class CityRequest(BaseModel):
  keyword: str
  
class eventRequest(BaseModel):
  city: str
  start_date: str
  end_date: str

def mask_key(key: str) -> str:
    if not key or len(key) < 8:
        return "****"
    return key[:4] + "****" + key[-4:]

masked_apikey = mask_key(DEFAULT_HEADERS["apikey"])

# check event data
# '*' in front of a parameter means it accepts any number of arguments
def get_nested_value(data, *keys, default=None):
  for key in keys:
    # isinstance checks if data is a dictionary
    if isinstance(data, dict) and key in data:
      data = data[key]
    else:
      return default
  return data

@router.post("/cities")
async def get_cities(value: CityRequest):

  # Validate the keyword
  keyword = value.keyword.strip()
  if not keyword or len(keyword) < 2:
    return { "error": "Please provide a keyword at least two characters long." }

  async with httpx.AsyncClient() as client:
    is_local = os.getenv("ENV") == "local"
    params={
      "name": f"ilike.{value.keyword}%",
      "limit": "20"
    }
    if is_local:
      # Encode the keyword for URL, since it contain % character
      keyword_encoded = quote(f"{value.keyword}%")
      params={
        "name": f"ilike.{keyword_encoded}",
        "limit": "20"
      }

    try:
      res = await client.get(
        f"{SUPABASE_URL}/rest/v1/cities",
        headers=DEFAULT_HEADERS,
        params=params
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

@router.post("/event/search")
async def search_events(value: eventRequest):
  data = search_events_by_city(value.city)
  final_data = []
  for event in data["events"]:
    event_info = {
      "id": get_nested_value(event, "id"),
      "img_url": get_nested_value(event,"image", "url"),
      "name": get_nested_value(event, "name"),
      "start_datetime": f"{get_nested_value(event, "start_date")} {get_nested_value(event, "start_time")}",
      "location": get_nested_value(event, "primary_venue", "address", "localized_area_display"),
      "min_ticket_price": f"{get_nested_value(event, "ticket_availability", "minimum_ticket_price", "currency")}{get_nested_value(event, "ticket_availability", "minimum_ticket_price", "major_value")}"
    }
    final_data.append(event_info)
  return {"events": final_data}
