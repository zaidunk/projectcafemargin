from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.models.cafe import Cafe
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


class MeResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    cafe_id: int | None
    preferred_lang: str
    cafe_name: str | None
    subscription_level: int | None


@router.post("/login", response_model=LoginResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email atau password salah")

    token = create_access_token({"sub": str(user.id), "role": user.role, "cafe_id": user.cafe_id})

    cafe_name = None
    subscription_level = None
    if user.cafe_id:
        cafe = db.query(Cafe).filter(Cafe.id == user.cafe_id).first()
        if cafe:
            cafe_name = cafe.name
            subscription_level = cafe.subscription_level

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "cafe_id": user.cafe_id,
            "preferred_lang": user.preferred_lang,
            "cafe_name": cafe_name,
            "subscription_level": subscription_level,
        },
    }


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cafe_name = None
    subscription_level = None
    if current_user.cafe_id:
        cafe = db.query(Cafe).filter(Cafe.id == current_user.cafe_id).first()
        if cafe:
            cafe_name = cafe.name
            subscription_level = cafe.subscription_level

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "cafe_id": current_user.cafe_id,
        "preferred_lang": current_user.preferred_lang,
        "cafe_name": cafe_name,
        "subscription_level": subscription_level,
    }


class UpdateLang(BaseModel):
    lang: str


@router.put("/lang")
def update_lang(body: UpdateLang, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if body.lang not in ("id", "en"):
        raise HTTPException(status_code=400, detail="Invalid language")
    current_user.preferred_lang = body.lang
    db.commit()
    return {"preferred_lang": body.lang}


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


@router.put("/change-password")
def change_password(body: ChangePassword, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Password lama tidak sesuai")
    current_user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"message": "Password berhasil diubah"}
