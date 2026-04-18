from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.cafe import Cafe
from app.models.storage_asset import StorageAsset
from app.auth import get_current_user
from app.models.user import User
from app.services.analytics_engine import process_transactions
from app.services.pdf_generator import generate_executive_summary
from app.services.storage_service import get_bucket_names, sanitize_filename, upload_bytes
from app.services.transaction_loader import load_transactions_df, get_effective_date_range

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/executive-summary")
def executive_summary_pdf(
    period_days: int = Query(30, le=9999),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cafe_id = current_user.cafe_id
    cafe = db.query(Cafe).filter(Cafe.id == cafe_id).first()
    cafe_name = cafe.name if cafe else "Cafe"

    df = load_transactions_df(db, cafe_id, period_days, include_payment=True)
    analytics = process_transactions(df)

    start_date, end_date = get_effective_date_range(db, cafe_id, period_days)
    period_str = f"{start_date.strftime('%d %b %Y')} - {end_date.strftime('%d %b %Y')}"

    pdf_bytes = generate_executive_summary(analytics, cafe_name, period_str)
    bucket = get_bucket_names()["reports"]
    filename = sanitize_filename(
        f"executive-summary-{period_days}d-{end_date.strftime('%Y%m%d')}.pdf"
    )
    path = f"cafe_{cafe_id}/reports/executive-summary/{filename}"
    try:
        upload_bytes(bucket, path, pdf_bytes, "application/pdf")
        try:
            asset = StorageAsset(
                cafe_id=cafe_id,
                user_id=current_user.id,
                kind="report",
                bucket=bucket,
                path=path,
                content_type="application/pdf",
                size_bytes=len(pdf_bytes),
                original_filename=filename,
            )
            db.add(asset)
            db.commit()
        except Exception:
            db.rollback()
    except Exception:
        pass  # Storage not required — still return the PDF to user
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="executive-summary-cafemargin.pdf"'},
    )
