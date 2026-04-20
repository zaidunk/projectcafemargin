import io
import uuid
import re
import mimetypes
import os
import logging
from typing import Optional
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Request
from sqlalchemy import func
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
from app.database import get_db
from app.models.transaction import Transaction
from app.models.menu_item import MenuItem
from app.models.storage_asset import StorageAsset
from app.auth import get_current_user
from app.models.user import User
from app.services.storage_service import get_bucket_names, sanitize_filename, upload_bytes
from app.services.transaction_loader import get_effective_date_range
from app.security import apply_rate_limit

router = APIRouter(prefix="/api/transactions", tags=["transactions"])
logger = logging.getLogger("cafemargin.transactions")

MAX_UPLOAD_MB = float(os.getenv("MAX_UPLOAD_MB", "50"))
MAX_UPLOAD_BYTES = int(MAX_UPLOAD_MB * 1024 * 1024)


# ─── Format Detection ─────────────────────────────────────────────────────────

def _detect_format(df: pd.DataFrame) -> str:
    """Auto-detect CSV format: 'moka' | 'simple' | 'unknown'"""
    cols = {str(c).strip().lower() for c in df.columns}
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
    for fmt in ("%d-%m-%y", "%d-%m-%Y", "%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def _to_number(value) -> float:
    """Best-effort numeric parsing for POS exports."""
    if value is None:
        return 0.0
    if isinstance(value, (int, float, np.number)):
        return float(value) if not pd.isna(value) else 0.0
    s = str(value).strip()
    if s == "" or s.lower() == "nan":
        return 0.0
    # Keep digits, minus, dot, and comma; drop currency symbols and text
    s = re.sub(r"[^\d,.-]", "", s)
    if "," in s and "." not in s:
        s = s.replace(",", ".")
    s = s.replace(",", "")
    try:
        return float(s)
    except ValueError:
        return 0.0


def _process_moka(df: pd.DataFrame, cafe_id: int, batch_id: str, db: Session) -> tuple[list, list]:
    """
    Parse Moka POS export.
    Returns (records, unmatched_items)
    """
    # Normalize column names for lookup
    df.columns = [str(c).strip() for c in df.columns]
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

    for row in df.to_dict(orient="records"):
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
        net_sales = _to_number(row.get(get_col("net sales") or "Net Sales", 0) or 0)
        gross_sales = _to_number(row.get(get_col("gross sales") or "Gross Sales", 0) or 0)
        discount = _to_number(row.get(get_col("discounts") or "Discounts", 0) or 0)
        payment_method = str(row.get(get_col("payment method") or "Payment Method", "") or "")
        receipt_number = str(row.get(get_col("receipt number") or "Receipt Number", "") or "")
        # collected_by   = str(row.get(get_col("collected by")   or "Collected By",   "") or "")

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
                # collected_by=collected_by.strip() or None,
                receipt_number=receipt_number.strip(),
                upload_batch=batch_id,
                source_format="moka",
            ))

    return records, list(unmatched)


# ─── Simple Format Parser ─────────────────────────────────────────────────────

def _process_simple(df: pd.DataFrame, cafe_id: int, batch_id: str) -> list:
    """Parse simple CafeMargin CSV format"""
    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

    REQUIRED = {"date", "item_name", "unit_price"}
    missing = REQUIRED - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Kolom tidak ditemukan: {', '.join(sorted(missing))}. "
                   f"Download template untuk format yang benar, atau gunakan export Moka POS."
        )

    def _series_or_default(col: str, default):
        return df[col] if col in df.columns else pd.Series([default] * len(df))

    df["date"] = pd.to_datetime(df["date"], dayfirst=True, errors="coerce")
    df["hour"] = pd.to_numeric(_series_or_default("hour", 0), errors="coerce").fillna(0).astype(int).clip(0, 23)
    df["quantity"] = pd.to_numeric(_series_or_default("quantity", 1), errors="coerce").fillna(1).astype(int)
    df["unit_price"] = pd.to_numeric(df["unit_price"], errors="coerce").fillna(0)
    df["hpp"] = pd.to_numeric(_series_or_default("hpp", 0), errors="coerce").fillna(0)
    df["total_revenue"] = pd.to_numeric(_series_or_default("total_revenue", 0), errors="coerce")
    mask = df["total_revenue"].isna() | (df["total_revenue"] == 0)
    df.loc[mask, "total_revenue"] = df.loc[mask, "unit_price"] * df.loc[mask, "quantity"]
    if "category" not in df.columns:
        df["category"] = "Lainnya"
    df = df.dropna(subset=["date", "item_name"])

    records = []
    for row in df.to_dict(orient="records"):
        # _collected = str(row.get("collected_by", "") or "").strip()
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
            # collected_by=_collected or None,
            upload_batch=batch_id,
            source_format="simple",
        ))
    return records


# ─── File Reader ──────────────────────────────────────────────────────────────

def _read_file_bytes(content: bytes, filename: str) -> pd.DataFrame:
    name = (filename or "").lower()
    if name.endswith(".csv"):
        # Try different encodings
        for enc in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
            try:
                return pd.read_csv(io.BytesIO(content), encoding=enc, on_bad_lines="skip", low_memory=False)
            except Exception:
                continue
        raise HTTPException(status_code=400, detail="Tidak bisa membaca file CSV")
    elif name.endswith((".xlsx", ".xls")):
        return pd.read_excel(io.BytesIO(content))
    else:
        raise HTTPException(status_code=400, detail="Format tidak didukung. Gunakan CSV atau Excel (.xlsx/.xls)")


def _guess_content_type(filename: str, fallback: Optional[str]) -> str:
    if fallback:
        return fallback
    guessed = mimetypes.guess_type(filename or "")[0]
    return guessed or "application/octet-stream"


def _upload_to_storage(
    content: bytes,
    filename: str,
    content_type: str,
    cafe_id: int,
    batch_id: str,
) -> tuple[str, str]:
    buckets = get_bucket_names()
    bucket = buckets["uploads"]
    safe_name = sanitize_filename(filename or "upload.csv")
    path = f"cafe_{cafe_id}/uploads/{batch_id}/{safe_name}"
    upload_bytes(bucket, path, content, content_type)
    return bucket, path


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
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("superadmin", "cafe_owner", "cafe_staff"):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    apply_rate_limit(request, str(current_user.id), prefix="upload")
    cafe_id = current_user.cafe_id
    if not cafe_id:
        raise HTTPException(status_code=400, detail="User belum terhubung ke cafe manapun. Hubungi admin.")

    content = file.file.read()
    if not content:
        raise HTTPException(status_code=400, detail="File kosong atau tidak terbaca")
    if len(content) > MAX_UPLOAD_BYTES:
        max_label = int(MAX_UPLOAD_MB) if MAX_UPLOAD_MB.is_integer() else MAX_UPLOAD_MB
        raise HTTPException(status_code=413, detail=f"File terlalu besar. Maks {max_label} MB")

    df = _read_file_bytes(content, file.filename or "")
    if df.empty:
        raise HTTPException(status_code=400, detail="File kosong atau tidak terbaca")
    fmt = _detect_format(df)
    if fmt not in ("moka", "simple"):
        raise HTTPException(
            status_code=400,
            detail=(
                "Format file tidak dikenali. Gunakan:\n"
                "1. Export Moka POS (kolom: Date, Time, Gross Sales, Items, ...)\n"
                "2. Template CafeMargin (kolom: date, item_name, unit_price, hpp, ...)\n"
                "Download template dari tombol di bawah."
            )
        )
    batch_id = str(uuid.uuid4())[:8]
    content_type = _guess_content_type(file.filename or "", file.content_type)
    storage_bucket = None
    storage_path = None
    storage_error = None
    try:
        storage_bucket, storage_path = _upload_to_storage(
            content=content,
            filename=file.filename or "",
            content_type=content_type,
            cafe_id=cafe_id,
            batch_id=batch_id,
        )
    except Exception as exc:
        # Do not block imports if storage is not configured or temporarily unavailable.
        storage_error = f"Gagal menyimpan file ke storage: {exc}"

    if fmt == "moka":
        records, unmatched = _process_moka(df, cafe_id, batch_id, db)
        if not records:
            raise HTTPException(
                status_code=400,
                detail="Tidak ada transaksi yang bisa diproses. Pastikan kolom Items dan Date terisi."
            )
        try:
            db.bulk_save_objects(records)
            db.commit()
        except Exception as exc:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Gagal menyimpan transaksi: {exc}")
        new_items = _auto_create_menu_items(records, cafe_id, db)
        storage_info = {}
        if storage_bucket and storage_path:
            storage_info["bucket"] = storage_bucket
            storage_info["path"] = storage_path
            try:
                asset = StorageAsset(
                    cafe_id=cafe_id,
                    user_id=current_user.id,
                    kind="upload",
                    bucket=storage_bucket,
                    path=storage_path,
                    content_type=content_type,
                    size_bytes=len(content),
                    original_filename=file.filename,
                    upload_batch=batch_id,
                )
                db.add(asset)
                db.commit()
                db.refresh(asset)
                storage_info["asset_id"] = asset.id
            except Exception as exc:
                db.rollback()
                storage_info["error"] = f"Gagal menyimpan metadata storage: {exc}"
        if storage_error:
            storage_info["error"] = storage_error
        result = {
            "message": f"Berhasil mengimport {len(records)} item transaksi dari {file.filename}",
            "format_detected": "Moka POS",
            "batch_id": batch_id,
            "rows_imported": len(records),
            "storage": storage_info,
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
        if not records:
            raise HTTPException(status_code=400, detail="Tidak ada transaksi valid di file ini")
        try:
            db.bulk_save_objects(records)
            db.commit()
        except Exception as exc:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Gagal menyimpan transaksi: {exc}")
        new_items = _auto_create_menu_items(records, cafe_id, db)
        storage_info = {}
        if storage_bucket and storage_path:
            storage_info["bucket"] = storage_bucket
            storage_info["path"] = storage_path
            try:
                asset = StorageAsset(
                    cafe_id=cafe_id,
                    user_id=current_user.id,
                    kind="upload",
                    bucket=storage_bucket,
                    path=storage_path,
                    content_type=content_type,
                    size_bytes=len(content),
                    original_filename=file.filename,
                    upload_batch=batch_id,
                )
                db.add(asset)
                db.commit()
                db.refresh(asset)
                storage_info["asset_id"] = asset.id
            except Exception as exc:
                db.rollback()
                storage_info["error"] = f"Gagal menyimpan metadata storage: {exc}"
        if storage_error:
            storage_info["error"] = storage_error
        result = {
            "message": f"Berhasil mengimport {len(records)} transaksi",
            "format_detected": "Simple (CafeMargin)",
            "batch_id": batch_id,
            "rows_imported": len(records),
            "storage": storage_info,
        }
        if new_items:
            result["new_menu_items"] = len(new_items)
            result["info"] = (
                f"{len(new_items)} item baru otomatis ditambahkan ke daftar menu. "
                "Anda bisa mengatur HPP di halaman Settings → Menu."
            )
        return result


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
    limit: int = Query(500, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    start_date: str = Query(None, description="Tanggal mulai (YYYY-MM-DD)", alias="start_date"),
    end_date: str = Query(None, description="Tanggal akhir (YYYY-MM-DD)", alias="end_date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {"transactions": [], "total": 0}

    # Jika user memilih custom range, gunakan itu
    if start_date and end_date:
        try:
            start_date_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_date_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        except Exception:
            raise HTTPException(status_code=400, detail="Format tanggal salah. Gunakan YYYY-MM-DD.")
    else:
        start_date_dt, end_date_dt = get_effective_date_range(db, cafe_id, period_days)

    q = db.query(Transaction).filter(
        Transaction.cafe_id == cafe_id,
        Transaction.date >= start_date_dt,
        Transaction.date <= end_date_dt,
    )
    if item_name:
        q = q.filter(Transaction.item_name.ilike(f"%{item_name}%"))
    if category:
        q = q.filter(Transaction.category == category)

    transactions = (
        q.order_by(Transaction.date.desc(), Transaction.hour.desc())
        .offset(offset)
        .limit(limit + 1)
        .all()
    )
    has_more = len(transactions) > limit
    if has_more:
        transactions = transactions[:limit]
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
        "limit": limit,
        "offset": offset,
        "has_more": has_more,
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
    cafe_id = current_user.cafe_id
    if not cafe_id:
        raise HTTPException(status_code=400, detail="User belum terhubung ke cafe manapun")
    deleted = db.query(Transaction).filter(
        Transaction.cafe_id == cafe_id,
        Transaction.upload_batch == batch_id,
    ).delete()
    db.commit()
    logger.info("Batch %s dihapus oleh user %s (cafe_id=%s, rows=%s)", batch_id, current_user.email, cafe_id, deleted)
    return {"deleted": deleted}
