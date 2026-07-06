from fastapi import APIRouter
from app.api.v1 import auth, users, projects, activities, timesheets, approvals, dashboard, reports, config, audit_logs, holidays, designations, departments

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(activities.router)
api_router.include_router(timesheets.router)
api_router.include_router(approvals.router)
api_router.include_router(dashboard.router)
api_router.include_router(reports.router)
api_router.include_router(config.router)
api_router.include_router(audit_logs.router)
api_router.include_router(holidays.router)
api_router.include_router(designations.router)
api_router.include_router(departments.router)
