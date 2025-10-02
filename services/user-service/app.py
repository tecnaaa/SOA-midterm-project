from fastapi import FastAPI
from routes import auth

app = FastAPI(title="User Service API")

app.include_router(auth.router, prefix="/auth", tags=["Auth"])