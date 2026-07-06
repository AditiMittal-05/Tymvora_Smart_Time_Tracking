from sqlalchemy import Table, Column, Integer, ForeignKey, DateTime, func
from app.database.base import Base

user_project_table = Table(
    "user_project_assignment",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("user_master.id", ondelete="CASCADE"), primary_key=True),
    Column("project_id", Integer, ForeignKey("project_master.id", ondelete="CASCADE"), primary_key=True),
    Column("assigned_at", DateTime, server_default=func.now()),
)
