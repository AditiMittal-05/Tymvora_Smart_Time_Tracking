import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from app.models.user import UserRole, UserStatus

_PHONE_RE = re.compile(r"^(\+?91[\-\s]?)?[6-9]\d{9}$")


def _clean_phone(v: Optional[str]) -> Optional[str]:
    if not v or v.strip() == "":
        return None
    cleaned = v.strip()
    if not _PHONE_RE.match(cleaned.replace(" ", "").replace("-", "")):
        raise ValueError("Enter a valid 10-digit Indian mobile number (e.g. 9876543210 or +91 9876543210)")
    return cleaned


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: UserRole = UserRole.EMPLOYEE
    department: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, v):
        return _clean_phone(v)


class UserCreate(UserBase):
    employee_code: str
    password: str

    @field_validator("password")
    @classmethod
    def strong_password(cls, v):
        from app.schemas.auth import _validate_password_strength
        return _validate_password_strength(v)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[UserStatus] = None

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, v):
        return _clean_phone(v)


class UserManagerUpdate(BaseModel):
    manager_id: Optional[int] = None  # null to remove manager


class UserApproverToggle(BaseModel):
    can_approve_timesheets: bool


class UserResponse(UserBase):
    id: int
    employee_code: str
    status: UserStatus
    profile_pic: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    manager_id: Optional[int] = None
    manager_name: Optional[str] = None
    can_approve_timesheets: bool = False
    assigned_project_ids: list[int] = []

    model_config = {"from_attributes": True}

    @classmethod
    def model_validate(cls, obj, **kwargs):
        instance = super().model_validate(obj, **kwargs)
        if hasattr(obj, "assigned_projects") and obj.assigned_projects is not None:
            instance.assigned_project_ids = [p.id for p in obj.assigned_projects]
        return instance


class UserDropdown(BaseModel):
    id: int
    employee_code: str
    full_name: str

    model_config = {"from_attributes": True}


class OrgNodeResponse(BaseModel):
    id: int
    employee_code: str
    full_name: str
    designation: Optional[str] = None
    department: Optional[str] = None
    status: UserStatus
    manager_id: Optional[int] = None
    manager_name: Optional[str] = None
    can_approve_timesheets: bool = False
    direct_report_count: int = 0

    model_config = {"from_attributes": True}
