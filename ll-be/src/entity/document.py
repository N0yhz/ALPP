from sqlalchemy import String, Boolean, DateTime, func, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from src.entity.base import Base
import uuid

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    is_shared: Mapped[bool] = mapped_column(Boolean, default=False)
    grade: Mapped[str] = mapped_column(String(100), nullable=True)
    subject: Mapped[str] = mapped_column(String(100), nullable=True)
    topic: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
