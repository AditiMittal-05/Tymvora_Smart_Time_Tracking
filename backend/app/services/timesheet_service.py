from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.exceptions import BusinessRuleException, NotFoundException, PermissionDeniedException
from app.repositories.timesheet_repository import TimesheetHeaderRepository, TimesheetDetailRepository
from app.models.timesheet_header import TimesheetHeader, TimesheetStatus
from app.models.timesheet_detail import TimesheetDetail
from app.schemas.timesheet import TimesheetEntryCreate, TimesheetEntryUpdate, WeeklyGridResponse, WeeklyGridEntry
from app.utils.date_utils import get_week_start_end


def _get_config_value(db: Session, key: str, default: int) -> int:
    from app.models.system_config import SystemConfig
    cfg = db.query(SystemConfig).filter(SystemConfig.config_key == key).first()
    return int(cfg.config_value) if cfg else default


class TimesheetService:
    def __init__(self, db: Session):
        self.header_repo = TimesheetHeaderRepository(db)
        self.detail_repo = TimesheetDetailRepository(db)
        self.db = db

    def _validate_work_date(self, work_date: date, employee_id: int) -> None:
        today = date.today()
        if work_date > today:
            raise BusinessRuleException("Future-dated entries are not allowed")
        limit = _get_config_value(self.db, "backdated_days_limit", 7)
        if (today - work_date).days > limit:
            raise BusinessRuleException(f"Entries older than {limit} days are not allowed")

    def _validate_daily_hours(self, employee_id: int, work_date: date,
                               new_hours: Decimal, exclude_detail_id: int = None) -> None:
        max_hours = Decimal(str(_get_config_value(self.db, "max_daily_hours", 12)))
        existing = self.detail_repo.get_hours_for_date(employee_id, work_date)
        if exclude_detail_id:
            # subtract hours of entry being updated
            entry = self.detail_repo.get(exclude_detail_id)
            if entry:
                existing -= entry.hours_worked
        if existing + new_hours > max_hours:
            raise BusinessRuleException(
                f"Total hours for {work_date} would exceed {max_hours}h limit. "
                f"Current: {existing}h, adding: {new_hours}h"
            )

    def _get_or_create_header(self, employee_id: int, work_date: date, created_by: int) -> TimesheetHeader:
        week_start, week_end = get_week_start_end(work_date)
        header = self.header_repo.get_by_employee_and_week(employee_id, week_start)
        if not header:
            header = TimesheetHeader(
                employee_id=employee_id,
                week_start_date=week_start,
                week_end_date=week_end,
                status=TimesheetStatus.DRAFT,
                created_by=created_by,
                updated_by=created_by,
            )
            self.db.add(header)
            self.db.flush()
        elif header.is_locked:
            raise PermissionDeniedException("Timesheet is locked after approval. Contact admin to unlock.")
        elif header.status == TimesheetStatus.APPROVED:
            raise BusinessRuleException("Cannot add entries to an approved timesheet")
        return header

    def add_entry(self, employee_id: int, data: TimesheetEntryCreate, created_by: int) -> TimesheetDetail:
        self._validate_work_date(data.work_date, employee_id)
        self._validate_daily_hours(employee_id, data.work_date, data.hours_worked)
        header = self._get_or_create_header(employee_id, data.work_date, created_by)
        detail = TimesheetDetail(
            header_id=header.id,
            employee_id=employee_id,
            project_id=data.project_id,
            activity_id=data.activity_id,
            work_date=data.work_date,
            hours_worked=data.hours_worked,
            description=data.description,
            is_billable=data.is_billable,
            created_by=created_by,
            updated_by=created_by,
        )
        self.db.add(detail)
        self.db.commit()
        self.db.refresh(detail)
        self.header_repo.recalculate_total(header)
        return detail

    def update_entry(self, detail_id: int, employee_id: int, data: TimesheetEntryUpdate, updated_by: int) -> TimesheetDetail:
        detail = self.detail_repo.get(detail_id)
        if not detail or detail.is_deleted or detail.employee_id != employee_id:
            raise NotFoundException("Entry not found")
        header = self.header_repo.get(detail.header_id)
        if header.is_locked or header.status == TimesheetStatus.APPROVED:
            raise PermissionDeniedException("Cannot edit a locked/approved timesheet")
        if data.hours_worked:
            self._validate_daily_hours(employee_id, detail.work_date, data.hours_worked, exclude_detail_id=detail_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(detail, field, value)
        detail.updated_by = updated_by
        self.db.commit()
        self.db.refresh(detail)
        self.header_repo.recalculate_total(header)
        return detail

    def delete_entry(self, detail_id: int, employee_id: int, deleted_by: int) -> None:
        detail = self.detail_repo.get(detail_id)
        if not detail or detail.is_deleted or detail.employee_id != employee_id:
            raise NotFoundException("Entry not found")
        header = self.header_repo.get(detail.header_id)
        if header.is_locked or header.status == TimesheetStatus.APPROVED:
            raise PermissionDeniedException("Cannot delete entries in a locked/approved timesheet")
        detail.is_deleted = True
        detail.updated_by = deleted_by
        self.db.commit()
        self.header_repo.recalculate_total(header)

    def get_daily_entries(self, employee_id: int, work_date: date) -> List[TimesheetDetail]:
        return self.detail_repo.get_by_date(employee_id, work_date)

    def get_weekly_grid(self, employee_id: int, week_start: date) -> WeeklyGridResponse:
        week_end = week_start + timedelta(days=6)
        header = self.header_repo.get_by_employee_and_week(employee_id, week_start)
        entries = self.detail_repo.get_week_entries(employee_id, week_start, week_end)

        day_map = {0: "mon", 1: "tue", 2: "wed", 3: "thu", 4: "fri", 5: "sat", 6: "sun"}
        rows: dict = {}
        for e in entries:
            key = (e.project_id, e.activity_id)
            if key not in rows:
                rows[key] = WeeklyGridEntry(
                    project_id=e.project_id,
                    project_name=e.project.project_name if e.project else "",
                    project_code=e.project.project_code if e.project else "",
                    activity_id=e.activity_id,
                    activity_name=e.activity.activity_name if e.activity else "",
                )
            day_col = day_map[e.work_date.weekday()]
            current = getattr(rows[key], day_col) or Decimal("0")
            setattr(rows[key], day_col, current + e.hours_worked)
            rows[key].row_total += e.hours_worked

        day_totals = {}
        for col in ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]:
            day_totals[col] = sum((getattr(r, col) or Decimal("0")) for r in rows.values())

        grand_total = sum(r.row_total for r in rows.values())
        return WeeklyGridResponse(
            week_start_date=week_start,
            week_end_date=week_end,
            header_id=header.id if header else None,
            status=header.status if header else None,
            entries=list(rows.values()),
            day_totals={k: float(v) for k, v in day_totals.items()},
            grand_total=grand_total,
        )

    def copy_previous_day(self, employee_id: int, from_date: date, to_date: date, created_by: int) -> List[TimesheetDetail]:
        self._validate_work_date(to_date, employee_id)
        source = self.detail_repo.get_by_date(employee_id, from_date)
        if not source:
            raise BusinessRuleException(f"No entries found for {from_date}")
        new_entries = []
        for src in source:
            self._validate_daily_hours(employee_id, to_date, src.hours_worked)
            header = self._get_or_create_header(employee_id, to_date, created_by)
            d = TimesheetDetail(
                header_id=header.id,
                employee_id=employee_id,
                project_id=src.project_id,
                activity_id=src.activity_id,
                work_date=to_date,
                hours_worked=src.hours_worked,
                description=src.description,
                is_billable=src.is_billable,
                created_by=created_by,
                updated_by=created_by,
            )
            self.db.add(d)
            new_entries.append(d)
        self.db.commit()
        return new_entries

    def submit_timesheet(self, header_id: int, employee_id: int) -> TimesheetHeader:
        from app.models.user import User, UserRole
        header = self.header_repo.get(header_id)
        if not header or header.employee_id != employee_id:
            raise NotFoundException("Timesheet not found")
        if header.status not in [TimesheetStatus.DRAFT, TimesheetStatus.REJECTED]:
            raise BusinessRuleException("Only draft or rejected timesheets can be submitted")
        now = datetime.now(timezone.utc)
        employee = self.db.query(User).filter(User.id == employee_id).first()
        # Super admins auto-approve their own timesheets (no manager to approve them)
        if employee and employee.role == UserRole.SUPER_ADMIN:
            header.status = TimesheetStatus.APPROVED
            header.submitted_at = now
            header.approved_by = employee_id
            header.approved_at = now
            header.is_locked = True
        else:
            header.status = TimesheetStatus.SUBMITTED
            header.submitted_at = now
        header.updated_by = employee_id
        self.db.commit()
        self.db.refresh(header)
        return header

    def list_timesheets(self, employee_id: int, page: int = 1, page_size: int = 10):
        return self.header_repo.list_for_employee(employee_id, page, page_size)
