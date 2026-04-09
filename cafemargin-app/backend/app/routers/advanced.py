"""
Advanced Analytics & ML Endpoints
Pages 10-20 of CafeMargin
"""
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
import pandas as pd
from app.database import get_db
from app.models.transaction import Transaction
from app.auth import get_current_user
from app.models.user import User
from app.services.ml_engine import (
    forecast_revenue, analyze_discounts, analyze_staff,
    analyze_baskets, detect_anomalies, compare_periods,
    analyze_customers, analyze_payments, forecast_inventory,
    simulate_promo, optimize_menu,
)

router = APIRouter(prefix="/api/advanced", tags=["advanced-analytics"])


def _get_df(cafe_id: int, period_days: int, db: Session) -> pd.DataFrame:
    start_date = date.today() - timedelta(days=period_days)
    txs = db.query(Transaction).filter(
        Transaction.cafe_id == cafe_id,
        Transaction.date >= start_date,
    ).all()
    if not txs:
        return pd.DataFrame()
    return pd.DataFrame([
        {
            "id": t.id, "date": t.date, "hour": t.hour,
            "item_name": t.item_name, "category": t.category or "Lainnya",
            "quantity": t.quantity, "unit_price": t.unit_price,
            "hpp": t.hpp, "total_revenue": t.total_revenue,
            "gross_sales": t.gross_sales or 0, "discount": t.discount or 0,
            "payment_method": t.payment_method or "",
            "receipt_number": t.receipt_number or "",
            "collected_by": "",  # Moka doesn't always have this parsed
        }
        for t in txs
    ])


def _get_full_df(cafe_id: int, period_days: int, db: Session) -> pd.DataFrame:
    """Get full df including collected_by from raw Moka data if available."""
    start_date = date.today() - timedelta(days=period_days)
    txs = db.query(Transaction).filter(
        Transaction.cafe_id == cafe_id,
        Transaction.date >= start_date,
    ).all()
    if not txs:
        return pd.DataFrame()
    return pd.DataFrame([
        {
            "id": t.id, "date": t.date, "hour": t.hour,
            "item_name": t.item_name, "category": t.category or "Lainnya",
            "quantity": t.quantity, "unit_price": t.unit_price,
            "hpp": t.hpp, "total_revenue": t.total_revenue,
            "gross_sales": t.gross_sales or 0, "discount": t.discount or 0,
            "payment_method": t.payment_method or "",
            "receipt_number": t.receipt_number or "",
        }
        for t in txs
    ])


# ─── Page 10: Revenue Forecast ───────────────────────────────────────────────

@router.get("/forecast")
def revenue_forecast(
    period_days: int = Query(90, le=9999),
    forecast_days: int = Query(7, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = _get_df(cafe_id, period_days, db)
    return forecast_revenue(df, forecast_days)


# ─── Page 11: Discount Analysis ──────────────────────────────────────────────

@router.get("/discounts")
def discount_analysis(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = _get_full_df(cafe_id, period_days, db)
    return analyze_discounts(df)


# ─── Page 12: Staff Performance ──────────────────────────────────────────────

@router.get("/staff")
def staff_performance(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = _get_full_df(cafe_id, period_days, db)
    return analyze_staff(df)


# ─── Page 13: Basket Analysis ────────────────────────────────────────────────

@router.get("/baskets")
def basket_analysis(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = _get_full_df(cafe_id, period_days, db)
    return analyze_baskets(df)


# ─── Page 14: Anomaly Detection ──────────────────────────────────────────────

@router.get("/anomalies")
def anomaly_detection(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = _get_full_df(cafe_id, period_days, db)
    return detect_anomalies(df)


# ─── Page 15: Sales Comparison ───────────────────────────────────────────────

@router.get("/comparison")
def sales_comparison(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    # Get double the period to compare current vs previous
    df = _get_full_df(cafe_id, period_days * 2, db)
    return compare_periods(df, period_days)


# ─── Page 16: Customer Insights ──────────────────────────────────────────────

@router.get("/customers")
def customer_insights(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = _get_full_df(cafe_id, period_days, db)
    return analyze_customers(df)


# ─── Page 17: Payment Insights ───────────────────────────────────────────────

@router.get("/payments")
def payment_insights(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = _get_full_df(cafe_id, period_days, db)
    return analyze_payments(df)


# ─── Page 18: Inventory Forecast ─────────────────────────────────────────────

@router.get("/inventory")
def inventory_forecast(
    period_days: int = Query(30, le=9999),
    forecast_days: int = Query(7, le=30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = _get_full_df(cafe_id, period_days, db)
    return forecast_inventory(df, forecast_days)


# ─── Page 19: Promo Simulator ────────────────────────────────────────────────

@router.get("/promo-simulator")
def promo_simulator(
    period_days: int = Query(30, le=9999),
    item_name: str = Query(""),
    discount_pct: float = Query(10, ge=0, le=100),
    volume_boost_pct: float = Query(20, ge=0, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = _get_full_df(cafe_id, period_days, db)
    return simulate_promo(df, item_name, discount_pct, volume_boost_pct)


# ─── Page 20: Menu Optimizer ─────────────────────────────────────────────────

@router.get("/menu-optimizer")
def menu_optimizer(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        return {}
    df = _get_full_df(cafe_id, period_days, db)
    return optimize_menu(df)
