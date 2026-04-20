"""
Tambah user baru ke database yang sudah ada.
Jalankan dari folder cafemargin-app/backend:

    python add_user.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.cafe import Cafe
from app.models.user import User
from app.auth import hash_password

Base.metadata.create_all(bind=engine)

USERS = [
    {
        "email": "xolvon@cafemargin.id",
        "password": "Rizal88!!",
        "full_name": "CafeMargin Admin",
        "role": "superadmin",
        "cafe_id": None,
    },
    {
        "email": "budi@kopinusantara.id",
        "password": "passwordUntukBudi1!",
        "full_name": "Budi Santoso",
        "role": "cafe_owner",
        "cafe_name": "Kopi Nusantara",
    },
]

db = SessionLocal()
try:
    for u in USERS:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if existing:
            existing.password_hash = hash_password(u["password"])
            existing.role = u["role"]
            print(f"[update] {u['email']} — password & role diperbarui")
        else:
            cafe_id = None
            if u.get("cafe_name"):
                cafe = db.query(Cafe).filter(Cafe.name == u["cafe_name"]).first()
                if not cafe:
                    cafe = Cafe(name=u["cafe_name"], owner_name=u["full_name"], subscription_level=2)
                    db.add(cafe)
                    db.commit()
                    db.refresh(cafe)
                cafe_id = cafe.id

            new_user = User(
                email=u["email"],
                password_hash=hash_password(u["password"]),
                full_name=u["full_name"],
                role=u["role"],
                cafe_id=u.get("cafe_id") if u.get("cafe_id") is not None else cafe_id,
            )
            db.add(new_user)
            print(f"[create] {u['email']} — user baru dibuat")

    db.commit()
    print("\nSelesai.")
except Exception as e:
    db.rollback()
    print(f"Error: {e}")
    sys.exit(1)
finally:
    db.close()
