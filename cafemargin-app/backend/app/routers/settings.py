from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.cafe import Cafe
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/settings", tags=["settings"])


class CafeUpdate(BaseModel):
    name: Optional[str] = None
    owner_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None


@router.get("/cafe")
def get_cafe_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.cafe_id:
        raise HTTPException(status_code=404, detail="Cafe tidak ditemukan")
    cafe = db.query(Cafe).filter(Cafe.id == current_user.cafe_id).first()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe tidak ditemukan")
    return {
        "id": cafe.id,
        "name": cafe.name,
        "owner_name": cafe.owner_name,
        "address": cafe.address,
        "phone": cafe.phone,
        "subscription_level": cafe.subscription_level,
        "created_at": str(cafe.created_at),
    }


@router.put("/cafe")
def update_cafe_settings(
    body: CafeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("superadmin", "cafe_owner"):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    cafe = db.query(Cafe).filter(Cafe.id == current_user.cafe_id).first()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe tidak ditemukan")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(cafe, k, v)
    db.commit()
    return {"message": "Pengaturan cafe berhasil disimpan"}
