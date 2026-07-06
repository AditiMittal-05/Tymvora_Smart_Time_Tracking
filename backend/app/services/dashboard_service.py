from datetime import date, timedelta
from decimal import Decimal
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.timesheet_header import TimesheetHeader, TimesheetStatus
from app.models.timesheet_detail import TimesheetDetail
from app.models.user import User, UserStatus
from app.models.project import Project
from app.schemas.dashboard import (
    EmployeeDashboard, EmployeeKPIs, ApproverDashboard, ApproverKPIs,
    WeeklyHoursData, RecentEntry, HeatmapDay, TopProject, PendingItem, ChartDataPoint,
)


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_employee_dashboard(self, employee_id: int) -> EmployeeDashboard:
        today = date.today()
        month_start = today.replace(day=1)

        month_hours = self.db.query(func.sum(TimesheetDetail.hours_worked)).filter(
            TimesheetDetail.employee_id == employee_id,
            TimesheetDetail.work_date >= month_start,
            TimesheetDetail.is_deleted == False,
        ).scalar() or Decimal("0")

        def count_by_status(*statuses):
            return self.db.query(func.count(TimesheetHeader.id)).filter(
                TimesheetHeader.employee_id == employee_id,
                TimesheetHeader.status.in_(statuses),
                TimesheetHeader.is_deleted == False,
            ).scalar() or 0

        kpis = EmployeeKPIs(
            current_month_hours=month_hours,
            submitted_count=count_by_status(TimesheetStatus.SUBMITTED, TimesheetStatus.RESUBMITTED),
            pending_count=count_by_status(TimesheetStatus.DRAFT),
            approved_count=count_by_status(TimesheetStatus.APPROVED),
            rejected_count=count_by_status(TimesheetStatus.REJECTED),
        )

        # Last 8 weeks hours
        weekly_hours = []
        for i in range(7, -1, -1):
            w_start = today - timedelta(weeks=i)
            w_start = w_start - timedelta(days=w_start.weekday())
            w_end = w_start + timedelta(days=6)
            hrs = self.db.query(func.sum(TimesheetDetail.hours_worked)).filter(
                TimesheetDetail.employee_id == employee_id,
                TimesheetDetail.work_date >= w_start,
                TimesheetDetail.work_date <= w_end,
                TimesheetDetail.is_deleted == False,
            ).scalar() or 0
            weekly_hours.append(WeeklyHoursData(week=w_start.strftime("%b %d"), hours=float(hrs)))

        # Recent entries
        from app.models.project import Project
        from app.models.activity import Activity
        recent_rows = self.db.query(
            TimesheetDetail, Project.project_name, Activity.activity_name, TimesheetHeader.status
        ).join(Project, TimesheetDetail.project_id == Project.id)\
         .join(Activity, TimesheetDetail.activity_id == Activity.id)\
         .join(TimesheetHeader, TimesheetDetail.header_id == TimesheetHeader.id)\
         .filter(
            TimesheetDetail.employee_id == employee_id,
            TimesheetDetail.is_deleted == False,
        ).order_by(TimesheetDetail.work_date.desc()).limit(10).all()

        recent_entries = [
            RecentEntry(
                work_date=str(r.TimesheetDetail.work_date),
                project_name=r.project_name,
                activity_name=r.activity_name,
                hours_worked=float(r.TimesheetDetail.hours_worked),
                status=r.status.value,
            ) for r in recent_rows
        ]

        # Heatmap (current month)
        heatmap_rows = self.db.query(
            TimesheetDetail.work_date,
            func.sum(TimesheetDetail.hours_worked).label("hours"),
        ).filter(
            TimesheetDetail.employee_id == employee_id,
            TimesheetDetail.work_date >= month_start,
            TimesheetDetail.is_deleted == False,
        ).group_by(TimesheetDetail.work_date).all()
        heatmap = [HeatmapDay(date=str(r.work_date), hours=float(r.hours)) for r in heatmap_rows]

        return EmployeeDashboard(kpis=kpis, weekly_hours=weekly_hours,
                                 recent_entries=recent_entries, heatmap=heatmap)

    def get_approver_dashboard(self, approver_id: Optional[int] = None) -> ApproverDashboard:
        """
        approver_id=None  → super_admin context, shows all data.
        approver_id=<id>  → scopes all queries to the approver's direct reports.
        """
        import calendar
        today = date.today()
        month_start = today.replace(day=1)
        last_90 = today - timedelta(days=90)

        def ts_query(base_filter):
            q = self.db.query(func.count(TimesheetHeader.id)).filter(
                *base_filter, TimesheetHeader.is_deleted == False
            )
            if approver_id is not None:
                q = q.join(User, TimesheetHeader.employee_id == User.id).filter(
                    User.manager_id == approver_id
                )
            return q.scalar() or 0

        pending = ts_query([
            TimesheetHeader.status.in_([TimesheetStatus.SUBMITTED, TimesheetStatus.RESUBMITTED])
        ])
        approved_month = ts_query([
            TimesheetHeader.status == TimesheetStatus.APPROVED,
            TimesheetHeader.approved_at >= month_start,
        ])
        rejected_month = ts_query([
            TimesheetHeader.status == TimesheetStatus.REJECTED,
            TimesheetHeader.week_start_date >= month_start,
        ])

        # Employee / team count
        emp_q = self.db.query(func.count(User.id)).filter(
            User.status == UserStatus.ACTIVE, User.is_deleted == False
        )
        if approver_id is not None:
            emp_q = emp_q.filter(User.manager_id == approver_id)
        total_emp = emp_q.scalar() or 0

        # Avg hours per employee (current month) — use subquery to avoid nested aggregate error
        _inner = self.db.query(
            func.sum(TimesheetDetail.hours_worked).label("emp_total")
        ).filter(
            TimesheetDetail.work_date >= month_start,
            TimesheetDetail.is_deleted == False,
        )
        if approver_id is not None:
            _inner = _inner.join(User, TimesheetDetail.employee_id == User.id).filter(
                User.manager_id == approver_id
            )
        _sub = _inner.group_by(TimesheetDetail.employee_id).subquery()
        avg_hours = self.db.query(func.avg(_sub.c.emp_total)).scalar() or Decimal("0")

        # Total hours this month
        tot_q = self.db.query(func.sum(TimesheetDetail.hours_worked)).filter(
            TimesheetDetail.work_date >= month_start,
            TimesheetDetail.is_deleted == False,
        )
        if approver_id is not None:
            tot_q = tot_q.join(User, TimesheetDetail.employee_id == User.id).filter(
                User.manager_id == approver_id
            )
        total_hours_month = float(tot_q.scalar() or 0)

        # Active projects (have timesheet entries in last 90 days)
        proj_q = self.db.query(func.count(func.distinct(TimesheetDetail.project_id))).filter(
            TimesheetDetail.work_date >= last_90,
            TimesheetDetail.is_deleted == False,
        )
        if approver_id is not None:
            proj_q = proj_q.join(User, TimesheetDetail.employee_id == User.id).filter(
                User.manager_id == approver_id
            )
        active_projects = proj_q.scalar() or 0

        kpis = ApproverKPIs(
            pending_approvals=pending,
            approved_this_month=approved_month,
            rejected_this_month=rejected_month,
            missing_timesheets=0,
            total_employees=total_emp,
            avg_hours_per_employee=Decimal(str(round(float(avg_hours), 2))),
            total_hours_this_month=round(total_hours_month, 1),
            active_projects=active_projects,
        )

        # Top projects — last 90 days so seeded data shows up
        top_proj_q = self.db.query(
            Project.project_name,
            Project.customer_name,
            func.sum(TimesheetDetail.hours_worked).label("total"),
            func.count(func.distinct(TimesheetDetail.employee_id)).label("emp_count"),
        ).join(TimesheetDetail, Project.id == TimesheetDetail.project_id)\
         .filter(
            TimesheetDetail.work_date >= last_90,
            TimesheetDetail.is_deleted == False,
        )
        if approver_id is not None:
            top_proj_q = top_proj_q.join(User, TimesheetDetail.employee_id == User.id).filter(
                User.manager_id == approver_id
            )
        top_proj_rows = top_proj_q.group_by(Project.id, Project.project_name, Project.customer_name)\
            .order_by(func.sum(TimesheetDetail.hours_worked).desc()).limit(8).all()
        top_projects = [
            TopProject(
                project_name=r.project_name,
                customer_name=r.customer_name,
                total_hours=float(r.total),
                employee_count=int(r.emp_count),
            ) for r in top_proj_rows
        ]

        # Department hours — last 90 days
        dept_q = self.db.query(
            User.department,
            func.sum(TimesheetDetail.hours_worked).label("total"),
        ).join(TimesheetDetail, TimesheetDetail.employee_id == User.id)\
         .filter(
            TimesheetDetail.work_date >= last_90,
            TimesheetDetail.is_deleted == False,
            User.department.isnot(None),
        )
        if approver_id is not None:
            dept_q = dept_q.filter(User.manager_id == approver_id)
        dept_rows = dept_q.group_by(User.department)\
            .order_by(func.sum(TimesheetDetail.hours_worked).desc()).all()
        dept_hours = [ChartDataPoint(label=r.department, value=float(r.total)) for r in dept_rows]

        # Pending queue
        pend_q = self.db.query(TimesheetHeader).filter(
            TimesheetHeader.status.in_([TimesheetStatus.SUBMITTED, TimesheetStatus.RESUBMITTED]),
            TimesheetHeader.is_deleted == False,
        )
        if approver_id is not None:
            pend_q = pend_q.join(User, TimesheetHeader.employee_id == User.id).filter(
                User.manager_id == approver_id
            )
        pending_items_rows = pend_q.order_by(TimesheetHeader.submitted_at.asc()).limit(10).all()
        pending_items = [
            PendingItem(
                header_id=h.id,
                employee_name=h.employee.full_name if h.employee else "",
                week_label=f"{h.week_start_date} - {h.week_end_date}",
                total_hours=float(h.total_hours),
                submitted_at=str(h.submitted_at) if h.submitted_at else None,
            ) for h in pending_items_rows
        ]

        # Monthly hours chart (last 6 months)
        monthly_chart = []
        for i in range(5, -1, -1):
            m = (today.month - i - 1) % 12 + 1
            y = today.year if (today.month - i) > 0 else today.year - 1
            hrs_q = self.db.query(func.sum(TimesheetDetail.hours_worked)).filter(
                extract("month", TimesheetDetail.work_date) == m,
                extract("year", TimesheetDetail.work_date) == y,
                TimesheetDetail.is_deleted == False,
            )
            if approver_id is not None:
                hrs_q = hrs_q.join(User, TimesheetDetail.employee_id == User.id).filter(
                    User.manager_id == approver_id
                )
            hrs = hrs_q.scalar() or 0
            monthly_chart.append(ChartDataPoint(label=f"{calendar.month_abbr[m]} {y}", value=float(hrs)))

        # Week bounds (Mon–Sun)
        week_start = today - timedelta(days=today.weekday())
        week_end   = week_start + timedelta(days=6)

        def _status_count(status_list, date_from, date_to):
            q = self.db.query(func.count(TimesheetHeader.id)).filter(
                TimesheetHeader.status.in_(status_list),
                TimesheetHeader.week_start_date >= date_from,
                TimesheetHeader.week_start_date <= date_to,
                TimesheetHeader.is_deleted == False,
            )
            if approver_id is not None:
                q = q.join(User, TimesheetHeader.employee_id == User.id).filter(
                    User.manager_id == approver_id
                )
            return q.scalar() or 0

        # Monthly status breakdown
        m_draft     = _status_count([TimesheetStatus.DRAFT],                               month_start, today)
        m_submitted = _status_count([TimesheetStatus.SUBMITTED, TimesheetStatus.RESUBMITTED], month_start, today)
        m_approved  = _status_count([TimesheetStatus.APPROVED],                            month_start, today)
        m_rejected  = _status_count([TimesheetStatus.REJECTED],                            month_start, today)
        monthly_status_chart = [
            ChartDataPoint(label="Draft",     value=float(m_draft)),
            ChartDataPoint(label="Submitted", value=float(m_submitted)),
            ChartDataPoint(label="Approved",  value=float(m_approved)),
            ChartDataPoint(label="Rejected",  value=float(m_rejected)),
        ]

        # Weekly status breakdown
        w_draft     = _status_count([TimesheetStatus.DRAFT],                               week_start, week_end)
        w_submitted = _status_count([TimesheetStatus.SUBMITTED, TimesheetStatus.RESUBMITTED], week_start, week_end)
        w_approved  = _status_count([TimesheetStatus.APPROVED],                            week_start, week_end)
        w_rejected  = _status_count([TimesheetStatus.REJECTED],                            week_start, week_end)
        weekly_status_chart = [
            ChartDataPoint(label="Draft",     value=float(w_draft)),
            ChartDataPoint(label="Submitted", value=float(w_submitted)),
            ChartDataPoint(label="Approved",  value=float(w_approved)),
            ChartDataPoint(label="Rejected",  value=float(w_rejected)),
        ]

        # Weekly daily chart: Mon–Sun of the current week (hours per day)
        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        weekly_daily_chart = []
        for offset in range(7):
            day = week_start + timedelta(days=offset)
            hrs_q = self.db.query(func.sum(TimesheetDetail.hours_worked)).filter(
                TimesheetDetail.work_date == day,
                TimesheetDetail.is_deleted == False,
            )
            if approver_id is not None:
                hrs_q = hrs_q.join(User, TimesheetDetail.employee_id == User.id).filter(
                    User.manager_id == approver_id
                )
            hrs = float(hrs_q.scalar() or 0)
            weekly_daily_chart.append(ChartDataPoint(label=day_names[offset], value=hrs))

        # Monthly weekly chart: week-by-week breakdown for the current month
        monthly_weekly_chart = []
        import calendar as _cal
        _, days_in_month = _cal.monthrange(today.year, today.month)
        # Walk week-by-week from month_start
        wk = month_start
        week_num = 1
        while wk <= today:
            wk_end = min(wk + timedelta(days=6), today)
            hrs_q = self.db.query(func.sum(TimesheetDetail.hours_worked)).filter(
                TimesheetDetail.work_date >= wk,
                TimesheetDetail.work_date <= wk_end,
                TimesheetDetail.is_deleted == False,
            )
            if approver_id is not None:
                hrs_q = hrs_q.join(User, TimesheetDetail.employee_id == User.id).filter(
                    User.manager_id == approver_id
                )
            hrs = float(hrs_q.scalar() or 0)
            monthly_weekly_chart.append(ChartDataPoint(label=f"Wk {week_num}", value=hrs))
            wk += timedelta(days=7)
            week_num += 1

        return ApproverDashboard(kpis=kpis, top_projects=top_projects,
                                 dept_hours=dept_hours,
                                 pending_approvals=pending_items,
                                 monthly_hours_chart=monthly_chart,
                                 monthly_status_chart=monthly_status_chart,
                                 weekly_status_chart=weekly_status_chart,
                                 weekly_approved=w_approved,
                                 weekly_rejected=w_rejected,
                                 weekly_pending=w_submitted,
                                 weekly_daily_chart=weekly_daily_chart,
                                 monthly_weekly_chart=monthly_weekly_chart)
