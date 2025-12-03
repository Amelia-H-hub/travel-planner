import os
from dotenv import load_dotenv

load_dotenv() # read .env

ENV = os.getenv("ENV", "development")

if ENV == "production":
  FRONTEND_ORIGINS = ["https://travel-planner-liart-theta.vercel.app"]
else:
  FRONTEND_ORIGINS = ["http://localhost:5173"]