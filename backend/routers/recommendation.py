from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
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

class ThemePredictInfo(BaseModel):
    age: int
    gender: str
    nationality: str
    babies: int
    children: int
    adults: int
    elders: int
    budget: str

class ClimateDetail(BaseModel):
    month: int
    temp: float

class MonthlyClimatePriceInfo(BaseModel):
    city: str
    country: str
    region: str
    short_description: str
    climate_calendar: Dict[str, List[ClimateDetail]]
    
class BookingStrategyInfo(BaseModel):
    arrival_date: str
    babies: int
    children: int
    adults: int
    elders: int
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

@router.post("/get_monthly_climate_price")
async def get_monthly_climate_price(rec_city: MonthlyClimatePriceInfo):
    try:
        chart_data = visualization_service.plot_monthly_climate_price(rec_city)
        
        return {
            "status": "success",
            "data": {
                "city_info": rec_city.city,
                "chart": chart_data
            }
        }
    
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Missing relative files")
    except Exception as e:
        raise e