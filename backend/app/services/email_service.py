import logging
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings

logger = logging.getLogger(__name__)

_conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=bool(settings.MAIL_USERNAME),
    VALIDATE_CERTS=True,
)


def _base_template(title: str, body_html: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #F8FAFC; margin: 0; padding: 0; }}
    .wrapper {{ max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px;
                box-shadow: 0 4px 24px rgba(15,76,129,0.10); overflow: hidden; }}
    .header {{ background: linear-gradient(135deg, #0F4C81 0%, #00A86B 100%);
               padding: 32px 40px; text-align: center; }}
    .header img {{ height: 48px; }}
    .header h1 {{ color: #fff; font-size: 22px; margin: 12px 0 0; letter-spacing: 0.5px; }}
    .content {{ padding: 36px 40px; color: #1E293B; line-height: 1.7; }}
    .content h2 {{ color: #0F4C81; font-size: 18px; }}
    .btn {{ display: inline-block; margin: 24px 0; padding: 14px 32px;
            background: #0F4C81; color: #fff !important; border-radius: 8px;
            text-decoration: none; font-weight: 600; font-size: 15px; }}
    .badge {{ display: inline-block; padding: 4px 14px; border-radius: 20px;
              background: #EFF6FF; color: #0F4C81; font-size: 13px; font-weight: 600; }}
    .footer {{ background: #F8FAFC; padding: 20px 40px; text-align: center;
               color: #64748B; font-size: 12px; border-top: 1px solid #E2E8F0; }}
    table.summary {{ width: 100%; border-collapse: collapse; margin: 16px 0; }}
    table.summary th {{ background: #EFF6FF; color: #0F4C81; padding: 10px 14px;
                        text-align: left; font-size: 13px; }}
    table.summary td {{ padding: 10px 14px; border-bottom: 1px solid #E2E8F0;
                        font-size: 13px; color: #1E293B; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
        <h1>Tymvora</h1>
      <div style="color: rgba(255,255,255,0.8); font-size: 13px; margin-top: 4px;">
        Smart Time Tracking &amp; Workforce Productivity Platform
      </div>
    </div>
    <div class="content">
      {body_html}
    </div>
    <div class="footer">
        <p>This email was sent by Tymvora.</p>
        <p>© 2026 Tymvora. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
"""


async def send_welcome_email(to_email: str, full_name: str, temp_password: str) -> None:
    body = f"""
<h2>Welcome to Tymvora, {full_name}!</h2>
<p>Your account has been created. Please use the credentials below to log in and <strong>change your password immediately</strong>.</p>
<table class="summary">
  <tr><th>Email</th><td>{to_email}</td></tr>
  <tr><th>Temporary Password</th><td style="font-family:monospace;font-size:15px;">{temp_password}</td></tr>
</table>
<a href="{settings.FRONTEND_URL}/login" class="btn">Log In Now</a>
<p style="color:#64748B;font-size:13px;">If you did not request this account, please contact your administrator.</p>
"""
    await _send(to_email, "Welcome to Tymvora – Your Account is Ready", _base_template("Welcome", body))


async def send_otp_email(to_email: str, full_name: str, otp: str) -> None:
    body = f"""
<h2>Password Reset OTP</h2>
<p>Hi {full_name}, we received a request to reset your Tymvora password.</p>
<p>Use the OTP below to verify your identity and set a new password.</p>
<div style="margin: 28px 0; text-align: center;">
  <div style="display: inline-block; background: #EFF6FF; border: 2px dashed #2563EB;
              border-radius: 12px; padding: 20px 40px;">
    <p style="margin: 0 0 4px; font-size: 12px; color: #64748B; text-transform: uppercase;
              letter-spacing: 1px; font-weight: 600;">Your OTP</p>
    <p style="margin: 0; font-size: 40px; font-weight: 800; letter-spacing: 10px;
              color: #0F4C81; font-family: monospace;">{otp}</p>
  </div>
</div>
<p style="text-align:center;">
  <span style="display:inline-block;background:#FEF3C7;color:#92400E;padding:6px 16px;
               border-radius:20px;font-size:13px;font-weight:600;">
    ⏱ Valid for 5 minutes only
  </span>
</p>
<p style="color:#64748B;font-size:13px;margin-top:20px;">
  Enter this OTP on the password reset page along with your new password.<br>
  If you did not request a password reset, please ignore this email.
</p>
"""
    await _send(to_email, "Tymvora – Password Reset OTP", _base_template("Reset OTP", body))


async def send_approval_email(to_email: str, full_name: str, week_label: str, total_hours: float) -> None:
    body = f"""
<h2>Timesheet Approved ✅</h2>
<p>Hi {full_name}, your timesheet has been <strong style="color:#22C55E;">approved</strong>.</p>
<table class="summary">
  <tr><th>Week</th><td>{week_label}</td></tr>
  <tr><th>Total Hours</th><td>{total_hours}h</td></tr>
</table>
<a href="{settings.FRONTEND_URL}/timesheets" class="btn">View Timesheets</a>
"""
    await _send(to_email, "Tymvora – Timesheet Approved", _base_template("Approved", body))


async def send_rejection_email(to_email: str, full_name: str, week_label: str, comment: str) -> None:
    body = f"""
<h2>Timesheet Rejected ❌</h2>
<p>Hi {full_name}, your timesheet for <strong>{week_label}</strong> has been <strong style="color:#EF4444;">rejected</strong>.</p>
<div style="background:#FEF2F2;border-left:4px solid #EF4444;padding:12px 16px;border-radius:4px;margin:16px 0;">
  <strong>Reason:</strong> {comment}
</div>
<p>Please update your timesheet and resubmit.</p>
<a href="{settings.FRONTEND_URL}/timesheets" class="btn">Update Timesheet</a>
"""
    await _send(to_email, "Tymvora – Timesheet Rejected", _base_template("Rejected", body))


async def send_daily_reminder(to_email: str, full_name: str) -> None:
    body = f"""
<h2>Daily Timesheet Reminder ⏰</h2>
<p>Hi {full_name}, don't forget to log your hours for today!</p>
<p>Accurate time tracking helps the team plan better and ensures you get credit for all your work.</p>
<a href="{settings.FRONTEND_URL}/timesheets/entry" class="btn">Log Today's Hours</a>
"""
    await _send(to_email, "Tymvora – Log Your Hours Today", _base_template("Reminder", body))


async def send_weekly_reminder(to_email: str, full_name: str, week_label: str, hours_logged: float) -> None:
    body = f"""
<h2>Weekly Timesheet Reminder 📋</h2>
<p>Hi {full_name}, the week <strong>{week_label}</strong> is ending soon.</p>
<table class="summary">
  <tr><th>Hours Logged</th><td>{hours_logged}h</td></tr>
</table>
<p>Please submit your timesheet before the deadline.</p>
<a href="{settings.FRONTEND_URL}/timesheets" class="btn">Submit Timesheet</a>
"""
    await _send(to_email, "Tymvora – Please Submit Your Weekly Timesheet", _base_template("Weekly", body))


async def _send(to: str, subject: str, html_body: str) -> None:
    if not settings.MAIL_USERNAME:
        logger.warning("Email not sent — MAIL_USERNAME is not configured in .env")
        return
    try:
        fm = FastMail(_conf)
        message = MessageSchema(
            subject=subject,
            recipients=[to],
            body=html_body,
            subtype=MessageType.html,
        )
        await fm.send_message(message)
        logger.info("Email sent to %s | subject: %s", to, subject)
    except Exception as exc:
        logger.error("Failed to send email to %s | subject: %s | error: %s", to, subject, exc)
