from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from datetime import datetime, timezone
from app.database import Base


class StorageAsset(Base):
    __tablename__ = "storage_assets"
    __table_args__ = (
        Index("ix_storage_cafe_kind_created", "cafe_id", "kind", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    cafe_id = Column(Integer, ForeignKey("cafes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    kind = Column(String, nullable=False)  # upload | report | model
    bucket = Column(String, nullable=False)
    path = Column(String, nullable=False, index=True)
    content_type = Column(String, nullable=True)
    size_bytes = Column(Integer, nullable=True)
    original_filename = Column(String, nullable=True)
    upload_batch = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
