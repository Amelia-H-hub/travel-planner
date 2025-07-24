from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models

router = APIRouter(prefix="/api/home", tags=["Home"])

class CityRequest(BaseModel):
  keyword: str

def get_db():
  db = SessionLocal()
  try:
    yield db
  finally:
    db.close()

@router.get("/")
def hello():
  return {"message": "Hello from home router!"}

@router.post("/cities")
def get_cities(value: CityRequest, db: Session = Depends(get_db)):
  filtered_cities = db.query(models.City).filter(models.City.name.ilike(f"{value.keyword}%")).limit(20).all()
  return { "cities": [ { "city": city.name, "admin1_name": city.admin1_name, "country": city.country_name } for city in filtered_cities]}