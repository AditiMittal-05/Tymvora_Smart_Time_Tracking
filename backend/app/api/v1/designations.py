from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.api.deps import get_current_active_user
from app.core.permissions import require_super_admin
from app.schemas.designation import DesignationCreate, DesignationUpdate, DesignationResponse
from app.schemas.common import PaginatedResponse
from app.services.designation_service import DesignationService
from app.models.designation import DesignationStatus

router = APIRouter(prefix="/designations", tags=["Designation Master"])


@router.get("", response_model=PaginatedResponse)
def list_designations(
    search: Optional[str] = Query(None),
    status: Optional[DesignationStatus] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
    _=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    items, total = DesignationService(db).search(search, status, page, page_size)
    return PaginatedResponse(
        items=[DesignationResponse.model_validate(d) for d in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/all-active", response_model=list[DesignationResponse])
def all_active(
    _=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return [DesignationResponse.model_validate(d) for d in DesignationService(db).get_all_active()]


@router.post("", response_model=DesignationResponse, status_code=201)
def create_designation(
    body: DesignationCreate,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    return DesignationResponse.model_validate(DesignationService(db).create(body, created_by=current_user.id))


@router.put("/{id}", response_model=DesignationResponse)
def update_designation(
    id: int,
    body: DesignationUpdate,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    return DesignationResponse.model_validate(DesignationService(db).update(id, body, updated_by=current_user.id))


@router.patch("/{id}/deactivate")
def deactivate_designation(
    id: int,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    DesignationService(db).toggle_status(id, DesignationStatus.INACTIVE, updated_by=current_user.id)
    return {"message": "Designation deactivated"}


@router.patch("/{id}/activate")
def activate_designation(
    id: int,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    DesignationService(db).toggle_status(id, DesignationStatus.ACTIVE, updated_by=current_user.id)
    return {"message": "Designation activated"}
