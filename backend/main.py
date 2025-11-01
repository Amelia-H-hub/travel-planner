from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import home
from backend.routers import events
from mangum import Mangum

app = FastAPI(root_path="/dev")  # Set root_path to /dev for compatibility with AWS Lambda proxy integration

origins = [
    "http://localhost:5173",
]

# Allow frontend request from different netword
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=False,
  allow_methods=["*"],
  allow_headers=["*"],
)

# router
app.include_router(home.router)
app.include_router(events.router)

# Lambda handler
handler = Mangum(app)