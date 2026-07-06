from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_active_user
from app.core.permissions import require_approver, require_super_admin
from app.schemas.dashboard import EmployeeDashboard, ApproverDashboard
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/employee", response_model=EmployeeDashboard)
def employee_dashboard(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    return DashboardService(db).get_employee_dashboard(current_user.id)


@router.get("/super-admin", response_model=ApproverDashboard)
def super_admin_dashboard(
    current_user=Depends(require_super_admin()),
    db: Session = Depends(get_db),
):
    # approver_id=None → no scoping, returns data across all employees
    return DashboardService(db).get_approver_dashboard(approver_id=None)


@router.get("/approver", response_model=ApproverDashboard)
def approver_dashboard(
    current_user=Depends(require_approver()),
    db: Session = Depends(get_db),
):
    # Scoped to this manager's direct reports only
    return DashboardService(db).get_approver_dashboard(approver_id=current_user.id)
