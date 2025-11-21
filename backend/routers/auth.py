from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from ..utils.response_helper import success_response, error_response
from starlette.middleware.sessions import SessionMiddleware
import requests
import json
from pydantic import BaseModel
import boto3
from boto3.dynamodb.conditions import Key, Attr
import bcrypt
from datetime import datetime, timezone
import uuid

class RegisterRequest(BaseModel):
  user_name: str
  birthday: str
  email: str
  password: str

class LoginRequest(BaseModel):
  email: str
  password: str

router = APIRouter(prefix="/api/auth", tags=["Auth"])
dynamodb = boto3.resource("dynamodb", region_name="us-east-1")

# ---------- Register ----------
@router.post("/register")
async def save_user_info(request: RegisterRequest):
  table = dynamodb.Table("users")
  
  password_bytes = request.password.encode('utf-8')
  hashed_pw = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
  hashed_pw_str = hashed_pw.decode("utf-8")

  try:
    table.put_item(
      Item = {
        "user_id": str(uuid.uuid4()),
        "user_name": request.user_name,
        "birthday": request.birthday,
        "email": request.email,
        "password": hashed_pw_str, # Store hashed password
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
      }
    )
    return {
      "code": 0,
      "message": "Account created!"
    }
  
  except Exception as e:
    print(f"Error saving user info to DynamoDB: {e}")
    return {
      "code": -1,
      "error": "Error saving user information."
    }

# ---------- Login ----------
@router.post("/login")
async def login(req: Request, body: LoginRequest):
  table = dynamodb.Table("users")
  
  # query user from DynamoDB
  response = table.query(
    IndexName="email-index",
    KeyConditionExpression=Key("email").eq(body.email),
  )
  items = response.get("Items", [])
  if not items:
    return error_response(400, "Invalid credentials")
  
  user = items[0]
  
  # check the password
  if not bcrypt.checkpw(body.password.encode("utf-8"), user["password"].encode("utf-8")):
    return error_response(400, "Invalid credentials")
  
  # set session
  req.session["user_id"] = user["user_id"]
  req.session["user_name"] = user["user_name"]
  
  # update information in db
  table.update_item(
    Key={"user_id": user["user_id"]},
    UpdateExpression="SET last_login = :login_time, updated_at = :updated_time",
    ExpressionAttributeValues={
      ":login_time": datetime.now(timezone.utc).isoformat(),
      ":updated_time": datetime.now(timezone.utc).isoformat()
    }
  )
  
  return success_response("Login successful!")

# -------- Get user --------
@router.post('/user')
async def get_user(request: Request):
  user_id = request.session.get("user_id")
  if not user_id:
    return error_response(401, "Not logged in")
  
  return success_response(
    "Logged in",
    {
      "user_id": request.session.get("user_id"),
      "user_name": request.session.get("user_name")
    }
  )

# ---------- Log out ----------
@router.post("/logout")
async def logout(request: Request):
  request.session.clear()
  return success_response("Logged out successfully")
  
# if __name__ == "__main__":
#   login()