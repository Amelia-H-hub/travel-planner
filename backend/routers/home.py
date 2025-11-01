from fastapi import APIRouter
from pydantic import BaseModel
import boto3
from boto3.dynamodb.conditions import Key

router = APIRouter(prefix="/api/home", tags=["Home"])

class CityRequest(BaseModel):
  keyword: str
  
class eventRequest(BaseModel):
  city: str
  start_date: str
  end_date: str

@router.post("/cities")
async def get_cities(value: CityRequest):
  # Validate the keyword
  keyword = value.keyword.strip().lower()
  if not keyword or len(keyword) < 2:
    return { "error": "Please provide a keyword at least two characters long." }
  
  dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
  table = dynamodb.Table("cities")
  
  try:
    short_keyword = keyword[:2]
    print(f"Querying DynamoDB for cities starting with: {keyword}")
    response = table.query(
      IndexName="search_name_short-search_name-index",
      KeyConditionExpression=Key("search_name_short").eq(short_keyword) & Key("search_name").begins_with(keyword)
    )
    return {
      "cities": [
        {
          "id": city["id"],
          "name": city["name"],
          "country_name": city["country_name"]
        }
        for city in response["Items"]
      ]
    }
    
  except Exception as e:
    print(f"Error querying DynamoDB: {e}")
    return { "error": "Error fetching cities from database." }
