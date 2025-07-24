from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import home
from backend.database import engine
from backend import models

app = FastAPI()

# Allow frontend request from different netword
app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:5173"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# router
app.include_router(home.router)

# initial tables
models.Base.metadata.create_all(bind=engine)

# @app.get("/api/hello")
# def read_root():
#   return {"message": "Hello from Python!"}

