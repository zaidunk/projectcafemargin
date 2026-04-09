from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.cafe import Cafe
from app.models.user import User
from app.auth import hash_password, require_superadmin

router = APIRouter(prefix="/api/admin", tags=["admin"])


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


@router.get("/cafes")
def list_cafes(db: Session = Depends(get_db), _=Depends(require_superadmin)):
    cafes = db.query(Cafe).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "owner_name": c.owner_name,
            "address": c.address,
            "phone": c.phone,
            "subscription_level": c.subscription_level,
            "created_at": c.created_at,
            "user_count": len(c.users),
        }
        for c in cafes
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
def list_users(db: Session = Depends(get_db), _=Depends(require_superadmin)):
    users = db.query(User).all()
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
def create_user(body: UserCreate, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
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
    return {"id": user.id, "email": user.email}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_superadmin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
