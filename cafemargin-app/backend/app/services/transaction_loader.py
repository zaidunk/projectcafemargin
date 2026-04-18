from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
import pandas as pd
from app.models.transaction import Transaction


def get_effective_date_range(db: Session, cafe_id: int, period_days: int) -> tuple[date, date]:
    max_date = db.query(func.max(Transaction.date)).filter(
        Transaction.cafe_id == cafe_id,
    ).scalar()
    today = date.today()
    if max_date:
        end_date = today if max_date > today else max_date
    else:
        end_date = today
    start_date = end_date - timedelta(days=period_days)
    return start_date, end_date


def load_transactions_df(
    db: Session,
    cafe_id: int,
    period_days: int,
    include_payment: bool = True,
    include_receipt: bool = False,
    include_discounts: bool = False,
    include_gross_sales: bool = False,
    include_collected_by: bool = False,
) -> pd.DataFrame:
    start_date, end_date = get_effective_date_range(db, cafe_id, period_days)
    columns = [
        Transaction.id,
        Transaction.date,
        Transaction.hour,
        Transaction.item_name,
        Transaction.category,
        Transaction.quantity,
        Transaction.unit_price,
        Transaction.hpp,
        Transaction.total_revenue,
    ]
    if include_gross_sales:
        columns.append(Transaction.gross_sales)
    if include_discounts:
        columns.append(Transaction.discount)
    if include_payment:
        columns.append(Transaction.payment_method)
    if include_receipt:
        columns.append(Transaction.receipt_number)
    # if include_collected_by:
    #     columns.append(Transaction.collected_by)

    rows = db.query(*columns).filter(
        Transaction.cafe_id == cafe_id,
        Transaction.date >= start_date,
        Transaction.date <= end_date,
    ).all()
    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows, columns=[c.key for c in columns])
    if "category" in df.columns:
        df["category"] = df["category"].fillna("Lainnya")
    if "payment_method" in df.columns:
        df["payment_method"] = df["payment_method"].fillna("")
    if "receipt_number" in df.columns:
        df["receipt_number"] = df["receipt_number"].fillna("")
    if "gross_sales" in df.columns:
        df["gross_sales"] = df["gross_sales"].fillna(0)
    if "discount" in df.columns:
        df["discount"] = df["discount"].fillna(0)
    if "collected_by" in df.columns:
        df["collected_by"] = df["collected_by"].fillna("")

    return df
