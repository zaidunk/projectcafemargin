from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.menu_item import MenuItem
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/menu", tags=["menu"])


class MenuItemCreate(BaseModel):
    name: str
    category: Optional[str] = "Lainnya"
    price: float
    hpp: float = 0.0
    is_active: bool = True


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    hpp: Optional[float] = None
    is_active: Optional[bool] = None


@router.get("")
def list_menu(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return []
    items = db.query(MenuItem).filter(MenuItem.cafe_id == cafe_id).order_by(MenuItem.category, MenuItem.name).all()
    return [
        {
            "id": i.id,
            "name": i.name,
            "category": i.category,
            "price": i.price,
            "hpp": i.hpp,
            "margin_pct": ((i.price - i.hpp) / i.price * 100) if i.price > 0 else 0,
            "is_active": i.is_active,
        }
        for i in items
    ]


@router.post("")
def create_menu_item(
    body: MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("superadmin", "cafe_owner"):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    item = MenuItem(cafe_id=current_user.cafe_id, **body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id, "name": item.name}


@router.put("/{item_id}")
def update_menu_item(
    item_id: int,
    body: MenuItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("superadmin", "cafe_owner"):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    item = db.query(MenuItem).filter(MenuItem.id == item_id, MenuItem.cafe_id == current_user.cafe_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item tidak ditemukan")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(item, k, v)
    db.commit()
    return {"id": item.id, "name": item.name}


@router.delete("/{item_id}")
def delete_menu_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("superadmin", "cafe_owner"):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    item = db.query(MenuItem).filter(MenuItem.id == item_id, MenuItem.cafe_id == current_user.cafe_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item tidak ditemukan")
    db.delete(item)
    db.commit()
    return {"message": "Item dihapus"}
