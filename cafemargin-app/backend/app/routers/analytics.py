from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.services.analytics_engine import process_transactions
from app.services.transaction_loader import load_transactions_df

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview")
def analytics_overview(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = load_transactions_df(db, cafe_id, period_days, include_payment=True, include_receipt=True)
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
    df = load_transactions_df(db, cafe_id, period_days, include_payment=True, include_receipt=True)
    include = {
        "summary",
        "revenue_by_date",
        "revenue_by_hour",
        "revenue_by_day_of_week",
        "category_breakdown",
        "payment_method_breakdown",
        "revenue_by_month",
        "revenue_by_week",
    }
    return process_transactions(df, include=include)


@router.get("/margin")
def margin_analytics(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = load_transactions_df(db, cafe_id, period_days, include_payment=True)
    include = {"margin_snapshot", "margin_by_item", "top_leakages"}
    return process_transactions(df, include=include)


@router.get("/menu-matrix")
def menu_matrix_analytics(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = load_transactions_df(db, cafe_id, period_days, include_payment=True)
    include = {
        "menu_matrix",
        "top_items_by_revenue",
        "top_items_by_qty",
        "category_breakdown",
        "category_contribution",
    }
    return process_transactions(df, include=include)


@router.get("/purchase-behavior")
def purchase_behavior(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = load_transactions_df(db, cafe_id, period_days, include_payment=True, include_receipt=True)
    include = {"purchase_behavior", "summary"}
    return process_transactions(df, include=include)


@router.get("/peak-hours")
def peak_hours_analytics(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = load_transactions_df(db, cafe_id, period_days, include_payment=True)
    include = {
        "revenue_by_hour",
        "revenue_by_day_of_week",
        "golden_hours",
        "dead_hours",
        "summary",
    }
    return process_transactions(df, include=include)
