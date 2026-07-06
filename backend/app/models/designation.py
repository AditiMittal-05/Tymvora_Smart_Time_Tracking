import enum
from sqlalchemy import Column, Integer, String, Enum
from app.database.base import Base
from app.models.base_model import AuditMixin


class DesignationStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class Designation(Base, AuditMixin):
    __tablename__ = "designation_master"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    designation_code = Column(String(20), unique=True, nullable=False, index=True)
    designation_name = Column(String(100), nullable=False)
    status = Column(
        Enum(DesignationStatus, values_callable=lambda x: [e.value for e in x]),
        default=DesignationStatus.ACTIVE,
        nullable=False,
    )
