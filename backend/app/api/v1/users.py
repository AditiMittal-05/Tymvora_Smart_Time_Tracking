import math
from fastapi import APIRouter, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel as _BM
from app.database.session import get_db
from app.api.deps import get_current_active_user
from app.core.permissions import require_super_admin
from app.services.email_service import send_welcome_email
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, UserDropdown,
    UserManagerUpdate, UserApproverToggle, OrgNodeResponse,
)
from app.schemas.common import PaginatedResponse
from app.services.user_service import UserService
from app.models.user import UserRole, UserStatus

router = APIRouter(prefix="/users", tags=["User Management"])


@router.get("", response_model=PaginatedResponse)
def list_users(
    search: Optional[str] = Query(None),
    role: Optional[UserRole] = Query(None),
    status: Optional[UserStatus] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    items, total = UserService(db).search(
        search, role, status, page, page_size, exclude_super_admin=False
    )
    return PaginatedResponse(
        items=[UserResponse.model_validate(u) for u in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if page_size else 1,
    )


@router.post("", response_model=UserResponse, status_code=201)
def create_user(
    body: UserCreate,
    background_tasks: BackgroundTasks,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    user, password = UserService(db).create(body, created_by=current_user.id, actor_role=current_user.role)
    background_tasks.add_task(send_welcome_email, user.email, user.full_name, password)
    return UserResponse.model_validate(user)


@router.get("/dropdown", response_model=list[UserDropdown])
def user_dropdown(
    _=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return UserService(db).get_dropdown()


@router.get("/org-tree", response_model=list[OrgNodeResponse])
def org_tree(
    _=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    users = UserService(db).get_org_tree()
    result = []
    for u in users:
        node = OrgNodeResponse.model_validate(u)
        node.direct_report_count = len(u.direct_reports)
        result.append(node)
    return result


@router.get("/approvers", response_model=list[OrgNodeResponse])
def list_approvers(
    _=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    users = UserService(db).get_approvers()
    result = []
    for u in users:
        node = OrgNodeResponse.model_validate(u)
        node.direct_report_count = len(u.direct_reports)
        result.append(node)
    return result


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    return UserResponse.model_validate(UserService(db).get_detail(user_id))


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    body: UserUpdate,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    user = UserService(db).update(user_id, body, updated_by=current_user.id, actor_role=current_user.role)
    return UserResponse.model_validate(user)


@router.put("/{user_id}/manager", response_model=UserResponse)
def set_manager(
    user_id: int,
    body: UserManagerUpdate,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    user = UserService(db).set_manager(user_id, body.manager_id, updated_by=current_user.id)
    return UserResponse.model_validate(user)


@router.patch("/{user_id}/toggle-approver", response_model=UserResponse)
def toggle_approver(
    user_id: int,
    body: UserApproverToggle,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    user = UserService(db).toggle_approver(user_id, body.can_approve_timesheets, updated_by=current_user.id)
    return UserResponse.model_validate(user)


@router.patch("/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    UserService(db).toggle_status(user_id, UserStatus.INACTIVE, updated_by=current_user.id)
    return {"message": "User deactivated"}


@router.patch("/{user_id}/activate")
def activate_user(
    user_id: int,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    UserService(db).toggle_status(user_id, UserStatus.ACTIVE, updated_by=current_user.id)
    return {"message": "User activated"}


class ProjectAssignmentBody(_BM):
    project_ids: list[int]


@router.get("/{user_id}/projects")
def get_user_projects(
    user_id: int,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    user = UserService(db).get_detail(user_id)
    return [{"id": p.id, "project_name": p.project_name, "project_code": p.project_code} for p in user.assigned_projects]


@router.post("/{user_id}/projects")
def assign_projects(
    user_id: int,
    body: ProjectAssignmentBody,
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    UserService(db).assign_projects(user_id, body.project_ids, updated_by=current_user.id)
    return {"message": "Projects assigned successfully"}
