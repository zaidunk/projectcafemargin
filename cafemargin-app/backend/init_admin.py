"""
Bootstrap script: membuat superadmin + cafe owner pertama.
Hanya jalan kalau database masih kosong (belum ada user).

Jalankan:
    ADMIN_EMAIL=xolvon@cafemargin.id ADMIN_PASSWORD=Rizal88!! \
    OWNER_PASSWORD=GantiPassword1! python init_admin.py

Windows (PowerShell):
    $env:ADMIN_EMAIL="xolvon@cafemargin.id"; $env:ADMIN_PASSWORD="Rizal88!!"; \
    $env:OWNER_PASSWORD="GantiPassword1!"; python init_admin.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.cafe import Cafe
from app.models.user import User
from app.auth import hash_password

Base.metadata.create_all(bind=engine)

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "xolvon@cafemargin.id")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
OWNER_PASSWORD = os.getenv("OWNER_PASSWORD")

if not ADMIN_PASSWORD:
    print("Error: ADMIN_PASSWORD env var wajib diisi")
    sys.exit(1)

if not OWNER_PASSWORD:
    print("Error: OWNER_PASSWORD env var wajib diisi")
    sys.exit(1)

db = SessionLocal()
try:
    if db.query(User).count() > 0:
        print("Database sudah ada user. Script ini hanya untuk setup awal.")
        sys.exit(0)

    cafe = Cafe(
        name="Kopi Nusantara",
        owner_name="Budi Santoso",
        address="Jl. Sudirman No. 12, Jakarta",
        phone="081234567890",
        subscription_level=2,
    )
    db.add(cafe)
    db.commit()
    db.refresh(cafe)

    db.add_all([
        User(
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            full_name="CafeMargin Admin",
            role="superadmin",
            cafe_id=None,
        ),
        User(
            email="budi@kopinusantara.id",
            password_hash=hash_password(OWNER_PASSWORD),
            full_name="Budi Santoso",
            role="cafe_owner",
            cafe_id=cafe.id,
        ),
    ])
    db.commit()

    print("=" * 50)
    print("Setup berhasil!")
    print(f"  Superadmin : {ADMIN_EMAIL}")
    print(f"  Cafe owner : budi@kopinusantara.id  (cafe: {cafe.name})")
    print("=" * 50)
except Exception as e:
    db.rollback()
    print(f"Error: {e}")
    sys.exit(1)
finally:
    db.close()
