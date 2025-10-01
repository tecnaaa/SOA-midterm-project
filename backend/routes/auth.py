from fastapi import APIRouter, HTTPException
from db import users_col
import bcrypt
from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "mysecret"
ALGORITHM = "HS256"

router = APIRouter()

@router.post("/login")
def login(username: str, password: str):
    user = users_col.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if not bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid password")

    token = jwt.encode(
        {"sub": str(user["_id"]), "exp": datetime.utcnow() + timedelta(hours=1)},
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    return {"access_token": token, "token_type": "bearer"}
