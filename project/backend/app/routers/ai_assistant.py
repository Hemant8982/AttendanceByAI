from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.auth import get_current_user
from app.services.ai_assistant import detect_intent, fetch_intent_data, format_response

router = APIRouter(prefix="/ai", tags=["ai-assistant"])


class AIQuery(BaseModel):
    query: str


@router.post("/ask")
async def ask_assistant(req: AIQuery, user: dict = Depends(get_current_user)):
    intent = detect_intent(req.query)
    data = fetch_intent_data(intent, user["user_id"], user["role"])
    response = format_response(intent, data)
    return {"intent": intent, "response": response, "data": data}
