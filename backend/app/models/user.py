import enum
from typing import Optional
from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base
from app.models.base_model import AuditMixin


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    EMPLOYEE = "employee"


class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class User(Base, AuditMixin):
    __tablename__ = "user_master"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    employee_code = Column(String(20), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, values_callable=lambda x: [e.value for e in x]),
                  default=UserRole.EMPLOYEE, nullable=False, index=True)
    status = Column(Enum(UserStatus, values_callable=lambda x: [e.value for e in x]),
                    default=UserStatus.ACTIVE, nullable=False, index=True)
    department = Column(String(100), nullable=True)
    designation = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    profile_pic = Column(String(255), nullable=True)
    last_login = Column(DateTime, nullable=True)
    password_reset_token = Column(String(500), nullable=True)
    manager_id = Column(Integer, ForeignKey("user_master.id"), nullable=True)
    can_approve_timesheets = Column(Boolean, default=False, nullable=False)

    # Self-referential hierarchy: many employees → one manager
    manager = relationship(
        "User", foreign_keys=[manager_id],
        back_populates="direct_reports",
        remote_side="User.id",
    )
    direct_reports = relationship(
        "User", foreign_keys=[manager_id],
        back_populates="manager",
    )

    timesheet_headers = relationship(
        "TimesheetHeader", foreign_keys="TimesheetHeader.employee_id", back_populates="employee"
    )
    managed_projects = relationship(
        "Project", foreign_keys="Project.project_manager_id", back_populates="project_manager"
    )
    notifications = relationship(
        "NotificationLog", foreign_keys="NotificationLog.recipient_id", back_populates="recipient"
    )
    assigned_projects = relationship(
        "Project", secondary="user_project_assignment", lazy="select",
    )

    @property
    def manager_name(self) -> Optional[str]:
        return self.manager.full_name if self.manager else None
