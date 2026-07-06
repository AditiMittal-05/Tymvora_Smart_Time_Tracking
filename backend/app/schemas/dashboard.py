from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel


class EmployeeKPIs(BaseModel):
    current_month_hours: Decimal
    submitted_count: int
    pending_count: int
    approved_count: int
    rejected_count: int


class ChartDataPoint(BaseModel):
    label: str
    value: float


class WeeklyHoursData(BaseModel):
    week: str
    hours: float


class RecentEntry(BaseModel):
    work_date: str
    project_name: str
    activity_name: str
    hours_worked: float
    status: str


class HeatmapDay(BaseModel):
    date: str
    hours: float
    status: Optional[str] = None


class EmployeeDashboard(BaseModel):
    kpis: EmployeeKPIs
    weekly_hours: List[WeeklyHoursData]
    recent_entries: List[RecentEntry]
    heatmap: List[HeatmapDay]


class TopProject(BaseModel):
    project_name: str
    customer_name: str
    total_hours: float
    employee_count: int


class PendingItem(BaseModel):
    header_id: int
    employee_name: str
    week_label: str
    total_hours: float
    submitted_at: Optional[str] = None


class ApproverKPIs(BaseModel):
    pending_approvals: int
    approved_this_month: int
    rejected_this_month: int
    missing_timesheets: int
    total_employees: int
    avg_hours_per_employee: Decimal
    total_hours_this_month: float
    active_projects: int


class ApproverDashboard(BaseModel):
    kpis: ApproverKPIs
    top_projects: List[TopProject]
    dept_hours: List[ChartDataPoint]
    pending_approvals: List[PendingItem]
    monthly_hours_chart: List[ChartDataPoint]
    monthly_status_chart: List[ChartDataPoint] = []
    weekly_status_chart: List[ChartDataPoint] = []
    weekly_approved: int = 0
    weekly_rejected: int = 0
    weekly_pending: int = 0
    weekly_daily_chart: List[ChartDataPoint] = []   # Mon–Sun hours for current week
    monthly_weekly_chart: List[ChartDataPoint] = [] # week-by-week hours for current month
