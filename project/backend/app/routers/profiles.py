from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.database import supabase_admin
from pydantic import BaseModel

router = APIRouter(prefix="/profiles", tags=["profiles"])


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    face_encoding: str | None = None


@router.get("/me")
async def get_my_profile(user: dict = Depends(get_current_user)):
    return {"profile": user["profile"]}


@router.patch("/me")
async def update_my_profile(req: ProfileUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    if not updates:
        return {"profile": user["profile"]}

    resp = supabase_admin.table("profiles").update(updates).eq("id", user["user_id"]).execute()
    return {"profile": resp.data[0]}
