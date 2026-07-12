#!/usr/bin/env python3
"""
HourHive Demo Seed  –  seed_demo.py
====================================
• 20 named employees with a 4-level hierarchy
• All user fields populated (dept, designation, phone, manager_id, can_approve)
• 5 projects assigned with project_manager_id wired to managers
• Approver-mapping: every manager can approve their direct reports
• 9 weeks of timesheet data (≈ 2 months) for your-email@gmail.com
  with mixed statuses: approved, submitted, draft, rejected

Run from the backend directory:
    cd backend && python seed_demo.py
"""
import sys, random, json
from datetime import date, datetime, timedelta, timezone

import pymysql
import bcrypt

# ── DB config (matches .env) ──────────────────────────────────────────────────
DB = dict(host="localhost", port=3306, user="root", password="root",
          db="hourhive", charset="utf8mb4", autocommit=False)

random.seed(99)
NOW   = datetime.now(timezone.utc).replace(tzinfo=None)
TODAY = date.today()

def monday_of(d): return d - timedelta(days=d.weekday())

# Last 9 complete weeks  (Mon–Sun)
BASE_MON = monday_of(TODAY) - timedelta(weeks=1)   # last completed week
WEEKS = [(BASE_MON - timedelta(weeks=8-i),
          BASE_MON - timedelta(weeks=8-i) + timedelta(days=6))
         for i in range(9)]

HOLIDAYS = {
    date(2026,1,26), date(2026,2,15), date(2026,3,4),
    date(2026,5,1),  date(2026,8,15),
}

def is_working(d): return d.weekday() < 5 and d not in HOLIDAYS

def working_days(ws, we):
    out, cur = [], ws
    while cur <= we:
        if is_working(cur): out.append(cur)
        cur += timedelta(days=1)
    return out

# ── Hash passwords ────────────────────────────────────────────────────────────
print("Hashing passwords…")
PWD_HASH = bcrypt.hashpw(b"Employee@123", bcrypt.gensalt()).decode()
PWD_MGR  = bcrypt.hashpw(b"Manager@123",  bcrypt.gensalt()).decode()

# ─────────────────────────────────────────────────────────────────────────────
#  ORG HIERARCHY  (4 levels)
#
#  L1  VP / Director        – reports to Super Admin, can_approve=True
#  L2  Manager / Lead       – reports to L1,          can_approve=True
#  L3  Senior Individual    – reports to L2,          can_approve=False
#  L4  Junior Individual    – reports to L2 or L3,    can_approve=False
#
#  Field order in EMPLOYEES list:
#    (emp_code, full_name, email, dept, designation, phone,
#     level, manager_key, can_approve, password_hash)
#
#  manager_key is a string key into the EMPLOYEES dict (built below)
# ─────────────────────────────────────────────────────────────────────────────

EMPLOYEES_DEF = [
    # ── Level 1 ──────────────────────────────────────────────────────────────
    ("DEMO001","Rajesh Sharma",      "rajesh.sharma@gnxtsystems.com",
     "Engineering","VP Engineering",         "+919876543210", 1, None,          True,  PWD_MGR),

    ("DEMO002","Priya Nair",         "priya.nair@gnxtsystems.com",
     "HR",         "HR Director",            "+919876543211", 1, None,          True,  PWD_MGR),

    ("DEMO003","Sanjay Mehta",       "sanjay.mehta@gnxtsystems.com",
     "Finance",    "Finance Director",       "+919876543212", 1, None,          True,  PWD_MGR),

    # ── Level 2 ──────────────────────────────────────────────────────────────
    ("DEMO004","Neha Gupta",         "neha.gupta@gnxtsystems.com",
     "Engineering","Engineering Manager",    "+919876543213", 2, "DEMO001",     True,  PWD_MGR),

    ("DEMO005","Amit Singh",         "amit.singh@gnxtsystems.com",
     "QA",         "QA Lead",                "+919876543214", 2, "DEMO001",     True,  PWD_MGR),

    ("DEMO006","Kavya Patel",        "kavya.patel@gnxtsystems.com",
     "Product",    "Senior Product Manager", "+919876543215", 2, "DEMO001",     True,  PWD_MGR),

    ("DEMO007","Rahul Verma",        "rahul.verma@gnxtsystems.com",
     "DevOps",     "DevOps Lead",            "+919876543216", 2, "DEMO001",     True,  PWD_MGR),

    ("DEMO008","Pooja Agarwal",      "pooja.agarwal@gnxtsystems.com",
     "HR",         "HR Business Partner",    "+919876543217", 2, "DEMO002",     True,  PWD_MGR),

    # ── Level 3 ──────────────────────────────────────────────────────────────
    ("DEMO009","Arjun Kumar",        "arjun.kumar@gnxtsystems.com",
     "Engineering","Senior Software Engineer","+919876543218",3, "DEMO004",     False, PWD_HASH),

    ("DEMO010","Divya Joshi",        "divya.joshi@gnxtsystems.com",
     "QA",         "Senior QA Engineer",     "+919876543219", 3, "DEMO005",     False, PWD_HASH),

    ("DEMO011","Akash Chauhan",      "akash.chauhan@gnxtsystems.com",
     "DevOps",     "Senior DevOps Engineer", "+919876543220", 3, "DEMO007",     False, PWD_HASH),

    ("DEMO012","Shreya Bansal",      "shreya.bansal@gnxtsystems.com",
     "Product",    "Product Manager",        "+919876543221", 3, "DEMO006",     False, PWD_HASH),

    ("DEMO013","Rohit Sinha",        "rohit.sinha@gnxtsystems.com",
     "Finance",    "Senior Finance Analyst", "+919876543222", 3, "DEMO003",     False, PWD_HASH),

    ("DEMO014","Sneha Dubey",        "sneha.dubey@gnxtsystems.com",
     "Engineering","Senior Software Engineer","+919876543223",3, "DEMO004",     False, PWD_HASH),

    ("DEMO015","Vikram Rathore",     "vikram.rathore@gnxtsystems.com",
     "Sales",      "Sales Manager",          "+919876543224", 3, None,          True,  PWD_MGR),

    # ── Level 4 ──────────────────────────────────────────────────────────────
    ("DEMO016","Ananya Mishra",      "ananya.mishra@gnxtsystems.com",
     "Engineering","Software Engineer",      "+919876543225", 4, "DEMO009",     False, PWD_HASH),

    ("DEMO017","Yash Kulkarni",      "yash.kulkarni@gnxtsystems.com",
     "Engineering","Junior Software Engineer","+919876543226",4, "DEMO009",     False, PWD_HASH),

    ("DEMO018","Tanisha Kapoor",     "tanisha.kapoor@gnxtsystems.com",
     "QA",         "QA Engineer",            "+919876543227", 4, "DEMO010",     False, PWD_HASH),

    ("DEMO019","Gaurav Yadav",       "gaurav.yadav@gnxtsystems.com",
     "DevOps",     "DevOps Engineer",        "+919876543228", 4, "DEMO011",     False, PWD_HASH),

    ("DEMO020","Meera Saxena",       "meera.saxena@gnxtsystems.com",
     "Finance",    "Finance Analyst",        "+919876543229", 4, "DEMO013",     False, PWD_HASH),
]

# 5 demo projects  (manager will be wired to DEMO001 / DEMO004 etc. after insert)
DEMO_PROJECTS = [
    ("DPRJ01","HourHive Platform",      "gNxt Systems",      "2024-06-01", None,         "active",
     "DEMO001","Core time-tracking SaaS platform development"),
    ("DPRJ02","Client Portal Redesign", "Reliance Industries","2025-01-01","2025-12-31","active",
     "DEMO004","UX overhaul of the client self-service portal"),
    ("DPRJ03","CI/CD Modernisation",    "TCS",               "2025-03-01", None,         "active",
     "DEMO007","Migrate legacy Jenkins pipelines to GitHub Actions"),
    ("DPRJ04","QA Automation Suite",    "Infosys",           "2025-02-01","2026-01-31","active",
     "DEMO005","Selenium + Playwright test automation for 3 products"),
    ("DPRJ05","HR Analytics Dashboard", "Wipro",             "2025-04-01", None,         "active",
     "DEMO002","People-analytics dashboards for HR leadership"),
]

# Activities to use for demo timesheets
DEMO_ACTIVITIES = [
    ("ACT001","Development",      "Development",     True),
    ("ACT002","Code Review",      "Development",     True),
    ("ACT003","Unit Testing",     "Testing",         True),
    ("ACT005","Bug Fixing",       "Development",     True),
    ("ACT006","Documentation",    "Documentation",   False),
    ("ACT008","Sprint Planning",  "Planning",        False),
    ("ACT012","Client Meeting",   "Communication",   True),
    ("ACT013","Internal Meeting", "Communication",   False),
    ("ACT018","Support & Maintenance","Support",     True),
]

DESCS = {
    "ACT001":["Implemented REST endpoints for timesheet module",
              "Built dashboard stat-card components in React",
              "Developed role-based access control middleware",
              "Integrated Google OAuth into auth flow",
              "Implemented Redis caching for report queries"],
    "ACT002":["PR review — authentication module refactor",
              "Reviewed payment service, flagged N+1 query",
              "Code review for React component lifecycle fixes"],
    "ACT003":["Unit tests for user service — 92% coverage",
              "Pytest fixtures for API endpoint tests",
              "Mock-based tests for email service"],
    "ACT005":["Fixed session token expiry edge case",
              "Resolved race condition in concurrent writes",
              "Fixed UI rendering glitch in Safari"],
    "ACT006":["Updated Swagger docs for new endpoints",
              "Wrote technical design doc for microservices split",
              "Prepared deployment runbook"],
    "ACT008":["Sprint 14 planning — 38 story points estimated",
              "Backlog refinement and story pointing",
              "Sprint retrospective facilitation"],
    "ACT012":["Weekly status call with client stakeholders",
              "Requirements walkthrough with product team",
              "Monthly project review with client"],
    "ACT013":["Daily standup and blocker resolution",
              "Cross-team sync on API contract changes",
              "Team retrospective session"],
    "ACT018":["L2 support for prod issue — auth timeout",
              "On-call support — nightly batch failure",
              "RCA preparation for production incident"],
}

REJECTION_COMMENTS = [
    "Please add descriptions for all entries.",
    "Total hours for Wednesday look incorrect — please review.",
    "Missing entries for Thursday.",
]

APPROVAL_COMMENTS = [
    "Looks good. Approved.",
    "All entries verified. Approved.",
    None, None,
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def upsert_user(cur, code, full_name, email, pwd, role,
                dept, desig, phone, manager_id, can_approve, sa_id):
    """Insert user if not present; return id."""
    cur.execute("SELECT id FROM user_master WHERE email=%s", (email,))
    row = cur.fetchone()
    if row:
        # Update fields in case they changed
        cur.execute("""
            UPDATE user_master SET
                full_name=%s, department=%s, designation=%s, phone=%s,
                manager_id=%s, can_approve_timesheets=%s, updated_at=%s, updated_by=%s
            WHERE id=%s
        """, (full_name, dept, desig, phone, manager_id, can_approve, NOW, sa_id, row[0]))
        return row[0]
    else:
        cur.execute("""
            INSERT INTO user_master
                (employee_code, full_name, email, password_hash, role, status,
                 department, designation, phone, manager_id, can_approve_timesheets,
                 created_by, created_at, updated_by, updated_at, is_deleted)
            VALUES (%s,%s,%s,%s,%s,'active',%s,%s,%s,%s,%s,%s,%s,%s,%s,0)
        """, (code, full_name, email, pwd, role, dept, desig, phone,
              manager_id, can_approve, sa_id, NOW, sa_id, NOW))
        cur.execute("SELECT LAST_INSERT_ID()")
        return cur.fetchone()[0]


def upsert_project(cur, code, name, cust, start, end, status, mgr_id, desc, sa_id):
    cur.execute("SELECT id FROM project_master WHERE project_code=%s", (code,))
    row = cur.fetchone()
    if row:
        cur.execute("""
            UPDATE project_master SET project_name=%s, project_manager_id=%s,
            status=%s, updated_at=%s, updated_by=%s WHERE id=%s
        """, (name, mgr_id, status, NOW, sa_id, row[0]))
        return row[0]
    else:
        cur.execute("""
            INSERT INTO project_master
                (project_code, project_name, customer_name, start_date, end_date,
                 status, project_manager_id, description,
                 created_by, created_at, updated_by, updated_at, is_deleted)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,0)
        """, (code, name, cust, start, end, status, mgr_id, desc, sa_id, NOW, sa_id, NOW))
        cur.execute("SELECT LAST_INSERT_ID()")
        return cur.fetchone()[0]


def ensure_activity(cur, code, name, cat, billable, sa_id):
    cur.execute("SELECT id FROM activity_master WHERE activity_code=%s", (code,))
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute("""
        INSERT INTO activity_master
            (activity_code, activity_name, category, is_billable, status,
             created_by, created_at, updated_by, updated_at, is_deleted)
        VALUES (%s,%s,%s,%s,'active',%s,%s,%s,%s,0)
    """, (code, name, cat, 1 if billable else 0, sa_id, NOW, sa_id, NOW))
    cur.execute("SELECT LAST_INSERT_ID()")
    return cur.fetchone()[0]


def seed_timesheets_for_user(cur, emp_id, approver_id, project_ids, act_map, sa_id):
    """Generate 9 weeks of timesheet data for a single employee."""
    act_codes = ["ACT001","ACT002","ACT003","ACT005","ACT006","ACT008","ACT012","ACT013","ACT018"]
    act_ids   = [act_map[c] for c in act_codes if c in act_map]

    # Week status schedule: oldest→newest
    statuses = ["approved","approved","approved","approved",
                "approved","rejected","submitted","submitted","draft"]

    for wi, ((ws, we), status) in enumerate(zip(WEEKS, statuses)):
        wdays = working_days(ws, we)
        if not wdays:
            continue

        day_entries = []
        total_hours = 0.0
        proj = random.choice(project_ids)

        for wday in wdays:
            if random.random() < 0.05:   # ~5% leave
                continue
            n_entries = random.choices([1, 2, 3], weights=[35, 50, 15])[0]
            hours_left = round(random.uniform(7.0, 9.0), 2)
            for j in range(n_entries):
                if hours_left <= 0:
                    break
                h = hours_left if j == n_entries - 1 else min(
                    round(random.choice([1.0,1.5,2.0,2.5,3.0,3.5]), 2),
                    hours_left - 0.5
                )
                if h <= 0:
                    h = hours_left
                h = round(h, 2)
                hours_left = round(hours_left - h, 2)
                act_id  = random.choice(act_ids)
                act_code = [c for c,i in act_map.items() if i == act_id][0]
                desc     = random.choice(DESCS.get(act_code, DESCS["ACT001"]))
                is_b     = 1 if any(a[0]==act_code and a[3] for a in DEMO_ACTIVITIES) else 0
                day_entries.append((wday, proj, act_id, h, desc, is_b))
                total_hours += h

        if not day_entries:
            continue

        total_hours = round(total_hours, 2)
        submit_dt   = datetime(ws.year, ws.month, ws.day, 17, random.randint(0,59)) + timedelta(days=4)
        approve_dt  = submit_dt + timedelta(hours=random.randint(3, 36))

        submitted_at = approved_by = approved_at = rejected_by = None
        rejection_reason = None
        is_locked = False

        if status == "draft":
            pass
        elif status == "submitted":
            submitted_at = submit_dt
        elif status == "approved":
            submitted_at = submit_dt
            approved_by  = approver_id
            approved_at  = approve_dt
            is_locked    = True
        elif status == "rejected":
            submitted_at = submit_dt
            rejected_by  = approver_id
            rejection_reason = random.choice(REJECTION_COMMENTS)

        # Delete old header for this employee + week to avoid duplicates
        cur.execute("""
            DELETE FROM timesheet_header
            WHERE employee_id=%s AND week_start_date=%s
        """, (emp_id, ws))

        cur.execute("""
            INSERT INTO timesheet_header
                (employee_id, week_start_date, week_end_date, total_hours, status,
                 submitted_at, approved_by, approved_at, rejected_by, rejection_reason, is_locked,
                 created_by, created_at, updated_by, updated_at, is_deleted)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,0)
        """, (emp_id, ws, we, total_hours, status,
              submitted_at, approved_by, approved_at, rejected_by, rejection_reason, is_locked,
              emp_id, NOW, emp_id, NOW))
        hid = cur.execute("SELECT LAST_INSERT_ID()") or None
        cur.execute("SELECT LAST_INSERT_ID()")
        hid = cur.fetchone()[0]

        for wday, proj_id, act_id, h, desc, is_b in day_entries:
            cur.execute("""
                INSERT INTO timesheet_detail
                    (header_id, employee_id, project_id, activity_id, work_date,
                     hours_worked, description, is_billable,
                     created_by, created_at, updated_by, updated_at, is_deleted)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,0)
            """, (hid, emp_id, proj_id, act_id, wday, h, desc, is_b,
                  emp_id, NOW, emp_id, NOW))

        # Approval history
        if status in ("submitted","approved","rejected"):
            cur.execute("""
                INSERT INTO approval_history
                    (header_id, action_by, action, comment, previous_status, new_status, created_at)
                VALUES (%s,%s,'submit',NULL,'draft','submitted',%s)
            """, (hid, emp_id, submit_dt))
        if status == "approved":
            cur.execute("""
                INSERT INTO approval_history
                    (header_id, action_by, action, comment, previous_status, new_status, created_at)
                VALUES (%s,%s,'approve',%s,'submitted','approved',%s)
            """, (hid, approver_id, random.choice(APPROVAL_COMMENTS), approve_dt))
        elif status == "rejected":
            cur.execute("""
                INSERT INTO approval_history
                    (header_id, action_by, action, comment, previous_status, new_status, created_at)
                VALUES (%s,%s,'reject',%s,'submitted','rejected',%s)
            """, (hid, approver_id, rejection_reason,
                  submit_dt + timedelta(hours=random.randint(2,24))))

    print(f"  -> 9 weeks of timesheets inserted for employee id={emp_id}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 62)
    print("  HourHive Demo Seed  (20 employees + Aditi's timesheets)")
    print("=" * 62)

    conn = pymysql.connect(**DB)
    cur  = conn.cursor()

    try:
        # Get super_admin id
        cur.execute("SELECT id FROM user_master WHERE role='super_admin' LIMIT 1")
        row = cur.fetchone()
        if not row:
            print("ERROR: No super_admin found. Run the main seed first or create the super admin account.")
            sys.exit(1)
        sa_id = row[0]
        print(f"\nSuper admin id = {sa_id}")

        # ── STEP 1: Insert / update the 20 demo employees ────────────────────
        print("\n[1/4] Upserting 20 demo employees…")

        # First pass: insert L1 employees (no manager)
        id_map = {}   # emp_code → db id
        for (code, name, email, dept, desig, phone,
             level, mgr_key, can_approve, pwd) in EMPLOYEES_DEF:
            if mgr_key is None:
                uid = upsert_user(cur, code, name, email, pwd, "employee",
                                  dept, desig, phone, None, can_approve, sa_id)
                id_map[code] = uid
                print(f"    {code}  {name:<28}  L{level}  id={uid}")

        conn.commit()

        # Second pass: L2+ (need manager ids)
        for (code, name, email, dept, desig, phone,
             level, mgr_key, can_approve, pwd) in EMPLOYEES_DEF:
            if mgr_key is not None:
                mgr_id = id_map.get(mgr_key)
                uid = upsert_user(cur, code, name, email, pwd, "employee",
                                  dept, desig, phone, mgr_id, can_approve, sa_id)
                id_map[code] = uid
                print(f"    {code}  {name:<28}  L{level}  mgr={mgr_key}  id={uid}")

        conn.commit()
        print(f"  -> {len(id_map)} employees upserted")

        # ── STEP 2: Projects ─────────────────────────────────────────────────
        print("\n[2/4] Upserting 5 demo projects…")
        proj_id_map = {}  # proj_code → db id
        for (pcode, pname, cust, start, end, status, mgr_key, desc) in DEMO_PROJECTS:
            mgr_id = id_map.get(mgr_key, sa_id)
            pid = upsert_project(cur, pcode, pname, cust, start, end, status, mgr_id, desc, sa_id)
            proj_id_map[pcode] = pid
            print(f"    {pcode}  {pname:<30}  mgr={mgr_key}  id={pid}")
        conn.commit()

        # ── STEP 3: Activities ───────────────────────────────────────────────
        print("\n[3/4] Ensuring demo activities exist…")
        act_map = {}  # code → id
        for (code, name, cat, billable) in DEMO_ACTIVITIES:
            aid = ensure_activity(cur, code, name, cat, billable, sa_id)
            act_map[code] = aid
        conn.commit()
        print(f"  -> {len(act_map)} activities confirmed")

        # ── STEP 4: Timesheets for your-email@gmail.com ─────────────────
        print("\n[4/4] Timesheet data for your-email@gmail.com…")
        cur.execute("SELECT id FROM user_master WHERE email=%s", ("your-email@gmail.com",))
        row = cur.fetchone()
        if not row:
            print("  WARNING: User your-email@gmail.com not found in DB. "
                  "Please register with this email in the app first, then re-run.")
        else:
            aditi_id = row[0]
            # Find her manager (DEMO004 Neha Gupta, Engineering) as approver
            approver_id = id_map.get("DEMO004", sa_id)
            # Update her manager field while we're at it
            cur.execute("""
                UPDATE user_master
                SET manager_id=%s, department='Engineering', designation='Software Engineer',
                    updated_at=%s, updated_by=%s
                WHERE id=%s
            """, (approver_id, NOW, sa_id, aditi_id))
            conn.commit()

            all_proj_ids = list(proj_id_map.values())
            seed_timesheets_for_user(cur, aditi_id, approver_id, all_proj_ids, act_map, sa_id)
            conn.commit()

        # ── Summary ──────────────────────────────────────────────────────────
        cur.execute("SELECT COUNT(*) FROM user_master WHERE role='employee'")
        total_emp = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM project_master")
        total_proj = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM timesheet_header")
        total_ts = cur.fetchone()[0]

        print("\n" + "=" * 62)
        print("  DEMO SEED COMPLETE!")
        print("=" * 62)
        print(f"  Total employees in DB  : {total_emp}")
        print(f"  Total projects in DB   : {total_proj}")
        print(f"  Total timesheet weeks  : {total_ts}")
        print()
        print("  Org hierarchy inserted:")
        print("  L1 (VP/Director)     : Rajesh Sharma, Priya Nair, Sanjay Mehta, Vikram Rathore")
        print("  L2 (Manager/Lead)    : Neha Gupta, Amit Singh, Kavya Patel, Rahul Verma, Pooja Agarwal")
        print("  L3 (Senior)          : Arjun Kumar, Divya Joshi, Akash Chauhan, Shreya Bansal,")
        print("                         Rohit Sinha, Sneha Dubey")
        print("  L4 (Junior)          : Ananya Mishra, Yash Kulkarni, Tanisha Kapoor,")
        print("                         Gaurav Yadav, Meera Saxena")
        print()
        print("  All employee logins   : Employee@123")
        print("  Manager logins        : Manager@123")
        print()
        print("  Timesheet weeks generated for your-email@gmail.com:")
        for i,(ws,we) in enumerate(WEEKS):
            statuses = ["approved","approved","approved","approved",
                        "approved","rejected","submitted","submitted","draft"]
            print(f"    Week {ws} to {we}  [{statuses[i]}]")
        print("=" * 62)

    except Exception as exc:
        conn.rollback()
        import traceback
        print(f"\nSeed FAILED: {exc}")
        traceback.print_exc()
        sys.exit(1)
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
