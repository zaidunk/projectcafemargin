from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class Cafe(Base):
    __tablename__ = "cafes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_name = Column(String, nullable=False)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    subscription_level = Column(Integer, default=1)  # 1=Diagnostic, 2=Growth, 3=Control, 4=Scale
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    users = relationship("User", back_populates="cafe")
    transactions = relationship("Transaction", back_populates="cafe")
    menu_items = relationship("MenuItem", back_populates="cafe")
    action_plans = relationship("ActionPlan", back_populates="cafe")
    kpi_targets = relationship("KPITarget", back_populates="cafe")
