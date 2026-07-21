#!/usr/bin/env python3
"""
Tymvora — Demo Data Cleanup
Preserves: table structure, alembic_version, super_admin account
Removes:   all demo/test data and resets AUTO_INCREMENT
"""
import pymysql, sys

DB = dict(host="localhost", port=3306, user="root", password="root",
          db="hourhive", charset="utf8mb4", autocommit=True)

def run(cur, sql, label=""):
    cur.execute(sql)
    rows = cur.rowcount
    if label:
        print(f"  {label:<40} {rows if rows >= 0 else ''}")

def main():
    print("=" * 60)
    print("  Tymvora Demo Data Cleanup")
    print("=" * 60)

    c = pymysql.connect(**DB)
    cur = c.cursor()

    # ── Pre-cleanup counts ────────────────────────────────────────────────────
    print("\nPre-cleanup row counts:")
    tables = [
        "approval_history", "timesheet_detail", "timesheet_header",
        "audit_log", "notification_log", "holiday_master",
        "system_config", "project_master", "activity_master", "user_master",
    ]
    for t in tables:
        cur.execute(f"SELECT COUNT(*) FROM `{t}`")
        print(f"  {t:<35} {cur.fetchone()[0]:>8} rows")

    print("\nCleaning data...")

    # ── Disable FK checks ────────────────────────────────────────────────────
    run(cur, "SET FOREIGN_KEY_CHECKS = 0")

    # ── Transactional tables (child → parent order) ───────────────────────────
    run(cur, "TRUNCATE TABLE `approval_history`",  "approval_history   TRUNCATED")
    run(cur, "TRUNCATE TABLE `timesheet_detail`",  "timesheet_detail   TRUNCATED")
    run(cur, "TRUNCATE TABLE `timesheet_header`",  "timesheet_header   TRUNCATED")
    run(cur, "TRUNCATE TABLE `audit_log`",          "audit_log          TRUNCATED")
    run(cur, "TRUNCATE TABLE `notification_log`",   "notification_log   TRUNCATED")

    # ── Master / reference data ───────────────────────────────────────────────
    run(cur, "TRUNCATE TABLE `holiday_master`",     "holiday_master     TRUNCATED")
    run(cur, "TRUNCATE TABLE `system_config`",      "system_config      TRUNCATED")
    run(cur, "TRUNCATE TABLE `project_master`",     "project_master     TRUNCATED")
    run(cur, "TRUNCATE TABLE `activity_master`",    "activity_master    TRUNCATED")

    # ── Users — keep only super_admin ─────────────────────────────────────────
    run(cur, "DELETE FROM `user_master` WHERE `role` IN ('admin', 'employee')",
        "user_master        admin/employee rows deleted")

    # ── Reset AUTO_INCREMENT ──────────────────────────────────────────────────
    # TRUNCATE already resets to 1 automatically for all truncated tables.
    # For user_master (DELETE used, not TRUNCATE) set it explicitly.
    cur.execute("SELECT COALESCE(MAX(`id`), 0) + 1 FROM `user_master`")
    next_id = cur.fetchone()[0]
    run(cur, f"ALTER TABLE `user_master` AUTO_INCREMENT = {next_id}",
        f"user_master        AUTO_INCREMENT -> {next_id}")

    # ── Re-enable FK checks ───────────────────────────────────────────────────
    run(cur, "SET FOREIGN_KEY_CHECKS = 1")

    # ── Post-cleanup verification ─────────────────────────────────────────────
    print("\nPost-cleanup verification:")
    print(f"  {'Table':<35} {'Rows':>8}  {'AUTO_INCREMENT':>15}")
    print("  " + "-" * 64)

    cur.execute("""
        SELECT t.TABLE_NAME, t.AUTO_INCREMENT
        FROM information_schema.TABLES t
        WHERE t.TABLE_SCHEMA = DATABASE()
          AND t.TABLE_NAME NOT IN ('alembic_version')
        ORDER BY t.TABLE_NAME
    """)
    meta = {row[0]: row[1] for row in cur.fetchall()}

    for t in sorted(tables):
        cur.execute(f"SELECT COUNT(*) FROM `{t}`")
        cnt = cur.fetchone()[0]
        ai = meta.get(t, "n/a")
        ok = "[OK]" if cnt == 0 or t == "user_master" else "[!]"
        print(f"  {ok} {t:<33} {cnt:>8}  {str(ai):>15}")

    # Alembic
    cur.execute("SELECT version_num FROM alembic_version")
    ver = cur.fetchone()[0]
    print(f"\n  alembic_version : {ver}  (preserved)")

    # Super admin
    cur.execute("SELECT id, employee_code, full_name, email, role, status "
                "FROM user_master WHERE role = 'super_admin'")
    row = cur.fetchone()
    if row:
        print(f"  super_admin     : {row[3]} — {row[2]}  (preserved)")
    else:
        print("  WARNING: super_admin not found!")

    print("\n" + "=" * 60)
    print("  Cleanup complete.")
    print("  To reseed:  cd backend && python seed_data.py")
    print("=" * 60)
    c.close()

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        import traceback
        print(f"\nFailed: {e}")
        traceback.print_exc()
        sys.exit(1)
