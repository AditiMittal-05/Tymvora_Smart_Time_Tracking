from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.designation import DesignationStatus


class DesignationCreate(BaseModel):
    designation_code: str
    designation_name: str


class DesignationUpdate(BaseModel):
    designation_name: Optional[str] = None
    status: Optional[DesignationStatus] = None


class DesignationResponse(BaseModel):
    id: int
    designation_code: str
    designation_name: str
    status: DesignationStatus
    created_at: datetime

    model_config = {"from_attributes": True}
