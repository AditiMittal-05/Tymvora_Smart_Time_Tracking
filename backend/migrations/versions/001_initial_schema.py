"""Initial schema

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_master",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("employee_code", sa.String(20), unique=True, nullable=False),
        sa.Column("full_name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(150), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("employee", "admin", name="userrole"), default="employee", nullable=False),
        sa.Column("status", sa.Enum("active", "inactive", name="userstatus"), default="active", nullable=False),
        sa.Column("department", sa.String(100), nullable=True),
        sa.Column("designation", sa.String(100), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("profile_pic", sa.String(255), nullable=True),
        sa.Column("last_login", sa.DateTime, nullable=True),
        sa.Column("password_reset_token", sa.String(500), nullable=True),
        sa.Column("created_by", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_by", sa.Integer, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=False),
        sa.Column("is_deleted", sa.Boolean, default=False, nullable=False),
    )
    op.create_index("ix_user_master_employee_code", "user_master", ["employee_code"])
    op.create_index("ix_user_master_email", "user_master", ["email"])
    op.create_index("ix_user_master_role", "user_master", ["role"])
    op.create_index("ix_user_master_status", "user_master", ["status"])

    op.create_table(
        "project_master",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("project_code", sa.String(20), unique=True, nullable=False),
        sa.Column("project_name", sa.String(200), nullable=False),
        sa.Column("customer_name", sa.String(200), nullable=False),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("end_date", sa.Date, nullable=True),
        sa.Column("status", sa.Enum("active", "inactive", "completed", "on_hold", name="projectstatus"),
                  default="active", nullable=False),
        sa.Column("project_manager_id", sa.Integer, sa.ForeignKey("user_master.id"), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("created_by", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_by", sa.Integer, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=False),
        sa.Column("is_deleted", sa.Boolean, default=False, nullable=False),
    )
    op.create_index("ix_project_master_project_code", "project_master", ["project_code"])
    op.create_index("ix_project_master_status", "project_master", ["status"])

    op.create_table(
        "activity_master",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("activity_code", sa.String(20), unique=True, nullable=False),
        sa.Column("activity_name", sa.String(100), nullable=False),
        sa.Column("category", sa.String(50), nullable=True),
        sa.Column("is_billable", sa.Boolean, default=True, nullable=False),
        sa.Column("status", sa.Enum("active", "inactive", name="activitystatus"), default="active", nullable=False),
        sa.Column("created_by", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_by", sa.Integer, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=False),
        sa.Column("is_deleted", sa.Boolean, default=False, nullable=False),
    )
    op.create_index("ix_activity_master_activity_code", "activity_master", ["activity_code"])

    op.create_table(
        "timesheet_header",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("employee_id", sa.Integer, sa.ForeignKey("user_master.id"), nullable=False),
        sa.Column("week_start_date", sa.Date, nullable=False),
        sa.Column("week_end_date", sa.Date, nullable=False),
        sa.Column("total_hours", sa.DECIMAL(5, 2), default=0, nullable=False),
        sa.Column("status", sa.Enum("draft", "submitted", "approved", "rejected", "resubmitted",
                                    name="timesheetstatus"), default="draft", nullable=False),
        sa.Column("submitted_at", sa.DateTime, nullable=True),
        sa.Column("approved_by", sa.Integer, sa.ForeignKey("user_master.id"), nullable=True),
        sa.Column("approved_at", sa.DateTime, nullable=True),
        sa.Column("rejected_by", sa.Integer, sa.ForeignKey("user_master.id"), nullable=True),
        sa.Column("rejection_reason", sa.Text, nullable=True),
        sa.Column("is_locked", sa.Boolean, default=False, nullable=False),
        sa.Column("created_by", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_by", sa.Integer, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=False),
        sa.Column("is_deleted", sa.Boolean, default=False, nullable=False),
    )
    op.create_index("ix_timesheet_header_employee_id", "timesheet_header", ["employee_id"])
    op.create_index("ix_timesheet_header_status", "timesheet_header", ["status"])

    op.create_table(
        "timesheet_detail",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("header_id", sa.Integer, sa.ForeignKey("timesheet_header.id", ondelete="CASCADE"), nullable=False),
        sa.Column("employee_id", sa.Integer, sa.ForeignKey("user_master.id"), nullable=False),
        sa.Column("project_id", sa.Integer, sa.ForeignKey("project_master.id"), nullable=False),
        sa.Column("activity_id", sa.Integer, sa.ForeignKey("activity_master.id"), nullable=False),
        sa.Column("work_date", sa.Date, nullable=False),
        sa.Column("hours_worked", sa.DECIMAL(4, 2), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("is_billable", sa.Boolean, default=True, nullable=False),
        sa.Column("created_by", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_by", sa.Integer, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=False),
        sa.Column("is_deleted", sa.Boolean, default=False, nullable=False),
    )
    op.create_index("ix_timesheet_detail_header_id", "timesheet_detail", ["header_id"])
    op.create_index("ix_timesheet_detail_employee_id", "timesheet_detail", ["employee_id"])
    op.create_index("ix_timesheet_detail_work_date", "timesheet_detail", ["work_date"])

    op.create_table(
        "approval_history",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("header_id", sa.Integer, sa.ForeignKey("timesheet_header.id", ondelete="CASCADE"), nullable=False),
        sa.Column("action_by", sa.Integer, sa.ForeignKey("user_master.id"), nullable=False),
        sa.Column("action", sa.Enum("submit", "approve", "reject", "unlock", "resubmit", name="approvalaction"),
                  nullable=False),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column("previous_status", sa.String(20), nullable=True),
        sa.Column("new_status", sa.String(20), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_approval_history_header_id", "approval_history", ["header_id"])
    op.create_index("ix_approval_history_action_by", "approval_history", ["action_by"])

    op.create_table(
        "audit_log",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("user_master.id"), nullable=True),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.Integer, nullable=True),
        sa.Column("action", sa.String(20), nullable=False),
        sa.Column("old_values", sa.JSON, nullable=True),
        sa.Column("new_values", sa.JSON, nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_audit_log_entity_type", "audit_log", ["entity_type"])
    op.create_index("ix_audit_log_user_id", "audit_log", ["user_id"])

    op.create_table(
        "notification_log",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("recipient_id", sa.Integer, sa.ForeignKey("user_master.id"), nullable=False),
        sa.Column("type", sa.Enum("daily_reminder", "weekly_reminder", "approval", "rejection",
                                  "system", "welcome", "password_reset", name="notificationtype"), nullable=False),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("body", sa.Text, nullable=True),
        sa.Column("is_read", sa.Boolean, default=False, nullable=False),
        sa.Column("sent_at", sa.DateTime, nullable=False),
        sa.Column("read_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_notification_log_recipient_id", "notification_log", ["recipient_id"])
    op.create_index("ix_notification_log_is_read", "notification_log", ["is_read"])

    op.create_table(
        "system_config",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("config_key", sa.String(100), unique=True, nullable=False),
        sa.Column("config_value", sa.String(500), nullable=False),
        sa.Column("description", sa.String(300), nullable=True),
        sa.Column("updated_by", sa.Integer, nullable=True),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_system_config_config_key", "system_config", ["config_key"])

    # Default system config
    op.execute("""
        INSERT INTO system_config (config_key, config_value, description, updated_at)
        VALUES
        ('backdated_days_limit', '7', 'Maximum number of days back employees can log time', NOW()),
        ('max_daily_hours', '12', 'Maximum hours an employee can log per day', NOW())
    """)

    # Default admin user (password: Admin@123)
    op.execute("""
        INSERT INTO user_master (employee_code, full_name, email, password_hash, role, status,
                                  department, designation, created_at, updated_at, is_deleted)
        VALUES (
            'EMP001', 'System Admin', 'admin@tymvora.com',
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGmiZes2W8G.jT3jHnFAZeKzOim',
            'admin', 'active', 'IT', 'System Administrator', NOW(), NOW(), 0
        )
    """)

    # Seed activity types
    activities = [
        ("ACT001", "Development", "technical", True),
        ("ACT002", "Bug Fixing", "technical", True),
        ("ACT003", "Testing", "technical", True),
        ("ACT004", "Documentation", "non-technical", True),
        ("ACT005", "Internal Meeting", "meeting", False),
        ("ACT006", "Customer Meeting", "meeting", True),
        ("ACT007", "Support", "support", True),
        ("ACT008", "Presales", "business", True),
        ("ACT009", "Training", "learning", False),
        ("ACT010", "Leave", "leave", False),
        ("ACT011", "Holiday", "leave", False),
        ("ACT012", "Other", "general", False),
    ]
    for code, name, cat, bill in activities:
        op.execute(f"""
            INSERT INTO activity_master (activity_code, activity_name, category, is_billable, status,
                                         created_at, updated_at, is_deleted)
            VALUES ('{code}', '{name}', '{cat}', {1 if bill else 0}, 'active', NOW(), NOW(), 0)
        """)


def downgrade() -> None:
    op.drop_table("system_config")
    op.drop_table("notification_log")
    op.drop_table("audit_log")
    op.drop_table("approval_history")
    op.drop_table("timesheet_detail")
    op.drop_table("timesheet_header")
    op.drop_table("activity_master")
    op.drop_table("project_master")
    op.drop_table("user_master")
