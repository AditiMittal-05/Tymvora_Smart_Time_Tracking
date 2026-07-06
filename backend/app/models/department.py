import enum
from sqlalchemy import Column, Integer, String, Enum
from app.database.base import Base
from app.models.base_model import AuditMixin


class DepartmentStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class Department(Base, AuditMixin):
    __tablename__ = "department_master"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    department_code = Column(String(20), unique=True, nullable=False, index=True)
    department_name = Column(String(100), nullable=False)
    status = Column(
        Enum(DepartmentStatus, values_callable=lambda x: [e.value for e in x]),
        default=DepartmentStatus.ACTIVE,
        nullable=False,
    )
