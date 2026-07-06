from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundException, BusinessRuleException, PermissionDeniedException
from app.repositories.timesheet_repository import TimesheetHeaderRepository
from app.repositories.approval_repository import ApprovalRepository
from app.models.timesheet_header import TimesheetHeader, TimesheetStatus
from app.models.approval_history import ApprovalAction
from app.models.user import UserRole


class ApprovalService:
    def __init__(self, db: Session):
        self.header_repo = TimesheetHeaderRepository(db)
        self.approval_repo = ApprovalRepository(db)
        self.db = db

    def _get_header(self, header_id: int) -> TimesheetHeader:
        h = self.header_repo.get(header_id)
        if not h or h.is_deleted:
            raise NotFoundException("Timesheet not found")
        return h

    def _check_approver_scope(self, header: TimesheetHeader, approver_id: int) -> None:
        """Verify the approver is the direct manager of the timesheet's employee."""
        from app.models.user import User
        employee = self.db.query(User).filter(User.id == header.employee_id).first()
        if not employee or employee.manager_id != approver_id:
            raise PermissionDeniedException(
                "You can only act on timesheets submitted by your direct reports."
            )

    def approve(self, header_id: int, approver_id: int, comment: Optional[str]) -> TimesheetHeader:
        header = self._get_header(header_id)
        self._check_approver_scope(header, approver_id)
        if header.status not in [TimesheetStatus.SUBMITTED, TimesheetStatus.RESUBMITTED]:
            raise BusinessRuleException("Only submitted timesheets can be approved")
        prev = header.status.value
        header.status = TimesheetStatus.APPROVED
        header.approved_by = approver_id
        header.approved_at = datetime.now(timezone.utc)
        header.is_locked = True
        header.updated_by = approver_id
        self.db.commit()
        self.approval_repo.create_entry(header_id, approver_id, ApprovalAction.APPROVE,
                                        comment, prev, TimesheetStatus.APPROVED.value)
        self.db.refresh(header)
        return header

    def reject(self, header_id: int, approver_id: int, comment: str) -> TimesheetHeader:
        if not comment or not comment.strip():
            raise BusinessRuleException("Rejection comment is mandatory")
        header = self._get_header(header_id)
        self._check_approver_scope(header, approver_id)
        if header.status not in [TimesheetStatus.SUBMITTED, TimesheetStatus.RESUBMITTED]:
            raise BusinessRuleException("Only submitted timesheets can be rejected")
        prev = header.status.value
        header.status = TimesheetStatus.REJECTED
        header.rejected_by = approver_id
        header.rejection_reason = comment
        header.is_locked = False
        header.updated_by = approver_id
        self.db.commit()
        self.approval_repo.create_entry(header_id, approver_id, ApprovalAction.REJECT,
                                        comment, prev, TimesheetStatus.REJECTED.value)
        self.db.refresh(header)
        return header

    def unlock(self, header_id: int, approver_id: int, comment: Optional[str]) -> TimesheetHeader:
        header = self._get_header(header_id)
        self._check_approver_scope(header, approver_id)
        if header.status != TimesheetStatus.APPROVED:
            raise BusinessRuleException("Only approved timesheets can be unlocked")
        header.is_locked = False
        header.status = TimesheetStatus.DRAFT
        header.updated_by = approver_id
        self.db.commit()
        self.approval_repo.create_entry(header_id, approver_id, ApprovalAction.UNLOCK,
                                        comment, TimesheetStatus.APPROVED.value, TimesheetStatus.DRAFT.value)
        self.db.refresh(header)
        return header

    def approve_week(self, week_start_date, approver_id: int) -> list[TimesheetHeader]:
        """Approve all submitted timesheets for a given week for the approver's direct reports."""
        from datetime import datetime, timezone
        from app.models.user import User
        headers = self.db.query(TimesheetHeader).join(
            User, TimesheetHeader.employee_id == User.id
        ).filter(
            TimesheetHeader.week_start_date == week_start_date,
            TimesheetHeader.status.in_([TimesheetStatus.SUBMITTED, TimesheetStatus.RESUBMITTED]),
            TimesheetHeader.is_deleted == False,
            User.manager_id == approver_id,
        ).all()
        now = datetime.now(timezone.utc)
        approved = []
        for header in headers:
            prev = header.status.value
            header.status = TimesheetStatus.APPROVED
            header.approved_by = approver_id
            header.approved_at = now
            header.is_locked = True
            header.updated_by = approver_id
            self.approval_repo.create_entry(
                header.id, approver_id, ApprovalAction.APPROVE,
                "Batch approved for week", prev, TimesheetStatus.APPROVED.value
            )
            approved.append(header)
        self.db.commit()
        for h in approved:
            self.db.refresh(h)
        return approved

    def get_pending(self, page: int = 1, page_size: int = 20,
                    manager_id: Optional[int] = None) -> tuple:
        return self.header_repo.get_pending_approvals(page, page_size, manager_id=manager_id)

    def get_thread(self, header_id: int):
        return self.approval_repo.get_thread(header_id)
