from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import home
from mangum import Mangum

app = FastAPI()

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

# Lambda handler
handler = Mangum(app)