from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.department import DepartmentStatus


class DepartmentCreate(BaseModel):
    department_code: str
    department_name: str


class DepartmentUpdate(BaseModel):
    department_name: Optional[str] = None
    status: Optional[DepartmentStatus] = None


class DepartmentResponse(BaseModel):
    id: int
    department_code: str
    department_name: str
    status: DepartmentStatus
    created_at: datetime

    model_config = {"from_attributes": True}
