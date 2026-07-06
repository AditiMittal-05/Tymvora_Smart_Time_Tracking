from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.api.deps import get_current_active_user
from app.core.permissions import require_super_admin
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.schemas.common import PaginatedResponse
from app.services.department_service import DepartmentService
from app.models.department import DepartmentStatus

router = APIRouter(prefix="/departments", tags=["Department Master"])


@router.get("", response_model=PaginatedResponse)
def list_departments(
    search: Optional[str] = Query(None),
    status: Optional[DepartmentStatus] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    _=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    items, total = DepartmentService(db).search(search, status, page, page_size)
    return PaginatedResponse(
        items=[DepartmentResponse.model_validate(d) for d in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/all-active", response_model=list[DepartmentResponse])
def all_active(
    _=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return [DepartmentResponse.model_validate(d) for d in DepartmentService(db).get_all_active()]


@router.post("", response_model=DepartmentResponse, status_code=201)
def create_department(
    body: DepartmentCreate,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    return DepartmentResponse.model_validate(DepartmentService(db).create(body, created_by=current_user.id))


@router.put("/{id}", response_model=DepartmentResponse)
def update_department(
    id: int,
    body: DepartmentUpdate,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    return DepartmentResponse.model_validate(DepartmentService(db).update(id, body, updated_by=current_user.id))


@router.patch("/{id}/deactivate")
def deactivate_department(
    id: int,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    DepartmentService(db).toggle_status(id, DepartmentStatus.INACTIVE, updated_by=current_user.id)
    return {"message": "Department deactivated"}


@router.patch("/{id}/activate")
def activate_department(
    id: int,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    DepartmentService(db).toggle_status(id, DepartmentStatus.ACTIVE, updated_by=current_user.id)
    return {"message": "Department activated"}
