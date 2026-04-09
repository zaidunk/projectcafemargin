import io
import uuid
import re
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
import pandas as pd
from app.database import get_db
from app.models.transaction import Transaction
from app.models.menu_item import MenuItem
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


# ─── Format Detection ─────────────────────────────────────────────────────────

def _detect_format(df: pd.DataFrame) -> str:
    """Auto-detect CSV format: 'moka' | 'simple' | 'unknown'"""
    cols = {c.strip().lower() for c in df.columns}
    # Moka POS signature columns
    if "items" in cols and ("gross sales" in cols or "net sales" in cols):
        return "moka"
    # Simple CafeMargin format
    if "item_name" in cols and "unit_price" in cols:
        return "simple"
    return "unknown"


# ─── Moka POS Parser ──────────────────────────────────────────────────────────

def _parse_items_field(items_str: str) -> list[dict]:
    """
    Parse Moka items string: 'Kopi Susu x 2, Croissant, Matcha x 3'
    Returns [{'name': ..., 'qty': ...}, ...]
    """
    if not items_str or pd.isna(items_str) or str(items_str).strip() == "":
        return []

    results = []
    parts = str(items_str).split(",")
    for part in parts:
        part = part.strip()
        if not part:
            continue
        # Match "Item Name x Qty" pattern (case-insensitive)
        match = re.match(r"^(.+?)\s+x\s+(\d+)$", part, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            qty = int(match.group(2))
        else:
            name = part
            qty = 1
        if name:
            results.append({"name": name, "qty": qty})
    return results


def _parse_moka_date(date_str: str):
    """Parse DD-MM-YY or DD-MM-YYYY"""
    s = str(date_str).strip()
    for fmt in ("%d-%m-%y", "%d-%m-%Y", "%Y-%m-%d", "%m/%d/%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def _process_moka(df: pd.DataFrame, cafe_id: int, batch_id: str, db: Session) -> tuple[list, list]:
    """
    Parse Moka POS export.
    Returns (records, unmatched_items)
    """
    # Normalize column names for lookup
    df.columns = [c.strip() for c in df.columns]
    col_map = {c.lower(): c for c in df.columns}

    def get_col(name: str):
        return col_map.get(name.lower())

    records = []
    unmatched = set()

    # Pre-load all menu items for this cafe (for price/HPP lookup)
    menu_lookup: dict[str, MenuItem] = {}
    menu_items = db.query(MenuItem).filter(MenuItem.cafe_id == cafe_id).all()
    for mi in menu_items:
        menu_lookup[mi.name.strip().lower()] = mi

    for _, row in df.iterrows():
        # Skip non-payment rows
        event_type_col = get_col("event type")
        if event_type_col and str(row.get(event_type_col, "Payment")).strip().lower() not in ("payment", ""):
            continue

        # Parse date
        date_col = get_col("date")
        tx_date = _parse_moka_date(row.get(date_col, "")) if date_col else None
        if not tx_date:
            continue

        # Parse hour
        time_col = get_col("time")
        try:
            hour = int(str(row.get(time_col, "0")).split(":")[0])
        except Exception:
            hour = 0

        # Revenue fields
        net_sales = float(row.get(get_col("net sales") or "Net Sales", 0) or 0)
        gross_sales = float(row.get(get_col("gross sales") or "Gross Sales", 0) or 0)
        discount = float(row.get(get_col("discounts") or "Discounts", 0) or 0)
        payment_method = str(row.get(get_col("payment method") or "Payment Method", "") or "")
        receipt_number = str(row.get(get_col("receipt number") or "Receipt Number", "") or "")

        # Parse items
        items_col = get_col("items")
        items_str = str(row.get(items_col, "") or "") if items_col else ""
        items = _parse_items_field(items_str)

        if not items:
            continue

        total_qty = sum(i["qty"] for i in items)

        # Distribute revenue per item (proportional by qty if no price in menu)
        for item in items:
            name = item["name"].strip()
            qty = item["qty"]
            name_lower = name.lower()

            # Look up in menu_items for price and HPP
            menu_item = menu_lookup.get(name_lower)

            if menu_item and menu_item.price > 0:
                unit_price = menu_item.price
                hpp = menu_item.hpp
                category = menu_item.category or "Lainnya"
            else:
                # Estimate: distribute gross_sales proportionally by qty (pre-discount price)
                unit_price = (gross_sales / total_qty) if total_qty > 0 else 0
                hpp = 0.0
                category = menu_item.category if menu_item else "Lainnya"
                if not menu_item:
                    unmatched.add(name)

            # Revenue = net_sales distributed proportionally
            item_revenue = (net_sales / total_qty * qty) if total_qty > 0 else 0

            records.append(Transaction(
                cafe_id=cafe_id,
                date=tx_date,
                hour=hour,
                item_name=name,
                category=category,
                quantity=qty,
                unit_price=unit_price,
                hpp=hpp,
                total_revenue=item_revenue,
                gross_sales=(gross_sales / total_qty * qty) if total_qty > 0 else 0,
                discount=(discount / total_qty * qty) if total_qty > 0 else 0,
                payment_method=payment_method.strip(),
                receipt_number=receipt_number.strip(),
                upload_batch=batch_id,
                source_format="moka",
            ))

    return records, list(unmatched)


# ─── Simple Format Parser ─────────────────────────────────────────────────────

def _process_simple(df: pd.DataFrame, cafe_id: int, batch_id: str) -> list:
    """Parse simple CafeMargin CSV format"""
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    REQUIRED = {"date", "item_name", "unit_price"}
    missing = REQUIRED - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Kolom tidak ditemukan: {', '.join(sorted(missing))}. "
                   f"Download template untuk format yang benar, atau gunakan export Moka POS."
        )

    df["date"] = pd.to_datetime(df["date"], dayfirst=True, errors="coerce")
    df["hour"] = pd.to_numeric(df.get("hour", 0), errors="coerce").fillna(0).astype(int).clip(0, 23)
    df["quantity"] = pd.to_numeric(df.get("quantity", 1), errors="coerce").fillna(1).astype(int)
    df["unit_price"] = pd.to_numeric(df["unit_price"], errors="coerce").fillna(0)
    df["hpp"] = pd.to_numeric(df.get("hpp", 0), errors="coerce").fillna(0)
    df["total_revenue"] = pd.to_numeric(df.get("total_revenue", 0), errors="coerce")
    mask = df["total_revenue"].isna() | (df["total_revenue"] == 0)
    df.loc[mask, "total_revenue"] = df.loc[mask, "unit_price"] * df.loc[mask, "quantity"]
    if "category" not in df.columns:
        df["category"] = "Lainnya"
    df = df.dropna(subset=["date", "item_name"])

    records = []
    for _, row in df.iterrows():
        records.append(Transaction(
            cafe_id=cafe_id,
            date=row["date"].date(),
            hour=int(row["hour"]),
            item_name=str(row["item_name"]).strip(),
            category=str(row.get("category", "Lainnya")).strip(),
            quantity=int(row["quantity"]),
            unit_price=float(row["unit_price"]),
            hpp=float(row["hpp"]),
            total_revenue=float(row["total_revenue"]),
            upload_batch=batch_id,
            source_format="simple",
        ))
    return records


# ─── File Reader ──────────────────────────────────────────────────────────────

def _read_file(file: UploadFile) -> pd.DataFrame:
    content = file.file.read()
    name = (file.filename or "").lower()
    if name.endswith(".csv"):
        # Try different encodings
        for enc in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
            try:
                return pd.read_csv(io.BytesIO(content), encoding=enc, on_bad_lines="skip")
            except Exception:
                continue
        raise HTTPException(status_code=400, detail="Tidak bisa membaca file CSV")
    elif name.endswith((".xlsx", ".xls")):
        return pd.read_excel(io.BytesIO(content))
    else:
        raise HTTPException(status_code=400, detail="Format tidak didukung. Gunakan CSV atau Excel (.xlsx/.xls)")


# ─── Auto-create Menu Items ──────────────────────────────────────────────────

def _auto_create_menu_items(records: list, cafe_id: int, db: Session) -> list[str]:
    """
    Auto-create MenuItem entries for new items found in uploaded transactions.
    Returns list of newly created item names.
    """
    existing = {
        mi.name.strip().lower()
        for mi in db.query(MenuItem).filter(MenuItem.cafe_id == cafe_id).all()
    }

    # Collect unique items with their estimated price and category
    item_info: dict[str, dict] = {}
    for r in records:
        key = r.item_name.strip().lower()
        if key not in existing and key not in item_info:
            item_info[key] = {
                "name": r.item_name.strip(),
                "category": r.category or "Lainnya",
                "price": r.unit_price or 0,
            }

    if not item_info:
        return []

    new_items = []
    for info in item_info.values():
        mi = MenuItem(
            cafe_id=cafe_id,
            name=info["name"],
            category=info["category"],
            price=info["price"],
            hpp=0,  # HPP diisi nanti oleh user
        )
        db.add(mi)
        new_items.append(info["name"])
    db.commit()
    return new_items


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/upload")
def upload_transactions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("superadmin", "cafe_owner", "cafe_staff"):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    cafe_id = current_user.cafe_id
    if not cafe_id:
        raise HTTPException(status_code=400, detail="User belum terhubung ke cafe manapun. Hubungi admin.")

    df = _read_file(file)
    fmt = _detect_format(df)
    batch_id = str(uuid.uuid4())[:8]

    if fmt == "moka":
        records, unmatched = _process_moka(df, cafe_id, batch_id, db)
        db.bulk_save_objects(records)
        db.commit()
        new_items = _auto_create_menu_items(records, cafe_id, db)
        result = {
            "message": f"Berhasil mengimport {len(records)} item transaksi dari {file.filename}",
            "format_detected": "Moka POS",
            "batch_id": batch_id,
            "rows_imported": len(records),
        }
        if new_items:
            result["new_menu_items"] = len(new_items)
            result["info"] = (
                f"{len(new_items)} item baru otomatis ditambahkan ke daftar menu. "
                "Anda bisa mengatur HPP di halaman Settings → Menu."
            )
        return result

    elif fmt == "simple":
        records = _process_simple(df, cafe_id, batch_id)
        db.bulk_save_objects(records)
        db.commit()
        new_items = _auto_create_menu_items(records, cafe_id, db)
        result = {
            "message": f"Berhasil mengimport {len(records)} transaksi",
            "format_detected": "Simple (CafeMargin)",
            "batch_id": batch_id,
            "rows_imported": len(records),
        }
        if new_items:
            result["new_menu_items"] = len(new_items)
            result["info"] = (
                f"{len(new_items)} item baru otomatis ditambahkan ke daftar menu. "
                "Anda bisa mengatur HPP di halaman Settings → Menu."
            )
        return result

    else:
        raise HTTPException(
            status_code=400,
            detail=(
                "Format file tidak dikenali. Gunakan:\n"
                "1. Export Moka POS (kolom: Date, Time, Gross Sales, Items, ...)\n"
                "2. Template CafeMargin (kolom: date, item_name, unit_price, hpp, ...)\n"
                "Download template dari tombol di bawah."
            )
        )


@router.get("/template")
def download_template(format: str = Query("cafemargin", pattern="^(cafemargin|moka)$")):
    if format == "moka":
        template = (
            "# Template Moka POS Export — kolom Receipt Number & Payment Method opsional\n"
            "Date,Receipt Number,Gross Sales,Discounts,Net Sales,Items,Category,Qty,Payment Method\n"
            "01/15/2026,RCP-001,50000,0,50000,Kopi Susu,Minuman,2,Cash\n"
            "01/15/2026,RCP-001,22000,0,22000,Croissant,Makanan,1,Cash\n"
            "01/15/2026,RCP-002,84000,5000,79000,Matcha Latte,Minuman,3,QRIS\n"
            "01/15/2026,RCP-002,25000,0,25000,Americano,Minuman,1,QRIS\n"
        )
        return {"template": template, "filename": "template_moka_pos.csv"}
    template = (
        "# Template CafeMargin — kolom hpp & category opsional (bisa diisi nanti di Settings)\n"
        "date,hour,item_name,category,quantity,unit_price,hpp,total_revenue,receipt_number,payment_method,discount\n"
        "2026-01-15,08,Kopi Susu,Minuman,2,25000,8000,50000,RCP-001,Cash,0\n"
        "2026-01-15,09,Croissant,Makanan,1,22000,9000,22000,RCP-001,Cash,0\n"
        "2026-01-15,10,Matcha Latte,Minuman,3,28000,10000,84000,RCP-002,QRIS,5000\n"
        "2026-01-15,10,Americano,Minuman,1,25000,7000,25000,RCP-002,QRIS,0\n"
        "2026-01-15,14,Nasi Goreng,Makanan,2,30000,12000,60000,RCP-003,GoPay,0\n"
    )
    return {"template": template, "filename": "template_transaksi_cafemargin.csv"}


@router.get("")
def list_transactions(
    period_days: int = Query(30, le=9999),
    item_name: str = Query(None),
    category: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {"transactions": [], "total": 0}

    start_date = date.today() - timedelta(days=period_days)
    q = db.query(Transaction).filter(
        Transaction.cafe_id == cafe_id,
        Transaction.date >= start_date,
    )
    if item_name:
        q = q.filter(Transaction.item_name.ilike(f"%{item_name}%"))
    if category:
        q = q.filter(Transaction.category == category)

    transactions = q.order_by(Transaction.date.desc(), Transaction.hour.desc()).limit(500).all()
    return {
        "transactions": [
            {
                "id": t.id,
                "date": str(t.date),
                "hour": t.hour,
                "item_name": t.item_name,
                "category": t.category,
                "quantity": t.quantity,
                "unit_price": t.unit_price,
                "hpp": t.hpp,
                "total_revenue": t.total_revenue,
                "payment_method": t.payment_method,
                "upload_batch": t.upload_batch,
                "source_format": t.source_format,
            }
            for t in transactions
        ],
        "total": len(transactions),
    }


@router.get("/batches")
def list_batches(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all upload batches"""
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return []
    result = db.query(
        Transaction.upload_batch,
        Transaction.source_format,
        func.count(Transaction.id).label("count"),
        func.min(Transaction.date).label("min_date"),
        func.max(Transaction.date).label("max_date"),
        func.max(Transaction.created_at).label("uploaded_at"),
    ).filter(Transaction.cafe_id == cafe_id)\
     .group_by(Transaction.upload_batch, Transaction.source_format)\
     .order_by(func.max(Transaction.created_at).desc())\
     .all()
    return [
        {
            "batch_id": r.upload_batch,
            "source_format": r.source_format,
            "count": r.count,
            "date_range": f"{r.min_date} s/d {r.max_date}",
            "uploaded_at": str(r.uploaded_at),
        }
        for r in result
    ]


@router.delete("/batch/{batch_id}")
def delete_batch(batch_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ("superadmin", "cafe_owner"):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    deleted = db.query(Transaction).filter(
        Transaction.cafe_id == current_user.cafe_id,
        Transaction.upload_batch == batch_id,
    ).delete()
    db.commit()
    return {"deleted": deleted}
