from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class ActionPlan(Base):
    __tablename__ = "action_plans"
    __table_args__ = (
        Index("ix_action_plan_cafe_due", "cafe_id", "due_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    cafe_id = Column(Integer, ForeignKey("cafes.id"), nullable=False)
    action_text = Column(String, nullable=False)
    status = Column(String, default="todo")  # todo | in_progress | done
    due_date = Column(Date, nullable=True)
    assignee = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    cafe = relationship("Cafe", back_populates="action_plans")


class KPITarget(Base):
    __tablename__ = "kpi_targets"
    __table_args__ = (
        Index("ix_kpi_target_cafe_metric", "cafe_id", "metric_name"),
    )

    id = Column(Integer, primary_key=True, index=True)
    cafe_id = Column(Integer, ForeignKey("cafes.id"), nullable=False)
    metric_name = Column(String, nullable=False)
    target_value = Column(Float, nullable=False)
    actual_value = Column(Float, nullable=True)
    period_start = Column(Date, nullable=True)
    period_end = Column(Date, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    cafe = relationship("Cafe", back_populates="kpi_targets")
