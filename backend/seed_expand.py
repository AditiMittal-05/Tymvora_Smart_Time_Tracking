#!/usr/bin/env python3
"""
Tymvora Expand Seed  –  seed_expand.py
=========================================
• Adds 15 more employees randomly distributed under existing approver-managers
• Adds 15 more projects (with realistic data) assigned to managers
• Seeds 9 weeks of timesheet data for every new employee
• Existing data is NOT wiped

Run from the backend directory:
    cd backend && python seed_expand.py
"""
import sys, random
from datetime import date, datetime, timedelta, timezone

import pymysql
import bcrypt

DB = dict(host="localhost", port=3306, user="root", password="root",
          database="hourhive", charset="utf8mb4", autocommit=False)

random.seed(77)
NOW   = datetime.now(timezone.utc).replace(tzinfo=None)
TODAY = date.today()

def monday_of(d): return d - timedelta(days=d.weekday())

BASE_MON = monday_of(TODAY) - timedelta(weeks=1)
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

print("Hashing passwords...")
PWD_HASH = bcrypt.hashpw(b"Employee@123", bcrypt.gensalt()).decode()

# ── 15 new employees with varied departments ──────────────────────────────────
# manager_key references the DEMO codes whose DB ids we'll look up
# format: (emp_code, full_name, email, dept, designation, phone, mgr_code)
NEW_EMPLOYEES = [
    # Engineering  (under Neha Gupta DEMO004 or Arjun Kumar DEMO009)
    ("EXP001","Karan Dubey",       "karan.dubey@tymvora.com",
     "Engineering","Software Engineer",            "+918800112201","DEMO004"),

    ("EXP002","Ishaan Bhatt",      "ishaan.bhatt@tymvora.com",
     "Engineering","Software Engineer",            "+918800112202","DEMO009"),

    ("EXP003","Pallavi Mishra",    "pallavi.mishra@tymvora.com",
     "Engineering","Junior Software Engineer",     "+918800112203","DEMO009"),

    # QA  (under Amit Singh DEMO005 or Divya Joshi DEMO010)
    ("EXP004","Rohan Tiwari",      "rohan.tiwari@tymvora.com",
     "QA",         "QA Engineer",                 "+918800112204","DEMO005"),

    ("EXP005","Nisha Kaur",        "nisha.kaur@tymvora.com",
     "QA",         "Senior QA Engineer",          "+918800112205","DEMO005"),

    # DevOps  (under Rahul Verma DEMO007 or Akash Chauhan DEMO011)
    ("EXP006","Deepak Nair",       "deepak.nair@tymvora.com",
     "DevOps",     "DevOps Engineer",             "+918800112206","DEMO007"),

    ("EXP007","Simran Arora",      "simran.arora@tymvora.com",
     "DevOps",     "Site Reliability Engineer",   "+918800112207","DEMO011"),

    # Product  (under Kavya Patel DEMO006)
    ("EXP008","Vaibhav Jain",      "vaibhav.jain@tymvora.com",
     "Product",    "Associate Product Manager",   "+918800112208","DEMO006"),

    ("EXP009","Shreeram Kulkarni", "shreeram.kulkarni@tymvora.com",
     "Product",    "Product Manager",             "+918800112209","DEMO006"),

    # Finance  (under Sanjay Mehta DEMO003 or Rohit Sinha DEMO013)
    ("EXP010","Kavita Sharma",     "kavita.sharma@tymvora.com",
     "Finance",    "Accountant",                  "+918800112210","DEMO003"),

    ("EXP011","Alok Verma",        "alok.verma@tymvora.com",
     "Finance",    "Finance Executive",           "+918800112211","DEMO013"),

    # HR  (under Priya Nair DEMO002 or Pooja Agarwal DEMO008)
    ("EXP012","Sunita Rao",        "sunita.rao@tymvora.com",
     "HR",         "HR Executive",                "+918800112212","DEMO002"),

    ("EXP013","Hemant Pandey",     "hemant.pandey@tymvora.com",
     "HR",         "Talent Acquisition Specialist","+918800112213","DEMO008"),

    # Sales  (under Vikram Rathore DEMO015)
    ("EXP014","Tanmay Shah",       "tanmay.shah@tymvora.com",
     "Sales",      "Sales Executive",             "+918800112214","DEMO015"),

    ("EXP015","Prerna Soni",       "prerna.soni@tymvora.com",
     "Sales",      "Senior Sales Executive",      "+918800112215","DEMO015"),
]

# ── 15 more projects ──────────────────────────────────────────────────────────
# (proj_code, name, customer, start, end, status, mgr_code, description)
NEW_PROJECTS = [
    ("DPRJ06","Mobile Banking App",       "Axis Bank",       "2025-01-15",None,        "active",
     "DEMO001","Cross-platform mobile banking app with UPI, NEFT and FD management"),

    ("DPRJ07","ERP Integration Layer",   "Mahindra Group",  "2025-02-01","2026-01-31","active",
     "DEMO004","REST API integration middleware between SAP and custom ERP modules"),

    ("DPRJ08","DevSecOps Pipeline",       "Mphasis",         "2025-03-01",None,        "active",
     "DEMO007","Automated SAST/DAST scanning embedded in GitHub Actions CI pipeline"),

    ("DPRJ09","Test Automation Framework","Zensar",          "2025-01-01","2025-12-31","active",
     "DEMO005","Playwright + Allure test automation framework for web and API layers"),

    ("DPRJ10","Data Warehouse Rebuild",  "HDFC Bank",       "2024-11-01",None,        "active",
     "DEMO001","Snowflake-based cloud DWH replacing legacy Teradata warehouse"),

    ("DPRJ11","Customer 360 Platform",   "Airtel",          "2025-04-01",None,        "active",
     "DEMO006","Unified customer profile aggregating CRM, billing and support data"),

    ("DPRJ12","Kubernetes Migration",    "Wipro",           "2025-02-15","2025-11-30","active",
     "DEMO007","Lift-and-shift of 80+ microservices from VMs to EKS cluster"),

    ("DPRJ13","People Analytics Suite",  "Infosys",         "2025-05-01",None,        "active",
     "DEMO002","HR metrics dashboard covering attrition, performance and L&D"),

    ("DPRJ14","Invoice Automation",      "Bajaj Finance",   "2025-03-15",None,        "active",
     "DEMO003","OCR-based invoice processing with 3-way PO matching and SAP posting"),

    ("DPRJ15","Fraud Detection v2",      "ICICI Bank",      "2025-06-01",None,        "active",
     "DEMO001","Graph-neural-network upgrade to real-time fraud scoring engine"),

    ("DPRJ16","Cloud Cost Optimisation", "TCS",             "2025-04-15","2025-10-31","active",
     "DEMO007","FinOps program reducing AWS spend by 30 pct via right-sizing and RI"),

    ("DPRJ17","Compliance Portal",       "Deloitte",        "2025-01-01","2025-12-31","active",
     "DEMO006","Automated GDPR/ISO-27001 compliance tracking and audit reporting"),

    ("DPRJ18","AI Recommendation Engine","Flipkart",        "2025-05-15",None,        "active",
     "DEMO004","Collaborative filtering recommendation service handling 5M req/day"),

    ("DPRJ19","Sales CRM Enhancement",  "Naukri",          "2025-03-01","2025-09-30","active",
     "DEMO015","Salesforce customisation with lead scoring and pipeline automation"),

    ("DPRJ20","Logistics Tracking v3",   "Blue Dart",       "2025-06-01",None,        "active",
     "DEMO007","IoT + ML real-time parcel tracking with ETA prediction"),
]

# Activities map (code -> id fetched from DB)
ACT_CODES = ["ACT001","ACT002","ACT003","ACT005","ACT006","ACT008","ACT012","ACT013","ACT018"]

DESCS = {
    "ACT001":["Implemented REST endpoints for new module",
              "Built React dashboard components",
              "Developed role-based access middleware",
              "Integrated third-party API SDK",
              "Implemented Redis caching layer"],
    "ACT002":["PR review — auth module refactor",
              "Reviewed DB queries, flagged N+1 issue",
              "Code review for React lifecycle fixes"],
    "ACT003":["Unit tests for service layer — 91% coverage",
              "Pytest fixtures for API tests",
              "Mock-based tests for email service"],
    "ACT005":["Fixed session token expiry edge case",
              "Resolved race condition in concurrent writes",
              "Fixed rendering glitch in Safari"],
    "ACT006":["Updated Swagger docs for new endpoints",
              "Wrote technical design document",
              "Prepared deployment runbook"],
    "ACT008":["Sprint planning — 40 story points estimated",
              "Backlog refinement session",
              "Sprint retrospective facilitation"],
    "ACT012":["Weekly status call with client",
              "Requirements walkthrough session",
              "Monthly project review with stakeholders"],
    "ACT013":["Daily standup and blocker resolution",
              "Cross-team sync on API contract changes",
              "Team retrospective session"],
    "ACT018":["L2 support for prod auth timeout issue",
              "On-call support for nightly batch failure",
              "RCA preparation for production incident"],
}

BILLABLE = {"ACT001":True,"ACT002":True,"ACT003":True,"ACT005":True,"ACT006":False,
            "ACT008":False,"ACT012":True,"ACT013":False,"ACT018":True}

REJECTION_COMMENTS = [
    "Please add descriptions for all entries.",
    "Total hours for Wednesday look incorrect — please review.",
    "Missing entries for Thursday. Please account for all working days.",
    "Please split large entries into separate activities.",
]

APPROVAL_COMMENTS = [
    "Looks good. Approved.",
    "All entries verified. Approved.",
    "Great work this week. Approved.",
    None, None,
]

WEEK_STATUSES = ["approved","approved","approved","approved",
                 "approved","rejected","submitted","submitted","draft"]


def upsert_employee(cur, code, full_name, email, dept, desig, phone, mgr_id, sa_id):
    cur.execute("SELECT id FROM user_master WHERE email=%s", (email,))
    row = cur.fetchone()
    if row:
        cur.execute("""UPDATE user_master SET full_name=%s, department=%s, designation=%s,
                       phone=%s, manager_id=%s, can_approve_timesheets=0,
                       updated_at=%s, updated_by=%s WHERE id=%s""",
                    (full_name, dept, desig, phone, mgr_id, NOW, sa_id, row[0]))
        return row[0], False
    cur.execute("""
        INSERT INTO user_master
            (employee_code,full_name,email,password_hash,role,status,
             department,designation,phone,manager_id,can_approve_timesheets,
             created_by,created_at,updated_by,updated_at,is_deleted)
        VALUES (%s,%s,%s,%s,'employee','active',%s,%s,%s,%s,0,%s,%s,%s,%s,0)
    """, (code, full_name, email, PWD_HASH, dept, desig, phone, mgr_id,
          sa_id, NOW, sa_id, NOW))
    cur.execute("SELECT LAST_INSERT_ID()")
    return cur.fetchone()[0], True


def upsert_project(cur, code, name, cust, start, end, status, mgr_id, desc, sa_id):
    cur.execute("SELECT id FROM project_master WHERE project_code=%s", (code,))
    row = cur.fetchone()
    if row:
        cur.execute("""UPDATE project_master SET project_name=%s, project_manager_id=%s,
                       status=%s, updated_at=%s, updated_by=%s WHERE id=%s""",
                    (name, mgr_id, status, NOW, sa_id, row[0]))
        return row[0]
    cur.execute("""
        INSERT INTO project_master
            (project_code,project_name,customer_name,start_date,end_date,
             status,project_manager_id,description,
             created_by,created_at,updated_by,updated_at,is_deleted)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,0)
    """, (code, name, cust, start, end, status, mgr_id, desc, sa_id, NOW, sa_id, NOW))
    cur.execute("SELECT LAST_INSERT_ID()")
    return cur.fetchone()[0]


def seed_timesheets(cur, emp_id, approver_id, all_proj_ids, act_map, sa_id):
    for wi, (ws, we) in enumerate(WEEKS):
        status = WEEK_STATUSES[wi]
        wdays  = working_days(ws, we)
        if not wdays:
            continue

        day_entries = []
        total_hours = 0.0
        proj = random.choice(all_proj_ids)

        for wday in wdays:
            if random.random() < 0.06:
                continue
            n = random.choices([1,2,3], weights=[35,50,15])[0]
            hours_left = round(random.uniform(7.0, 9.0), 2)
            for j in range(n):
                if hours_left <= 0:
                    break
                h = hours_left if j == n-1 else min(
                    round(random.choice([1.0,1.5,2.0,2.5,3.0,3.5]),2), hours_left-0.5)
                if h <= 0:
                    h = hours_left
                h = round(h, 2); hours_left = round(hours_left-h, 2)
                act_code = random.choice(ACT_CODES)
                act_id   = act_map.get(act_code, list(act_map.values())[0])
                desc     = random.choice(DESCS.get(act_code, DESCS["ACT001"]))
                is_b     = 1 if BILLABLE.get(act_code, True) else 0
                day_entries.append((wday, proj, act_id, h, desc, is_b))
                total_hours += h

        if not day_entries:
            continue

        total_hours = round(total_hours, 2)
        submit_dt  = datetime(ws.year,ws.month,ws.day,17,random.randint(0,59)) + timedelta(days=4)
        approve_dt = submit_dt + timedelta(hours=random.randint(3,36))

        submitted_at = approved_by = approved_at = rejected_by = None
        rejection_reason = None; is_locked = False

        if status == "submitted":
            submitted_at = submit_dt
        elif status == "approved":
            submitted_at=submit_dt; approved_by=approver_id
            approved_at=approve_dt; is_locked=True
        elif status == "rejected":
            submitted_at=submit_dt; rejected_by=approver_id
            rejection_reason=random.choice(REJECTION_COMMENTS)

        cur.execute("DELETE FROM timesheet_header WHERE employee_id=%s AND week_start_date=%s",
                    (emp_id, ws))

        cur.execute("""
            INSERT INTO timesheet_header
                (employee_id,week_start_date,week_end_date,total_hours,status,
                 submitted_at,approved_by,approved_at,rejected_by,rejection_reason,is_locked,
                 created_by,created_at,updated_by,updated_at,is_deleted)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,0)
        """, (emp_id,ws,we,total_hours,status,
              submitted_at,approved_by,approved_at,rejected_by,rejection_reason,is_locked,
              emp_id,NOW,emp_id,NOW))
        cur.execute("SELECT LAST_INSERT_ID()")
        hid = cur.fetchone()[0]

        for wday, proj_id, act_id, h, desc, is_b in day_entries:
            cur.execute("""
                INSERT INTO timesheet_detail
                    (header_id,employee_id,project_id,activity_id,work_date,
                     hours_worked,description,is_billable,
                     created_by,created_at,updated_by,updated_at,is_deleted)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,0)
            """, (hid,emp_id,proj_id,act_id,wday,h,desc,is_b,emp_id,NOW,emp_id,NOW))

        if status in ("submitted","approved","rejected"):
            cur.execute("""
                INSERT INTO approval_history
                    (header_id,action_by,action,comment,previous_status,new_status,created_at)
                VALUES (%s,%s,'submit',NULL,'draft','submitted',%s)
            """, (hid, emp_id, submit_dt))
        if status == "approved":
            cur.execute("""
                INSERT INTO approval_history
                    (header_id,action_by,action,comment,previous_status,new_status,created_at)
                VALUES (%s,%s,'approve',%s,'submitted','approved',%s)
            """, (hid, approver_id, random.choice(APPROVAL_COMMENTS), approve_dt))
        elif status == "rejected":
            cur.execute("""
                INSERT INTO approval_history
                    (header_id,action_by,action,comment,previous_status,new_status,created_at)
                VALUES (%s,%s,'reject',%s,'submitted','rejected',%s)
            """, (hid, approver_id, rejection_reason,
                  submit_dt+timedelta(hours=random.randint(2,24))))


def main():
    print("=" * 64)
    print("  HourHive Expand Seed  (15 employees + 15 projects)")
    print("=" * 64)

    conn = pymysql.connect(**DB)
    cur  = conn.cursor()

    try:
        # Super admin id
        cur.execute("SELECT id FROM user_master WHERE role='super_admin' LIMIT 1")
        sa_id = cur.fetchone()[0]
        print(f"Super admin id = {sa_id}")

        # Build a map: DEMO_code -> db id  for existing employees
        cur.execute("SELECT employee_code, id FROM user_master WHERE role='employee'")
        code_to_id = {r[0]: r[1] for r in cur.fetchall()}

        # Fetch all existing project ids
        cur.execute("SELECT id FROM project_master ORDER BY id")
        existing_proj_ids = [r[0] for r in cur.fetchall()]

        # Fetch activity id map
        cur.execute("SELECT activity_code, id FROM activity_master")
        act_map = {r[0]: r[1] for r in cur.fetchall()}

        # ── STEP 1: Insert 15 new employees ──────────────────────────────────
        print(f"\n[1/3] Inserting 15 new employees...")
        new_emp_ids = []
        for (code, name, email, dept, desig, phone, mgr_code) in NEW_EMPLOYEES:
            mgr_id = code_to_id.get(mgr_code)
            if mgr_id is None:
                print(f"  WARNING: manager {mgr_code} not found, skipping manager for {name}")
            uid, created = upsert_employee(cur, code, name, email, dept, desig, phone, mgr_id, sa_id)
            code_to_id[code] = uid
            new_emp_ids.append((uid, mgr_id, name))
            action = "CREATED" if created else "UPDATED"
            print(f"    [{action}]  {code}  {name:<28}  dept={dept:<14}  mgr={mgr_code}  id={uid}")

        conn.commit()
        print(f"  -> {len(new_emp_ids)} employees processed")

        # ── STEP 2: Insert 15 new projects ───────────────────────────────────
        print(f"\n[2/3] Inserting 15 new projects...")
        all_proj_ids = list(existing_proj_ids)
        for (code, name, cust, start, end, status, mgr_code, desc) in NEW_PROJECTS:
            mgr_id = code_to_id.get(mgr_code, sa_id)
            pid = upsert_project(cur, code, name, cust, start, end, status, mgr_id, desc, sa_id)
            all_proj_ids.append(pid)
            print(f"    {code}  {name:<35}  mgr={mgr_code}  id={pid}")

        conn.commit()
        print(f"  -> {len(NEW_PROJECTS)} projects processed  (total in DB: {len(all_proj_ids)})")

        # ── STEP 3: Seed timesheets for new employees ─────────────────────────
        print(f"\n[3/3] Seeding 9 weeks of timesheets for each new employee...")
        for uid, approver_id, name in new_emp_ids:
            if approver_id is None:
                approver_id = sa_id
            seed_timesheets(cur, uid, approver_id, all_proj_ids, act_map, sa_id)
            conn.commit()
            print(f"    {name:<28}  id={uid}  approver_id={approver_id}  -> 9 weeks seeded")

        # ── Summary ──────────────────────────────────────────────────────────
        cur.execute("SELECT COUNT(*) FROM user_master WHERE role='employee'")
        total_emp = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM project_master")
        total_proj = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM timesheet_header")
        total_ts = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM timesheet_detail")
        total_det = cur.fetchone()[0]

        print("\n" + "=" * 64)
        print("  EXPAND SEED COMPLETE!")
        print("=" * 64)
        print(f"  Total employees  : {total_emp}")
        print(f"  Total projects   : {total_proj}")
        print(f"  Timesheet weeks  : {total_ts}")
        print(f"  Timesheet entries: {total_det}")
        print()
        print("  Manager -> Team mapping:")
        print("  Rajesh Sharma (VP Eng)   -> Neha, Amit, Kavya, Rahul + Karan (direct)")
        print("  Neha Gupta   (Eng Mgr)   -> Arjun, Sneha, Karan, Ishaan, Pallavi")
        print("  Arjun Kumar  (Sr SWE)    -> Ananya, Yash, Ishaan, Pallavi")
        print("  Amit Singh   (QA Lead)   -> Divya, Rohan, Nisha")
        print("  Divya Joshi  (Sr QA)     -> Tanisha")
        print("  Rahul Verma  (DevOps)    -> Akash, Deepak")
        print("  Akash Chauhan(Sr DevOps) -> Gaurav, Simran")
        print("  Kavya Patel  (Sr PM)     -> Shreya, Vaibhav, Shreeram")
        print("  Priya Nair   (HR Dir)    -> Pooja, Sunita")
        print("  Pooja Agarwal(HR BP)     -> Hemant")
        print("  Sanjay Mehta (Fin Dir)   -> Rohit, Kavita")
        print("  Rohit Sinha  (Sr Fin)    -> Meera, Alok")
        print("  Vikram Rathore(Sales Mgr)-> Tanmay, Prerna")
        print()
        print("  Password for all new employees: Employee@123")
        print("=" * 64)

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
