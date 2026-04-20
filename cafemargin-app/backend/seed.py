"""
Seed script: membuat data sample cafe + transaksi untuk dev/testing.
JANGAN jalankan di production — tidak membuat user, buat user lewat /api/admin/users.
Jalankan: python seed.py
"""
import sys
import os
import random
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models import Cafe, User, Transaction, MenuItem, ActionPlan, KPITarget
from app.auth import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ---------- Bersihkan data lama ----------
for model in [KPITarget, ActionPlan, Transaction, MenuItem, User, Cafe]:
    db.query(model).delete()
db.commit()

# ---------- Cafes ----------
cafe1 = Cafe(name="Kopi Nusantara", owner_name="Budi Santoso", address="Jl. Sudirman No. 12, Jakarta", phone="081234567890", subscription_level=2)
cafe2 = Cafe(name="Rumah Kopi Bandung", owner_name="Siti Rahayu", address="Jl. Braga No. 5, Bandung", phone="082345678901", subscription_level=1)
db.add_all([cafe1, cafe2])
db.commit()
db.refresh(cafe1)
db.refresh(cafe2)

# User tidak dibuat oleh seed — buat lewat POST /api/admin/users setelah superadmin pertama dibuat

# ---------- Menu Items Cafe 1 ----------
menu_items_c1 = [
    MenuItem(cafe_id=cafe1.id, name="Kopi Susu", category="Minuman", price=28000, hpp=8000),
    MenuItem(cafe_id=cafe1.id, name="Americano", category="Minuman", price=22000, hpp=4000),
    MenuItem(cafe_id=cafe1.id, name="Matcha Latte", category="Minuman", price=32000, hpp=12000),
    MenuItem(cafe_id=cafe1.id, name="Caramel Macchiato", category="Minuman", price=35000, hpp=11000),
    MenuItem(cafe_id=cafe1.id, name="Croissant", category="Makanan", price=22000, hpp=9000),
    MenuItem(cafe_id=cafe1.id, name="Avocado Toast", category="Makanan", price=38000, hpp=18000),
    MenuItem(cafe_id=cafe1.id, name="Cheesecake", category="Dessert", price=30000, hpp=12000),
    MenuItem(cafe_id=cafe1.id, name="Brownies", category="Dessert", price=18000, hpp=8000),
    MenuItem(cafe_id=cafe1.id, name="Es Teh Manis", category="Minuman", price=12000, hpp=2000),
    MenuItem(cafe_id=cafe1.id, name="Indomie Goreng Spesial", category="Makanan", price=18000, hpp=9500),
    MenuItem(cafe_id=cafe1.id, name="Cold Brew", category="Minuman", price=30000, hpp=6000),
    MenuItem(cafe_id=cafe1.id, name="Sandwich Club", category="Makanan", price=35000, hpp=16000),
]
db.add_all(menu_items_c1)
db.commit()

# ---------- Transactions Cafe 1 (30 hari) ----------
menu_data = [
    ("Kopi Susu", "Minuman", 28000, 8000, [8, 9, 10, 14, 15, 16]),
    ("Americano", "Minuman", 22000, 4000, [7, 8, 9, 10]),
    ("Matcha Latte", "Minuman", 32000, 12000, [10, 11, 14, 15, 16, 17]),
    ("Caramel Macchiato", "Minuman", 35000, 11000, [10, 11, 15, 16]),
    ("Croissant", "Makanan", 22000, 9000, [8, 9, 10, 11]),
    ("Avocado Toast", "Makanan", 38000, 18000, [9, 10, 11, 12]),
    ("Cheesecake", "Dessert", 30000, 12000, [13, 14, 15, 16, 17]),
    ("Brownies", "Dessert", 18000, 8000, [13, 14, 15, 16]),
    ("Es Teh Manis", "Minuman", 12000, 2000, [11, 12, 13, 14, 15]),
    ("Indomie Goreng Spesial", "Makanan", 18000, 9500, [11, 12, 18, 19]),
    ("Cold Brew", "Minuman", 30000, 6000, [10, 14, 15, 16]),
    ("Sandwich Club", "Makanan", 35000, 16000, [11, 12, 13]),
]

transactions = []
today = date.today()
for day_offset in range(30):
    tx_date = today - timedelta(days=30 - day_offset)
    is_weekend = tx_date.weekday() >= 5
    multiplier = 1.4 if is_weekend else 1.0

    for item_name, category, price, hpp, peak_hours in menu_data:
        # Transaksi di jam peak
        for hour in peak_hours:
            base_qty = random.randint(1, 4) if is_weekend else random.randint(1, 3)
            for _ in range(base_qty):
                qty = random.randint(1, 3)
                noise = random.uniform(0.9, 1.1)
                payment = ["QRIS", "Cash", "BRI", "GoPay", "OVO"][hash(item_name + str(hour)) % 5]
                transactions.append(Transaction(
                    cafe_id=cafe1.id,
                    date=tx_date,
                    hour=hour,
                    item_name=item_name,
                    category=category,
                    quantity=qty,
                    unit_price=price,
                    hpp=hpp,
                    total_revenue=price * qty,
                    payment_method=payment,
                    upload_batch="seed-data",
                    source_format="simple",
                ))

db.bulk_save_objects(transactions)
db.commit()

# ---------- KPI Targets Cafe 1 ----------
kpi_targets = [
    KPITarget(cafe_id=cafe1.id, metric_name="Target Revenue Bulanan", target_value=80_000_000, actual_value=None,
              period_start=date.today().replace(day=1), period_end=date.today()),
    KPITarget(cafe_id=cafe1.id, metric_name="Target Margin %", target_value=45.0, actual_value=None,
              period_start=date.today().replace(day=1), period_end=date.today()),
    KPITarget(cafe_id=cafe1.id, metric_name="Average Transaction Value", target_value=55_000, actual_value=None,
              period_start=date.today().replace(day=1), period_end=date.today()),
]
db.add_all(kpi_targets)

# ---------- Action Plans Cafe 1 ----------
action_plans = [
    ActionPlan(cafe_id=cafe1.id, action_text="Naikkan harga Indomie Goreng Spesial dari Rp18.000 ke Rp22.000", status="todo",
               due_date=today + timedelta(days=7), assignee="Budi Santoso"),
    ActionPlan(cafe_id=cafe1.id, action_text="Buat flash promo jam 11:00-12:00 untuk Es Teh Manis (beli 2 gratis 1)", status="in_progress",
               due_date=today + timedelta(days=3), assignee="Andi Wijaya"),
    ActionPlan(cafe_id=cafe1.id, action_text="Renegosiasi harga bahan baku Avocado Toast dengan supplier", status="todo",
               due_date=today + timedelta(days=14), assignee="Budi Santoso"),
    ActionPlan(cafe_id=cafe1.id, action_text="Training barista upsell Caramel Macchiato saat jam 15:00-17:00", status="done",
               due_date=today - timedelta(days=2), assignee="Andi Wijaya"),
    ActionPlan(cafe_id=cafe1.id, action_text="Setup paket bundling: Kopi Susu + Croissant = Rp42.000 (hemat 8.000)", status="todo",
               due_date=today + timedelta(days=5), assignee="Budi Santoso"),
]
db.add_all(action_plans)
db.commit()

print("=" * 50)
print("Seed berhasil!")
print(f"Total transaksi seed: {len(transactions)}")
print("Buat user lewat: POST /api/admin/users")
print("=" * 50)
db.close()
