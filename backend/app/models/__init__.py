from app.models.user import User
from app.models.project import Project
from app.models.activity import Activity
from app.models.timesheet_header import TimesheetHeader
from app.models.timesheet_detail import TimesheetDetail
from app.models.approval_history import ApprovalHistory
from app.models.audit_log import AuditLog
from app.models.notification_log import NotificationLog
from app.models.system_config import SystemConfig
from app.models.holiday import Holiday
from app.models.designation import Designation
from app.models.department import Department
from app.models.user_project import user_project_table  # noqa: F401 — registers association table

__all__ = [
    "User", "Project", "Activity", "TimesheetHeader", "TimesheetDetail",
    "ApprovalHistory", "AuditLog", "NotificationLog", "SystemConfig", "Holiday",
    "Designation", "Department",
]
