from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routers import auth, ai, users, documents
from src.config.settings import settings

app = FastAPI(title="FastAPI Application")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(ai.router)
app.include_router(users.router)
app.include_router(documents.router)

@app.on_event("startup")
async def startup_event():
    print("🚀 SERVER STARTING - DEBUG LOGS ENABLED")

@app.get("/")
def read_root():
    return {"message": "Welcome to my FastAPI Application!"}
