from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS
from app.routers import attendance, overtime, ai_assistant, admin, profiles

app = FastAPI(title="AttendAI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(attendance.router)
app.include_router(overtime.router)
app.include_router(ai_assistant.router)
app.include_router(admin.router)
app.include_router(profiles.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "attendai-backend"}
