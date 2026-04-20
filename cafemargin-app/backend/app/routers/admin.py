import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, field_validator
from typing import Optional
from app.database import get_db
from app.models.cafe import Cafe
from app.models.user import User
from app.auth import hash_password, require_superadmin
from app.security import validate_password, apply_rate_limit

_ALLOWED_ROLES = {"superadmin", "cafe_owner", "cafe_staff"}

router = APIRouter(prefix="/api/admin", tags=["admin"])
logger = logging.getLogger("cafemargin.admin")


class CafeCreate(BaseModel):
    name: str
    owner_name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    subscription_level: int = 1


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "cafe_owner"
    cafe_id: Optional[int] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in _ALLOWED_ROLES:
            raise ValueError(f"Role harus salah satu dari: {', '.join(sorted(_ALLOWED_ROLES))}")
        return v


@router.get("/cafes")
def list_cafes(
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _=Depends(require_superadmin),
):
    rows = (
        db.query(Cafe, func.count(User.id).label("user_count"))
        .outerjoin(User, User.cafe_id == Cafe.id)
        .group_by(Cafe.id)
        .order_by(Cafe.id)
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        {
            "id": cafe.id,
            "name": cafe.name,
            "owner_name": cafe.owner_name,
            "address": cafe.address,
            "phone": cafe.phone,
            "subscription_level": cafe.subscription_level,
            "created_at": cafe.created_at,
            "user_count": int(user_count or 0),
        }
        for cafe, user_count in rows
    ]


@router.post("/cafes")
def create_cafe(body: CafeCreate, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    cafe = Cafe(**body.model_dump())
    db.add(cafe)
    db.commit()
    db.refresh(cafe)
    return {"id": cafe.id, "name": cafe.name}


@router.put("/cafes/{cafe_id}")
def update_cafe(cafe_id: int, body: CafeCreate, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    cafe = db.query(Cafe).filter(Cafe.id == cafe_id).first()
    if not cafe:
        raise HTTPException(status_code=404, detail="Cafe not found")
    for k, v in body.model_dump().items():
        setattr(cafe, k, v)
    db.commit()
    return {"id": cafe.id, "name": cafe.name}


@router.get("/users")
def list_users(
    limit: int = Query(200, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    cafe_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_superadmin),
):
    query = db.query(User).order_by(User.id).offset(offset).limit(limit)
    if cafe_id is not None:
        query = query.filter(User.cafe_id == cafe_id)
    users = query.all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "cafe_id": u.cafe_id,
            "preferred_lang": u.preferred_lang,
            "created_at": u.created_at,
        }
        for u in users
    ]


@router.post("/users")
def create_user(request: Request, body: UserCreate, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    apply_rate_limit(request, body.email, prefix="admin_cu")
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    error = validate_password(body.password)
    if error:
        raise HTTPException(status_code=400, detail=error)
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        role=body.role,
        cafe_id=body.cafe_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("User dibuat: %s (role=%s, cafe_id=%s)", user.email, user.role, user.cafe_id)
    return {"id": user.id, "email": user.email}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    email = user.email
    db.delete(user)
    db.commit()
    logger.info("User dihapus: %s (id=%s)", email, user_id)
    return {"message": "User deleted"}
