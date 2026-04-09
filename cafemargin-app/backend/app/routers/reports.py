from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
import pandas as pd
from app.database import get_db
from app.models.transaction import Transaction
from app.models.cafe import Cafe
from app.auth import get_current_user
from app.models.user import User
from app.services.analytics_engine import process_transactions
from app.services.pdf_generator import generate_executive_summary

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _get_df(cafe_id: int, period_days: int, db: Session) -> pd.DataFrame:
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


@router.get("/executive-summary")
def executive_summary_pdf(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    cafe = db.query(Cafe).filter(Cafe.id == cafe_id).first()
    cafe_name = cafe.name if cafe else "Cafe"

    df = _get_df(cafe_id, period_days, db)
    analytics = process_transactions(df)

    start_date = date.today() - timedelta(days=period_days)
    period_str = f"{start_date.strftime('%d %b %Y')} - {date.today().strftime('%d %b %Y')}"

    pdf_bytes = generate_executive_summary(analytics, cafe_name, period_str)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="executive-summary-cafemargin.pdf"'},
    )
