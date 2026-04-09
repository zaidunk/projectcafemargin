from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    cafe_id = Column(Integer, ForeignKey("cafes.id"), nullable=False)
    date = Column(Date, nullable=False)
    hour = Column(Integer, nullable=False)  # 0-23
    item_name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, nullable=False)
    hpp = Column(Float, default=0.0)
    total_revenue = Column(Float, nullable=False)
    gross_sales = Column(Float, default=0.0)      # before discount
    discount = Column(Float, default=0.0)          # discount amount
    payment_method = Column(String, nullable=True) # QRIS, Cash, GoPay, etc.
    receipt_number = Column(String, nullable=True)
    upload_batch = Column(String, nullable=True)
    source_format = Column(String, default="simple")  # "moka" | "simple"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    cafe = relationship("Cafe", back_populates="transactions")
