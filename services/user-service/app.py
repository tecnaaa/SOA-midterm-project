from fastapi import FastAPI
from routes import auth

app = FastAPI()

# gắn route login
app.include_router(auth.router, prefix="/auth")

@app.get("/")
def root():
    return {"message": "iBanking Tuition API running"}
