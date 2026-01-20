import os
from dotenv import load_dotenv

load_dotenv() # read .env

ENV_MODE = os.getenv("ENV_MODE", "development")

if ENV_MODE == "production":
  FRONTEND_ORIGINS = ["https://travel-planner-liart-theta.vercel.app"]
else:
  FRONTEND_ORIGINS = ["http://localhost:5173"]