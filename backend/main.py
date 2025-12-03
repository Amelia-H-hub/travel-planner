import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
import secrets
from backend.config import FRONTEND_ORIGINS
from backend.utils.response_helper import error_response
from backend.routers import home
from backend.routers import schedule
from backend.routers import auth
from mangum import Mangum

load_dotenv()

secret_key = os.getenv("SECRET_KEY")
if not secret_key:
  secret_key = secrets.token_hex(32)
  print(f"Generated SECRET_KEY: {secret_key}")

app = FastAPI(
  docs_url="/docs", # Set docs_url to /docs for compatibility with AWS Lambda proxy integration
  redoc_url="/redoc", # Set redoc_url to /redoc for compatibility with AWS Lambda proxy integration
  root_path="/dev" # Set root_path to /dev for compatibility with AWS Lambda proxy integration
)  

# Allow frontend request from different network
app.add_middleware(
  CORSMiddleware,
  allow_origins=FRONTEND_ORIGINS,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# Session middleware
app.add_middleware(
    SessionMiddleware,
    secret_key=secret_key,
    max_age=60*60*24*7,  # 7 days
    session_cookie="session"
)

# router
app.include_router(home.router)
app.include_router(schedule.router)
app.include_router(auth.router)

# Handle errors that are not dealed with any logic
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
  print(f"❌ Unexpected error: {exc}")
  return error_response(500, "Internal server error")

# Lambda handler
handler = Mangum(app)