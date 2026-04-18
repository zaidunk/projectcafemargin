from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.auth import require_cafe_access
from app.models.storage_asset import StorageAsset
from app.models.user import User
from app.services.storage_service import create_signed_url, get_default_signed_url_ttl

router = APIRouter(prefix="/api/storage", tags=["storage"])


def _asset_to_dict(asset: StorageAsset) -> dict:
    return {
        "id": asset.id,
        "kind": asset.kind,
        "bucket": asset.bucket,
        "path": asset.path,
        "content_type": asset.content_type,
        "size_bytes": asset.size_bytes,
        "original_filename": asset.original_filename,
        "upload_batch": asset.upload_batch,
        "created_at": asset.created_at.isoformat() if asset.created_at else None,
    }


@router.get("/assets")
def list_assets(
    kind: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_cafe_access),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        raise HTTPException(status_code=400, detail="User belum terhubung ke cafe manapun")

    query = db.query(StorageAsset).filter(StorageAsset.cafe_id == cafe_id)
    if kind:
        query = query.filter(StorageAsset.kind == kind)
    assets = query.order_by(StorageAsset.created_at.desc()).limit(limit).all()
    return {"assets": [_asset_to_dict(asset) for asset in assets]}


@router.get("/assets/{asset_id}/signed-url")
def get_asset_signed_url(
    asset_id: int,
    expires_in: int = Query(0, ge=0, le=86400),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_cafe_access),
):
    cafe_id = current_user.cafe_id
    if not cafe_id:
        raise HTTPException(status_code=400, detail="User belum terhubung ke cafe manapun")

    asset = db.query(StorageAsset).filter(
        StorageAsset.id == asset_id,
        StorageAsset.cafe_id == cafe_id,
    ).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset tidak ditemukan")

    ttl = expires_in or get_default_signed_url_ttl()
    try:
        signed_url = create_signed_url(asset.bucket, asset.path, ttl)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Gagal membuat signed URL: {exc}")

    return {"signed_url": signed_url, "expires_in": ttl}
