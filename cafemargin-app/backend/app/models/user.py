from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="cafe_owner")  # superadmin | cafe_owner | cafe_staff
    cafe_id = Column(Integer, ForeignKey("cafes.id"), nullable=True)
    preferred_lang = Column(String, default="id")  # id | en
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    cafe = relationship("Cafe", back_populates="users")
