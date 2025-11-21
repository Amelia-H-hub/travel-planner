from fastapi.responses import JSONResponse

def success_response(message: str, data: dict=None, code: int=200):
  return JSONResponse(
    status_code=code,
    content={
      "code": code,
      "message": message,
      "data": data or {}
    }
    
  )

def error_response(code: int, message: str):
  return JSONResponse(
    status_code=code,
    content={
      "code": code,
      "message": message
    }
  )