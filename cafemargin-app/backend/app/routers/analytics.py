from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
import pandas as pd
from app.database import get_db
from app.models.transaction import Transaction
from app.auth import get_current_user
from app.models.user import User
from app.services.analytics_engine import process_transactions

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _get_transactions_df(cafe_id: int, period_days: int, db: Session) -> pd.DataFrame:
    start_date = date.today() - timedelta(days=period_days)
    transactions = db.query(Transaction).filter(
        Transaction.cafe_id == cafe_id,
        Transaction.date >= start_date,
    ).all()
    if not transactions:
        return pd.DataFrame()
    return pd.DataFrame([
        {
            "id": t.id,
            "date": t.date,
            "hour": t.hour,
            "item_name": t.item_name,
            "category": t.category or "Lainnya",
            "quantity": t.quantity,
            "unit_price": t.unit_price,
            "hpp": t.hpp,
            "total_revenue": t.total_revenue,
            "payment_method": t.payment_method or "",
        }
        for t in transactions
    ])


@router.get("/overview")
def analytics_overview(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = _get_transactions_df(cafe_id, period_days, db)
    return process_transactions(df)


@router.get("/revenue")
def revenue_analytics(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = _get_transactions_df(cafe_id, period_days, db)
    result = process_transactions(df)
    return {
        "summary": result["summary"],
        "revenue_by_date": result["revenue_by_date"],
        "revenue_by_hour": result["revenue_by_hour"],
        "revenue_by_day_of_week": result["revenue_by_day_of_week"],
        "category_breakdown": result["category_breakdown"],
        "payment_method_breakdown": result["payment_method_breakdown"],
    }


@router.get("/margin")
def margin_analytics(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = _get_transactions_df(cafe_id, period_days, db)
    result = process_transactions(df)
    return {
        "margin_snapshot": result["margin_snapshot"],
        "margin_by_item": result["margin_by_item"],
        "top_leakages": result["top_leakages"],
    }


@router.get("/menu-matrix")
def menu_matrix_analytics(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = _get_transactions_df(cafe_id, period_days, db)
    result = process_transactions(df)
    return {
        "menu_matrix": result["menu_matrix"],
        "top_items_by_revenue": result["top_items_by_revenue"],
        "top_items_by_qty": result["top_items_by_qty"],
        "category_breakdown": result["category_breakdown"],
    }


@router.get("/peak-hours")
def peak_hours_analytics(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = _get_transactions_df(cafe_id, period_days, db)
    result = process_transactions(df)
    return {
        "revenue_by_hour": result["revenue_by_hour"],
        "revenue_by_day_of_week": result["revenue_by_day_of_week"],
        "golden_hours": result["golden_hours"],
        "dead_hours": result["dead_hours"],
        "summary": result["summary"],
    }
