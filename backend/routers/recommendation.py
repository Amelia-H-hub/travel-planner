from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict
from ml_logic.services.theme_city_service import ThemeCityService
from ml_logic.services.booking_service import BookingService, VisualService
from backend.utils.response_helper import success_response, error_response

router = APIRouter(
    prefix="/api/recommendation",
    tags=["Recommendation"]
)

theme_city_service = ThemeCityService()
booking_service = BookingService()
visualization_service = VisualService()

class Companion(BaseModel):
    babies: int = Field(0, ge=0)
    children: int = Field(0, ge=0)
    adults: int = Field(0, ge=0)
    seniors: int = Field(0, ge=0)
class ThemePredictInfo(BaseModel):
    age: int
    gender: str
    nationality: str
    region: str
    companion: Companion
    budget: str

class ClimateDetail(BaseModel):
    month: int
    temp: float

class MonthlyClimatePriceInfo(BaseModel):
    country: str
    climate_calendar: Dict[str, List[ClimateDetail]]
    
class BookingStrategyInfo(BaseModel):
    hotel: str
    arrival_date: str
    leave_date: str
    is_flexible_year: bool
    companion: Companion
    country_name: str
  
@router.post("/cities")
async def get_cities(user_input: ThemePredictInfo):
    try:
        input_data = user_input.model_dump()
        result = theme_city_service.get_complete_recommendations(input_data)
        
        return success_response(
            "Get City Recommendation successfully!",
            result
        )
    
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Missing models")
    except Exception as e:
        raise e

@router.post("/booking")
async def get_booking_strategy(user_input: BookingStrategyInfo):
    try:
        input_data = user_input.model_dump()
        result = booking_service.get_hotel_booking_strategy(input_data)
        
        return success_response(
            "Get Hotel Booking Strategy successfully!",
            result
        )
    
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Missing models")
    except Exception as e:
        raise e