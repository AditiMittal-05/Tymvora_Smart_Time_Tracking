#!/usr/bin/env python3
"""
HourHive Enterprise Demo Seed Script
511 users | 55 projects | 20 activities | 26 weeks timesheets
Run: cd backend && python seed_data.py
"""
import sys, os, random, json
from datetime import date, datetime, timedelta, timezone

import pymysql
import bcrypt

# ── Config ────────────────────────────────────────────────────────────────────
DB = dict(host="localhost", port=3306, user="root", password="root",
          db="hourhive", charset="utf8mb4", autocommit=False)
random.seed(42)
NOW   = datetime.now(timezone.utc).replace(tzinfo=None)
TODAY = date.today()

def monday_of(d): return d - timedelta(days=d.weekday())

WEEK_MONDAY = monday_of(TODAY)
WEEKS = [(WEEK_MONDAY - timedelta(weeks=26-i),
          WEEK_MONDAY - timedelta(weeks=26-i) + timedelta(days=6))
         for i in range(27)]   # 26 full past weeks + current partial

HOLIDAYS = {
    date(2025,1,26),date(2025,2,26),date(2025,3,14),date(2025,4,14),
    date(2025,4,18),date(2025,5,1),date(2025,8,15),date(2025,8,27),
    date(2025,10,2),date(2025,10,20),date(2025,10,21),date(2025,11,5),
    date(2025,12,25),date(2026,1,1),date(2026,1,26),date(2026,2,15),
    date(2026,3,4),date(2026,5,1),date(2026,8,15),date(2026,8,28),
    date(2026,10,2),date(2026,10,20),date(2026,11,8),date(2026,11,9),
    date(2026,11,10),date(2026,11,11),date(2026,12,25),
}

def is_working(d): return d.weekday() < 5 and d not in HOLIDAYS

def working_days(ws, we):
    cur, out = ws, []
    while cur <= we:
        if is_working(cur): out.append(cur)
        cur += timedelta(days=1)
    return out

# ── Name pools ────────────────────────────────────────────────────────────────
FIRST = [
    "Aarav","Aditya","Akash","Amit","Ananya","Ankit","Ankita","Ansh","Arjun",
    "Arpit","Aryan","Ashish","Avni","Ayaan","Ayush","Bhavna","Chetan","Deepak",
    "Deepika","Dev","Dhruv","Divya","Gaurav","Gautam","Harsh","Harsha","Hemant",
    "Ishaan","Isha","Jatin","Jay","Jayesh","Jiya","Kabir","Karan","Kavya","Kedar",
    "Kunal","Lalit","Lavanya","Lokesh","Manish","Manisha","Mayank","Meera","Megha",
    "Mihir","Mohit","Mona","Monika","Mukesh","Naman","Neha","Neil","Nikhil","Nitin",
    "Nisha","Pallavi","Parth","Piyush","Pooja","Prachi","Pragya","Pranav","Prashant",
    "Pratik","Prerna","Priya","Rahul","Rajat","Rajesh","Rakesh","Ravi","Reena",
    "Ritesh","Ritu","Rohit","Ronak","Sachin","Sahil","Saloni","Sanjay","Sanket",
    "Sapna","Sarika","Sarthak","Seema","Shubham","Siddharth","Simran","Sneha",
    "Soham","Sourabh","Sunil","Suresh","Swati","Tanisha","Tanmay","Tushar","Uday",
    "Vaibhav","Vansh","Varsha","Vikas","Vikram","Vinay","Vishal","Vivek","Yash",
    "Yogesh","Nidhi","Apurva","Shreya","Shivangi","Payal","Ruchika","Charu",
    "Garima","Heena","Komal","Lata","Madhu","Namrata","Poonam","Ranjana","Shikha",
    "Sunita","Vandana","Geeta","Mamta","Archana","Alok","Devesh","Girish","Hemendra",
    "Jagdish","Kailash","Mahesh","Naresh","Omkar","Prakash","Rajendra","Sanjiv",
    "Umesh","Vinod","Yogendra","Abhishek","Abhinav","Ajay","Ajit","Akhil","Amar",
    "Amol","Anil","Anju","Anup","Ashutosh","Basant","Brijesh","Chirag","Dhananjay",
    "Dinesh","Esha","Farhan","Gunjan","Harshal","Himanshu","Hitesh","Ishan",
    "Kanchan","Kavita","Laxmi","Manoj","Milind","Neeraj","Nilesh","Nirmal",
    "Paresh","Pawan","Preeti","Purva","Raghav","Ravindra","Rekha","Rushikesh",
    "Shailesh","Shalini","Shweta","Sujata","Sumit","Suraj","Tejal","Tejas",
    "Umang","Vipul","Vrushali","Yuvraj","Zainab","Abhi","Meenal","Shreeram",
    "Bhargav","Tariq","Javed","Saurabh","Pradeep","Vijay","Rajan","Sudhir",
]
LAST = [
    "Agarwal","Ahuja","Arora","Bajaj","Bansal","Bhatnagar","Bose","Chauhan",
    "Chawla","Chopra","Desai","Deshpande","Dubey","Dutta","Gandhi","Garg",
    "Ghosh","Goyal","Gupta","Jain","Jha","Joshi","Kapoor","Kaur","Khanna",
    "Kumar","Malhotra","Mathur","Mehta","Mishra","Modi","Nair","Nanda","Pande",
    "Pandey","Patel","Patil","Pillai","Prasad","Rao","Rathore","Reddy","Saha",
    "Saxena","Shah","Sharma","Shukla","Singh","Sinha","Srivastava","Thakur",
    "Tripathi","Upadhyay","Varma","Verma","Yadav","Bajpai","Bhatt","Biswas",
    "Choudhary","Das","Dixit","Dwivedi","Iyer","Kulkarni","Lal","Menon",
    "Naik","Pal","Parikh","Rajan","Ramesh","Roy","Soni","Tiwari","Walia",
    "Bendre","Chandra","Hegde","Nambiar","Krishnan","Subramanian","Raghavan",
    "Murthy","Kamath","Shetty","Rege","Gokhale","Apte","Doshi","Vora","Dalal",
    "Bhavsar","Majumdar","Chattopadhyay","Sengupta","Bhattacharya","Chakraborty",
    "Mukhopadhyay","Bandyopadhyay","Debnath","Mondal","Chatterji","Ghoshal",
    "Sheikh","Ansari","Siddiqui","Khan","Qureshi","Mirza","Hashmi",
]

used_names, used_emails = set(), set()

def gen_name():
    for _ in range(50000):
        f, l = random.choice(FIRST), random.choice(LAST)
        n = f"{f} {l}"
        if n not in used_names:
            used_names.add(n)
            return n, f, l
    raise RuntimeError("Name pool exhausted")

def gen_email(f, l):
    base = f"{f.lower()}.{l.lower()}"
    e, i = f"{base}@gnxtsystems.com", 1
    while e in used_emails:
        e = f"{base}{i}@gnxtsystems.com"; i += 1
    used_emails.add(e)
    return e

def gen_phone():
    p = random.choice(["98","99","97","96","95","94","93","92","91","90","89","88"])
    return f"+91{p}{''.join(str(random.randint(0,9)) for _ in range(8))}"

def rand_join():
    days = random.randint(30, 365*5)
    return (TODAY - timedelta(days=days)).strftime("%Y-%m-%d")

# ── Departments ────────────────────────────────────────────────────────────────
DEPT_CONF = {
    "Engineering": {"count":150,"desigs":["Junior Software Engineer","Software Engineer",
        "Senior Software Engineer","Lead Engineer","Principal Engineer","Staff Engineer",
        "Engineering Manager"],"w":[10,30,30,15,7,5,3]},
    "QA": {"count":55,"desigs":["QA Engineer","Senior QA Engineer","QA Lead",
        "QA Architect","QA Manager"],"w":[25,35,25,10,5]},
    "DevOps": {"count":40,"desigs":["DevOps Engineer","Senior DevOps Engineer",
        "Site Reliability Engineer","DevOps Lead","Infrastructure Manager"],"w":[25,35,20,15,5]},
    "Product": {"count":30,"desigs":["Associate Product Manager","Product Manager",
        "Senior Product Manager","Group Product Manager","VP Product"],"w":[15,35,30,15,5]},
    "HR": {"count":30,"desigs":["HR Executive","Senior HR Executive","HR Business Partner",
        "Talent Acquisition Specialist","HR Manager"],"w":[30,25,20,15,10]},
    "Finance": {"count":30,"desigs":["Finance Analyst","Senior Finance Analyst",
        "Finance Executive","Accountant","Finance Manager"],"w":[30,25,20,15,10]},
    "Sales": {"count":60,"desigs":["Sales Executive","Senior Sales Executive",
        "Business Development Executive","Account Manager","Sales Manager"],"w":[30,25,20,15,10]},
    "Marketing": {"count":35,"desigs":["Marketing Executive","Content Writer",
        "Digital Marketing Specialist","Brand Manager","Marketing Manager"],"w":[25,25,25,15,10]},
    "Support": {"count":50,"desigs":["Support Engineer","Senior Support Engineer",
        "Technical Support Lead","Customer Success Manager","Support Manager"],"w":[30,30,20,12,8]},
    "Management": {"count":20,"desigs":["Team Lead","Manager","Senior Manager",
        "Director","VP Engineering"],"w":[30,30,20,15,5]},
}

# ── Projects ──────────────────────────────────────────────────────────────────
PROJECTS = [
    ("PRJ001","ERP Modernisation","Reliance Industries","2024-01-15",None,"active",
     "Full ERP overhaul migrating legacy Oracle to cloud-native microservices"),
    ("PRJ002","Digital Banking Platform","HDFC Bank","2024-03-01","2025-06-30","active",
     "Next-gen mobile and web banking platform with UPI 2.0 integration"),
    ("PRJ003","Supply Chain Analytics","Tata Motors","2023-11-01","2025-03-31","completed",
     "ML-powered supply chain visibility and predictive analytics dashboard"),
    ("PRJ004","HR Management System","Infosys","2024-06-01",None,"active",
     "Comprehensive HRMS with payroll, leave management, and performance modules"),
    ("PRJ005","Customer 360 Platform","Airtel","2024-02-15","2025-08-31","active",
     "Unified customer data platform integrating CRM, billing, and support"),
    ("PRJ006","Cloud Migration","Wipro","2023-09-01","2024-12-31","completed",
     "AWS cloud migration of 200+ on-premise applications"),
    ("PRJ007","Fraud Detection System","ICICI Bank","2024-04-01",None,"active",
     "Real-time ML-based fraud detection and prevention system"),
    ("PRJ008","Logistics Tracking","Blue Dart","2024-01-01","2024-10-31","completed",
     "End-to-end shipment tracking with IoT integration"),
    ("PRJ009","E-Commerce Platform","Flipkart","2024-07-01",None,"active",
     "High-scale e-commerce platform supporting 10M+ daily transactions"),
    ("PRJ010","Telemedicine App","Apollo Hospitals","2024-05-15",None,"active",
     "Doctor-patient video consultation platform with prescription management"),
    ("PRJ011","Smart City Dashboard","BBMP","2023-12-01","2025-02-28","completed",
     "Integrated smart city operations dashboard for traffic, utilities, and safety"),
    ("PRJ012","InsureTech Portal","LIC","2024-08-01",None,"active",
     "Digital insurance portal for policy management and claims processing"),
    ("PRJ013","Warehouse Management","Amazon India","2024-03-15",None,"active",
     "AI-powered warehouse management system with robotic integration"),
    ("PRJ014","OTT Streaming Backend","Hotstar","2024-09-01",None,"active",
     "Scalable video streaming infrastructure supporting 50M concurrent users"),
    ("PRJ015","Compliance Management","Bajaj Finance","2024-06-15",None,"active",
     "Automated regulatory compliance tracking and reporting platform"),
    ("PRJ016","Recruitment Platform","Naukri","2024-02-01","2025-01-31","completed",
     "AI-based candidate matching and interview scheduling platform"),
    ("PRJ017","Fleet Management","Ola","2024-10-01",None,"active",
     "Real-time fleet tracking, maintenance, and driver management system"),
    ("PRJ018","Learning Management System","BYJU'S","2024-04-15",None,"active",
     "Personalised adaptive learning platform with AI tutoring"),
    ("PRJ019","Payment Gateway","PayU","2024-01-01","2024-09-30","completed",
     "High-availability payment processing gateway with 99.99% uptime SLA"),
    ("PRJ020","Agriculture Analytics","ITC Limited","2024-11-01",None,"active",
     "Precision farming analytics using satellite imagery and IoT sensors"),
    ("PRJ021","Cybersecurity Platform","TCS","2024-07-15",None,"active",
     "Zero-trust security platform with SIEM and threat intelligence"),
    ("PRJ022","Retail Analytics","DMart","2024-05-01","2025-04-30","active",
     "Store performance analytics and demand forecasting system"),
    ("PRJ023","Patient Records System","Fortis Healthcare","2024-08-15",None,"active",
     "Electronic health records with ABDM integration"),
    ("PRJ024","Real Estate Platform","MagicBricks","2024-03-01","2024-12-31","completed",
     "Property listing and virtual tour platform"),
    ("PRJ025","Social Commerce App","Meesho","2024-10-15",None,"active",
     "Social selling and reseller management application"),
    ("PRJ026","EdTech Mobile App","Unacademy","2024-06-01",None,"active",
     "Live class and doubt-solving mobile application"),
    ("PRJ027","Tax Compliance Tool","Deloitte","2024-01-15","2024-12-31","completed",
     "Automated GST and direct tax filing platform"),
    ("PRJ028","Inventory Management","Hindustan Unilever","2025-01-01",None,"active",
     "Real-time inventory tracking across 2000+ SKUs"),
    ("PRJ029","CRM Salesforce Integration","Zensar","2024-09-15",None,"active",
     "Custom Salesforce implementation with ERP integration"),
    ("PRJ030","DevSecOps Pipeline","Mphasis","2024-11-15",None,"active",
     "Automated security scanning in CI/CD pipeline"),
    ("PRJ031","AI Chatbot Platform","Razorpay","2025-01-15",None,"active",
     "Conversational AI for customer support with 20+ language support"),
    ("PRJ032","Geospatial Analytics","Survey of India","2024-04-01","2025-03-31","active",
     "GIS-based land mapping and urban planning analytics"),
    ("PRJ033","B2B Marketplace","IndiaMART","2024-12-01",None,"active",
     "Supplier discovery and procurement marketplace"),
    ("PRJ034","Clinical Trial Management","Sun Pharma","2024-08-01",None,"active",
     "End-to-end clinical trial management and regulatory reporting"),
    ("PRJ035","Smart Meter Analytics","MSEDCL","2024-07-01",None,"active",
     "IoT smart meter data analytics and billing system"),
    ("PRJ036","Micro-Finance Platform","Grameen Bank","2025-02-01",None,"active",
     "Last-mile lending and repayment tracking for rural borrowers"),
    ("PRJ037","Ticket Booking System","IRCTC","2024-05-15","2025-05-14","active",
     "Next-gen train ticket booking with dynamic pricing"),
    ("PRJ038","Document Management","L&T","2024-10-01",None,"active",
     "Enterprise document management with AI-based search"),
    ("PRJ039","Hotel Property Management","OYO","2024-11-01",None,"active",
     "Property management system for 15000+ hotel partners"),
    ("PRJ040","Auto Insurance Claims","Bajaj Allianz","2025-01-01",None,"active",
     "AI-powered motor insurance claims processing and settlement"),
    ("PRJ041","Renewable Energy Monitor","Adani Green","2024-06-01",None,"active",
     "SCADA integration for solar and wind farm monitoring"),
    ("PRJ042","Legal Tech Platform","Khaitan & Co","2024-09-01","2025-08-31","active",
     "Contract lifecycle management and legal research AI"),
    ("PRJ043","Sports Analytics","BCCI","2024-03-15","2025-03-14","active",
     "Cricket performance analytics and player scoring platform"),
    ("PRJ044","Alumni Network Platform","IIT Delhi","2024-12-15",None,"active",
     "Professional alumni engagement and mentoring platform"),
    ("PRJ045","Event Management System","BookMyShow","2025-01-15",None,"active",
     "Large-scale event ticketing and venue management"),
    ("PRJ046","Cold Chain Logistics","FreshToHome","2024-07-15","2025-07-14","active",
     "Temperature-controlled supply chain monitoring system"),
    ("PRJ047","Blockchain Trade Finance","Yes Bank","2024-10-15",None,"active",
     "Distributed ledger for trade finance and letter of credit"),
    ("PRJ048","Smart Parking System","Pune Municipal Corp","2025-01-01","2025-12-31","active",
     "IoT-based smart parking guidance and payment system"),
    ("PRJ049","Drone Delivery Platform","Swiggy Instamart","2025-02-15",None,"active",
     "Last-mile drone delivery management and air traffic coordination"),
    ("PRJ050","Talent Intelligence","Nasscom","2024-08-01",None,"active",
     "IT workforce skills mapping and gap analysis platform"),
    ("PRJ051","ESG Reporting Tool","Mahindra Group","2025-01-01",None,"active",
     "Environmental, social and governance data aggregation and reporting"),
    ("PRJ052","QSR Analytics","McDonald's India","2024-11-15",None,"active",
     "Restaurant performance analytics and demand forecasting"),
    ("PRJ053","Co-working Space Platform","WeWork India","2024-09-15","2025-09-14","active",
     "Space booking, IoT access control, and billing for co-working"),
    ("PRJ054","Pharma Distribution ERP","Dr. Reddy's","2024-12-01",None,"active",
     "Distribution management ERP for pharmaceutical supply chain"),
    ("PRJ055","Agri Credit Scoring","NABARD","2025-02-01",None,"active",
     "ML-based creditworthiness scoring for farmer lending"),
]

# ── Activities ────────────────────────────────────────────────────────────────
ACTIVITIES = [
    ("ACT001","Development","Development",True),
    ("ACT002","Code Review","Development",True),
    ("ACT003","Unit Testing","Testing",True),
    ("ACT004","Integration Testing","Testing",True),
    ("ACT005","Bug Fixing","Development",True),
    ("ACT006","Documentation","Documentation",False),
    ("ACT007","Requirement Analysis","Planning",True),
    ("ACT008","Sprint Planning","Planning",False),
    ("ACT009","Design & Architecture","Design",True),
    ("ACT010","Deployment & Release","DevOps",True),
    ("ACT011","Infrastructure Setup","DevOps",True),
    ("ACT012","Client Meeting","Communication",True),
    ("ACT013","Internal Meeting","Communication",False),
    ("ACT014","Training & Learning","Training",False),
    ("ACT015","Performance Testing","Testing",True),
    ("ACT016","Security Review","Testing",True),
    ("ACT017","Data Migration","Development",True),
    ("ACT018","Support & Maintenance","Support",True),
    ("ACT019","Project Management","Management",False),
    ("ACT020","Research & POC","Research",True),
]

# Activity weights per department (index into ACTIVITIES list 0-based)
DEPT_ACT_WEIGHTS = {
    "Engineering": [0,1,2,3,4,5,6,7,8,12,13,19],
    "QA":          [2,3,4,5,6,12,14,15,13],
    "DevOps":      [9,10,11,4,15,12,13,16,19],
    "Product":     [6,7,8,11,12,13,18,19],
    "HR":          [5,6,12,13,17,18],
    "Finance":     [5,12,13,17,18],
    "Sales":       [11,12,13,5,18],
    "Marketing":   [5,12,13,19,17],
    "Support":     [17,4,12,13,5,14],
    "Management":  [18,12,13,6,7,11],
}

# Descriptions per activity code
DESCS = {
    "ACT001":["Implemented REST API endpoints for authentication module",
              "Developed React components for dashboard UI",
              "Built microservice for order processing and validation",
              "Integrated third-party payment gateway SDK",
              "Implemented Redis caching for performance optimisation",
              "Developed data pipeline for ETL processing",
              "Built WebSocket handler for real-time notifications",
              "Created database models and migration scripts",
              "Implemented JWT-based auth and authorisation",
              "Developed batch job scheduler for nightly reports",
              "Built drag-and-drop file upload component",
              "Implemented role-based access control module"],
    "ACT002":["PR review for authentication module — suggested refactoring",
              "Reviewed payment service — identified N+1 query issue",
              "Reviewed database query performance and recommended indexes",
              "Code review for React component lifecycle management",
              "Reviewed API contract alignment with frontend team"],
    "ACT003":["Unit tests for user service — 95% coverage achieved",
              "Created test cases for payment processing module",
              "Unit testing for API endpoints using pytest fixtures",
              "Mock-based tests for external service integrations"],
    "ACT004":["Integration testing with payment gateway sandbox",
              "End-to-end API validation with Postman collections",
              "Integration testing for third-party SMS service",
              "Validated data flow between microservices"],
    "ACT005":["Fixed critical bug in session token expiry logic",
              "Resolved race condition in concurrent order processing",
              "Fixed memory leak in WebSocket connection handler",
              "Fixed data inconsistency in reporting module",
              "Resolved UI rendering issue in Safari — z-index conflict",
              "Debugged intermittent timeout in background jobs"],
    "ACT006":["Updated API docs with new endpoint specifications",
              "Wrote technical design document for microservices migration",
              "Created deployment runbook and rollback procedures",
              "Updated Confluence with database schema changes",
              "Prepared user manual for admin portal"],
    "ACT007":["Gathered requirements from business stakeholders",
              "Created user stories and acceptance criteria for sprint backlog",
              "Stakeholder interview for analytics module scope",
              "Mapped requirements to technical specifications"],
    "ACT008":["Sprint planning — estimated 42 story points for Sprint 18",
              "Backlog refinement and story pointing session",
              "Sprint retrospective and planning for upcoming iteration",
              "Capacity planning and sprint goal definition"],
    "ACT009":["Designed high-level architecture for payment microservice",
              "Created ER diagram for new database schema",
              "Architecture review for cloud migration approach",
              "UI/UX wireframe review and approval",
              "System design for real-time event streaming pipeline"],
    "ACT010":["Deployed release 3.2.1 to production with zero downtime",
              "Kubernetes rolling update for notification service",
              "Release coordination and smoke testing",
              "Hotfix deployment for critical authentication bug",
              "Blue-green deployment for new payment module"],
    "ACT011":["Set up Terraform scripts for AWS EKS cluster",
              "Configured CI/CD pipeline in GitHub Actions",
              "Set up monitoring with Grafana and Prometheus",
              "Configured WAF rules and SSL certificates",
              "Database replication and failover configuration"],
    "ACT012":["Sprint demo presentation to client stakeholders",
              "Requirements discussion with client product team",
              "Monthly project status review with client",
              "Scope change discussion and impact analysis with client"],
    "ACT013":["Daily standup and sprint sync",
              "Cross-team dependency alignment call",
              "Architecture review board discussion",
              "Team retrospective and process improvement",
              "Knowledge transfer session for new team members"],
    "ACT014":["AWS Solutions Architect certification preparation",
              "Completed Kubernetes fundamentals online course",
              "React advanced patterns workshop",
              "PostgreSQL performance tuning training",
              "Security best practices workshop — OWASP Top 10"],
    "ACT015":["Load test with 10K concurrent users using JMeter",
              "API performance benchmarking and bottleneck analysis",
              "Database query optimisation under production load",
              "Stress testing payment gateway failover scenarios"],
    "ACT016":["OWASP vulnerability assessment of authentication module",
              "Security code review for data encryption",
              "Penetration testing report review and remediation planning",
              "VAPT findings remediation and re-testing"],
    "ACT017":["Migrated 5M legacy records to new schema",
              "Data cleansing and deduplication for customer master",
              "ETL pipeline for historical data migration",
              "Validated migrated data integrity with reconciliation scripts"],
    "ACT018":["L2 support for production payment processing issue",
              "Investigated customer-reported data discrepancy",
              "On-call support for nightly batch failures",
              "Production incident analysis and RCA preparation"],
    "ACT019":["Updated JIRA and sprint tracking metrics",
              "Prepared weekly status report for stakeholders",
              "Risk register update and mitigation planning",
              "Resource allocation and capacity planning",
              "Vendor coordination for third-party integrations"],
    "ACT020":["POC for GraphQL migration of REST APIs",
              "Evaluated AWS Graviton vs x86 for cost optimisation",
              "Research on event-driven architecture patterns",
              "Prototype for AI-based recommendation engine",
              "Benchmarking NoSQL vs relational for time-series data"],
}

REJECTION_COMMENTS = [
    "Please add descriptions for all entries before resubmitting.",
    "Total hours for Wednesday seem incorrect — please review.",
    "Missing entries for Thursday — please account for all working days.",
    "Entries on the public holiday should be removed.",
    "Please split the 10-hour entry into separate activities.",
    "Client meeting should be logged against the correct project.",
]

APPROVAL_COMMENTS = [
    "Looks good. Approved.", "Approved — great work this week!",
    "All entries verified. Approved.", "Approved after review.",
    None, None, None,  # most approvals have no comment
]

NOTIF_SUBJECTS = {
    "approval": ["Your timesheet has been approved",
                 "Timesheet approved for week ending {date}"],
    "rejection": ["Your timesheet requires correction",
                  "Timesheet returned — please review comments"],
    "daily_reminder": ["Don't forget to log your hours today",
                       "Daily timesheet reminder — {date}"],
    "welcome": ["Welcome to HourHive!", "Your HourHive account is ready"],
}

IP_POOL = [f"192.168.{random.randint(1,10)}.{random.randint(1,254)}" for _ in range(30)]

def batch_insert(cur, sql, rows, size=500):
    for i in range(0, len(rows), size):
        cur.executemany(sql, rows[i:i+size])

# ── Seeder functions ───────────────────────────────────────────────────────────

def seed_designations(cur, sa_id):
    rows = [
        ("SWE",  "Software Engineer"),
        ("SSE",  "Senior Software Engineer"),
        ("TL",   "Tech Lead"),
        ("SA",   "Solution Architect"),
        ("QAE",  "QA Engineer"),
        ("SDET", "SDET Engineer"),
        ("UXD",  "UI/UX Designer"),
        ("SRE",  "DevOps Engineer"),
        ("BA",   "Business Analyst"),
        ("PMA",  "Project Manager"),
        ("HRM",  "HR Manager"),
        ("FINM", "Finance Manager"),
        ("SSA",  "Senior Sales Executive"),
        ("SUP",  "Support Engineer"),
        ("MKTM", "Marketing Manager"),
    ]
    cur.executemany(
        "INSERT IGNORE INTO designation_master "
        "(designation_code,designation_name,status,created_by,created_at,updated_by,updated_at,is_deleted) "
        "VALUES (%s,%s,'active',%s,%s,%s,%s,0)",
        [(code, name, sa_id, NOW, sa_id, NOW) for code, name in rows]
    )
    print(f"  -> {len(rows)} designations")


def seed_departments(cur, sa_id):
    rows = [
        ("ENG",    "Engineering"),
        ("QA",     "Quality Assurance"),
        ("DESIGN", "Design"),
        ("PM",     "Project Management"),
        ("DEVOPS", "DevOps"),
        ("HR",     "Human Resources"),
        ("FIN",    "Finance"),
        ("MKT",    "Marketing"),
        ("SALES",  "Sales"),
        ("SUPPORT","Support"),
        ("MGMT",   "Management"),
    ]
    cur.executemany(
        "INSERT IGNORE INTO department_master "
        "(department_code,department_name,status,created_by,created_at,updated_by,updated_at,is_deleted) "
        "VALUES (%s,%s,'active',%s,%s,%s,%s,0)",
        [(code, name, sa_id, NOW, sa_id, NOW) for code, name in rows]
    )
    print(f"  -> {len(rows)} departments")


def seed_system_config(cur, sa_id):
    rows = [
        ("APP_NAME","HourHive","Application display name",sa_id),
        ("COMPANY_NAME","gNxt Systems Pvt. Ltd.","Company legal name",sa_id),
        ("MAX_DAILY_HOURS","12","Maximum hours an employee can log per day",sa_id),
        ("BACKDATED_DAYS_LIMIT","7","Days in the past employees can fill timesheets",sa_id),
        ("REQUIRE_DESCRIPTION","true","Whether description is mandatory on entries",sa_id),
        ("AUTO_LOCK_APPROVED","true","Lock timesheet after admin approval",sa_id),
        ("FISCAL_YEAR_START","04","Month number when fiscal year begins",sa_id),
        ("DEFAULT_WORK_HOURS","8","Standard working hours per day",sa_id),
        ("TIMESHEET_REMINDER_HOUR","18","Hour (24h) to send daily reminder",sa_id),
        ("ADMIN_EMAIL","admin@gnxtsystems.com","Primary admin contact email",sa_id),
    ]
    cur.executemany(
        "INSERT IGNORE INTO system_config (config_key,config_value,description,updated_by,updated_at) "
        "VALUES (%s,%s,%s,%s,%s)",
        [(k,v,d,u,NOW) for k,v,d,u in rows]
    )
    print(f"  -> {len(rows)} system config entries")

def seed_users(cur, sa_id):
    admin_rows, emp_rows = [], []

    # 10 Manager-level employees (can_approve_timesheets=True)
    admin_ids = []
    for i in range(1, 11):
        n, f, l = gen_name()
        e = f"manager{i:02d}@gnxtsystems.com"
        used_emails.add(e)
        dept = random.choice(["Engineering","QA","Management","DevOps"])
        desig = "Tech Lead" if dept == "Engineering" else "Manager"
        admin_rows.append((
            f"MGR{i:03d}", n, e, PWD_ADMIN, "employee", "active",
            dept, desig, gen_phone()
        ))

    cur.executemany(
        "INSERT INTO user_master "
        "(employee_code,full_name,email,password_hash,role,status,"
        "department,designation,phone,can_approve_timesheets,"
        "created_at,created_by,updated_at,updated_by,last_login,is_deleted) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,1,%s,%s,%s,%s,%s,0)",
        [(r[0],r[1],r[2],r[3],r[4],r[5],r[6],r[7],r[8],
          NOW, sa_id, NOW, sa_id,
          NOW - timedelta(hours=random.randint(1,72))) for r in admin_rows]
    )
    cur.execute("SELECT id,email FROM user_master WHERE can_approve_timesheets=1 AND role='employee' ORDER BY id")
    for uid, em in cur.fetchall():
        admin_ids.append(uid)
    print(f"  -> {len(admin_ids)} admins")

    # 500 Employees distributed by department
    emp_data = []   # list of (id, dept, [project_idxs])
    code_num = 1
    all_emp_rows = []

    for dept, conf in DEPT_CONF.items():
        act_idxs = DEPT_ACT_WEIGHTS.get(dept, list(range(20)))
        for _ in range(conf["count"]):
            n, f, l = gen_name()
            e = gen_email(f, l)
            desig = random.choices(conf["desigs"], weights=conf["w"])[0]
            status = "active" if random.random() > 0.04 else "inactive"
            jd = rand_join()
            ll = NOW - timedelta(hours=random.randint(1, 120)) if random.random() > 0.1 else None
            all_emp_rows.append((
                f"EMP{code_num:04d}", n, e, PWD_EMP,
                "employee", status, dept, desig, gen_phone(),
                sa_id,  # manager_id defaults to super admin
                NOW, sa_id, NOW, sa_id, ll,
            ))
            emp_data.append({"code": f"EMP{code_num:04d}", "email": e, "dept": dept,
                              "act_idxs": act_idxs, "status": status})
            code_num += 1

    batch_insert(cur,
        "INSERT INTO user_master "
        "(employee_code,full_name,email,password_hash,role,status,"
        "department,designation,phone,can_approve_timesheets,manager_id,"
        "created_at,created_by,updated_at,updated_by,last_login,is_deleted) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,0,%s,%s,%s,%s,%s,%s,0)",
        all_emp_rows
    )

    # Fetch inserted IDs in order
    cur.execute("SELECT id,employee_code,department FROM user_master WHERE role='employee' AND can_approve_timesheets=0 ORDER BY id")
    rows_db = cur.fetchall()
    for i, (uid, ec, dept) in enumerate(rows_db):
        emp_data[i]["id"] = uid

    print(f"  -> {len(emp_data)} employees")
    return admin_ids, emp_data

def seed_projects(cur, admin_ids, sa_id):
    rows = []
    project_ids = []
    for i, (code,name,cust,start,end,status,desc) in enumerate(PROJECTS):
        mgr = admin_ids[i % len(admin_ids)]
        rows.append((code,name,cust,start,end,status,mgr,desc,
                     sa_id,NOW,sa_id,NOW,False))
    cur.executemany(
        "INSERT INTO project_master (project_code,project_name,customer_name,start_date,end_date,"
        "status,project_manager_id,description,created_by,created_at,updated_by,updated_at,is_deleted) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        rows
    )
    cur.execute("SELECT id FROM project_master ORDER BY id")
    project_ids = [r[0] for r in cur.fetchall()]
    print(f"  -> {len(project_ids)} projects")
    return project_ids

def seed_activities(cur, sa_id):
    rows = [(c,n,cat,1 if b else 0,"active",sa_id,NOW,sa_id,NOW,False)
            for c,n,cat,b in ACTIVITIES]
    cur.executemany(
        "INSERT INTO activity_master (activity_code,activity_name,category,is_billable,status,"
        "created_by,created_at,updated_by,updated_at,is_deleted) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        rows
    )
    cur.execute("SELECT id,activity_code FROM activity_master ORDER BY id")
    act_map = {code: uid for uid, code in cur.fetchall()}
    activity_ids = [act_map[c] for c,_,_,_ in ACTIVITIES]
    print(f"  -> {len(activity_ids)} activities")
    return activity_ids

def seed_holiday_master(cur, sa_id):
    entries = [
        (date(2025,1,26),"Republic Day",2025),
        (date(2025,2,26),"Maha Shivratri",2025),
        (date(2025,3,14),"Holi",2025),
        (date(2025,4,14),"Dr. Ambedkar Jayanti",2025),
        (date(2025,4,18),"Good Friday",2025),
        (date(2025,5,1),"Labour Day",2025),
        (date(2025,8,15),"Independence Day",2025),
        (date(2025,8,27),"Janmashtami",2025),
        (date(2025,10,2),"Gandhi Jayanti / Dussehra",2025),
        (date(2025,10,20),"Diwali",2025),
        (date(2025,10,21),"Govardhan Puja",2025),
        (date(2025,11,5),"Guru Nanak Jayanti",2025),
        (date(2025,12,25),"Christmas Day",2025),
        (date(2026,1,1),"New Year Day",2026),
        (date(2026,1,26),"Republic Day",2026),
        (date(2026,2,15),"Maha Shivratri",2026),
        (date(2026,3,4),"Holi",2026),
        (date(2026,5,1),"Labour Day",2026),
        (date(2026,8,15),"Independence Day",2026),
        (date(2026,8,28),"Raksha Bandhan",2026),
        (date(2026,10,2),"Gandhi Jayanti",2026),
        (date(2026,10,20),"Dussehra",2026),
        (date(2026,11,8),"Diwali",2026),
        (date(2026,11,9),"Govardhan Puja",2026),
        (date(2026,11,10),"Govardhan Puja",2026),
        (date(2026,11,11),"Bhai Dooj",2026),
        (date(2026,12,25),"Christmas Day",2026),
    ]
    cur.executemany(
        "INSERT IGNORE INTO holiday_master (date,name,year,created_by,created_at,updated_by,updated_at,is_deleted) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
        [(d,n,y,sa_id,NOW,sa_id,NOW,False) for d,n,y in entries]
    )
    print(f"  -> {len(entries)} holidays")

def seed_timesheets(cur, emp_data, admin_ids, project_ids, activity_ids):
    act_codes = [a[0] for a in ACTIVITIES]  # ACT001..ACT020

    headers, details, approvals = [], [], []
    header_id_counter = [0]  # mutable for closure

    active_emps = [e for e in emp_data if e["status"] == "active"]
    # assign admin per employee (round-robin)
    for i, e in enumerate(active_emps):
        e["admin_id"] = admin_ids[i % len(admin_ids)]
        # assign 3-5 projects per employee
        n_proj = random.randint(3, 5)
        e["projects"] = random.sample(project_ids, min(n_proj, len(project_ids)))

    total_weeks = len(WEEKS)

    for week_idx, (ws, we) in enumerate(WEEKS):
        weeks_ago = total_weeks - week_idx - 1
        wdays = working_days(ws, we)
        if not wdays:
            continue

        is_current_week = (week_idx == len(WEEKS) - 1)
        is_recent = weeks_ago <= 2

        for emp in active_emps:
            # ~10% chance employee skips this week entirely
            if random.random() < 0.10:
                continue

            eid = emp["id"]
            adm = emp["admin_id"]
            projs = emp["projects"]
            act_pool = [activity_ids[i] for i in emp["act_idxs"] if i < len(activity_ids)]
            act_code_pool = [act_codes[i] for i in emp["act_idxs"] if i < len(act_codes)]
            if not act_pool:
                act_pool = activity_ids[:3]
                act_code_pool = act_codes[:3]

            # Determine status for this week's timesheet
            if is_current_week:
                status = random.choices(["draft","submitted"], weights=[70,30])[0]
            elif is_recent:
                status = random.choices(["draft","submitted","approved"], weights=[15,45,40])[0]
            elif weeks_ago <= 8:
                status = random.choices(["submitted","approved","rejected"], weights=[15,75,10])[0]
            else:
                status = random.choices(["approved","rejected","submitted"], weights=[85,8,7])[0]

            # Generate daily entries
            day_entries = []
            total_hours = 0.0
            for wday in wdays:
                # 8% chance employee was on leave that day
                if random.random() < 0.08:
                    continue
                # 1-3 entries per day
                n_entries = random.choices([1,2,3], weights=[40,45,15])[0]
                hours_left = round(random.uniform(7.0, 9.5), 2)
                day_proj = random.choice(projs)
                for j in range(n_entries):
                    if hours_left <= 0:
                        break
                    if j == n_entries - 1:
                        h = hours_left
                    else:
                        h = round(random.choice([1.0,1.5,2.0,2.5,3.0,3.5,4.0]), 2)
                        h = min(h, hours_left - 0.5)
                        if h <= 0:
                            h = hours_left
                    h = round(h, 2)
                    hours_left = round(hours_left - h, 2)
                    act_id = random.choice(act_pool)
                    act_code = act_code_pool[act_pool.index(act_id)] if act_id in act_pool else "ACT001"
                    descs_for_act = DESCS.get(act_code, DESCS["ACT001"])
                    desc = random.choice(descs_for_act)
                    is_billable = 1 if ACTIVITIES[act_codes.index(act_code)][3] else 0
                    day_entries.append((wday, day_proj, act_id, h, desc, is_billable))
                    total_hours += h
                # sometimes 2nd project entry
                if random.random() < 0.3 and len(projs) > 1:
                    p2 = random.choice([p for p in projs if p != day_proj])
                    act_id2 = random.choice(act_pool)
                    act_code2 = act_code_pool[act_pool.index(act_id2)] if act_id2 in act_pool else "ACT013"
                    h2 = round(random.choice([0.5,1.0,1.5]), 2)
                    desc2 = random.choice(DESCS.get(act_code2, DESCS["ACT001"]))
                    is_b2 = 1 if ACTIVITIES[act_codes.index(act_code2)][3] else 0
                    day_entries.append((wday, p2, act_id2, h2, desc2, is_b2))
                    total_hours += h2

            if not day_entries:
                continue

            total_hours = round(total_hours, 2)
            submitted_at = None
            approved_by = None
            approved_at = None
            rejected_by = None
            rejection_reason = None
            is_locked = False

            submit_dt = datetime(ws.year, ws.month, ws.day, 17, random.randint(0,59), random.randint(0,59))
            submit_dt += timedelta(days=4)  # Friday-ish
            approve_dt = submit_dt + timedelta(hours=random.randint(2,48))

            if status == "submitted":
                submitted_at = submit_dt
            elif status == "approved":
                submitted_at = submit_dt
                approved_by = adm
                approved_at = approve_dt
                is_locked = True
            elif status == "rejected":
                submitted_at = submit_dt
                rejected_by = adm
                rejection_reason = random.choice(REJECTION_COMMENTS)

            header_id_counter[0] += 1
            hid = header_id_counter[0]

            headers.append((
                eid, ws, we, total_hours, status,
                submitted_at, approved_by, approved_at,
                rejected_by, rejection_reason, is_locked,
                eid, NOW, eid, NOW, False
            ))

            for wday, proj, act, h, desc, is_b in day_entries:
                details.append((hid, eid, proj, act, wday, h, desc, is_b,
                                 eid, NOW, eid, NOW, False))

            # Approval history
            prev = "draft"
            if status in ("submitted","approved","rejected","resubmitted"):
                approvals.append((hid, eid, "submit", None, "draft", "submitted", submit_dt))
                prev = "submitted"
            if status == "approved":
                approvals.append((hid, adm, "approve",
                                   random.choice(APPROVAL_COMMENTS),
                                   "submitted","approved", approve_dt))
            elif status == "rejected":
                approvals.append((hid, adm, "reject",
                                   random.choice(REJECTION_COMMENTS),
                                   "submitted","rejected",
                                   submit_dt + timedelta(hours=random.randint(1,24))))

    # Flush headers first to get real IDs from DB
    # We use a sequential counter approach so IDs match — need AUTO_INCREMENT
    # Insert headers in batches; details reference the header's auto-assigned ID
    # Strategy: insert all headers, fetch IDs, then remap details

    # Reset our counter — headers were built with sequential fake IDs
    # Re-insert using actual DB and fetch IDs
    print(f"  Inserting {len(headers)} timesheet headers…")
    header_sql = (
        "INSERT INTO timesheet_header "
        "(employee_id,week_start_date,week_end_date,total_hours,status,"
        "submitted_at,approved_by,approved_at,rejected_by,rejection_reason,is_locked,"
        "created_by,created_at,updated_by,updated_at,is_deleted) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"
    )
    batch_insert(cur, header_sql, headers)

    # Fetch inserted header IDs
    cur.execute("SELECT id FROM timesheet_header ORDER BY id")
    real_header_ids = [r[0] for r in cur.fetchall()]

    # Remap fake sequential IDs to real DB IDs
    fake_to_real = {}
    for i, real_id in enumerate(real_header_ids):
        fake_to_real[i+1] = real_id

    # Fix detail and approval foreign keys
    fixed_details = []
    for fake_hid, eid, proj, act, wday, h, desc, is_b, cb, ca, ub, ua, dl in details:
        real_hid = fake_to_real.get(fake_hid, fake_hid)
        fixed_details.append((real_hid, eid, proj, act, wday, h, desc, is_b, cb, ca, ub, ua, dl))

    fixed_approvals = []
    for fake_hid, actor, action, comment, prev_s, new_s, created in approvals:
        real_hid = fake_to_real.get(fake_hid, fake_hid)
        fixed_approvals.append((real_hid, actor, action, comment, prev_s, new_s, created))

    print(f"  Inserting {len(fixed_details)} timesheet detail rows…")
    batch_insert(cur,
        "INSERT INTO timesheet_detail "
        "(header_id,employee_id,project_id,activity_id,work_date,hours_worked,"
        "description,is_billable,created_by,created_at,updated_by,updated_at,is_deleted) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        fixed_details
    )

    print(f"  Inserting {len(fixed_approvals)} approval history rows…")
    batch_insert(cur,
        "INSERT INTO approval_history "
        "(header_id,action_by,action,comment,previous_status,new_status,created_at) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s)",
        fixed_approvals
    )

def seed_notifications(cur, emp_data, admin_ids):
    rows = []
    active_emps = [e for e in emp_data if e["status"] == "active"]

    # Welcome notification for all users
    for emp in active_emps:
        rows.append((
            emp["id"], "welcome",
            "Welcome to HourHive!",
            "Your HourHive account has been set up. Start logging your time today.",
            True, NOW - timedelta(days=random.randint(30,180)),
            NOW - timedelta(days=random.randint(1,30))
        ))

    # Approval notifications (sample — approved timesheets)
    for emp in random.sample(active_emps, min(200, len(active_emps))):
        rows.append((
            emp["id"], "approval",
            "Your timesheet has been approved",
            "Your timesheet submission for last week has been reviewed and approved.",
            random.random() > 0.3,
            NOW - timedelta(days=random.randint(1,60)),
            NOW - timedelta(days=random.randint(0,5)) if random.random() > 0.3 else None
        ))

    # Rejection notifications
    for emp in random.sample(active_emps, min(60, len(active_emps))):
        rows.append((
            emp["id"], "rejection",
            "Your timesheet requires correction",
            "Your timesheet submission has been returned. Please review the comments and resubmit.",
            random.random() > 0.5,
            NOW - timedelta(days=random.randint(3,45)),
            None
        ))

    # Daily reminders
    for emp in random.sample(active_emps, min(150, len(active_emps))):
        for _ in range(random.randint(1,3)):
            rows.append((
                emp["id"], "daily_reminder",
                "Don't forget to log your hours today",
                "This is a reminder to fill in your daily timesheet before end of day.",
                True,
                NOW - timedelta(days=random.randint(1,14)),
                NOW - timedelta(hours=random.randint(1,8))
            ))

    # Weekly reminders
    for emp in random.sample(active_emps, min(100, len(active_emps))):
        rows.append((
            emp["id"], "weekly_reminder",
            "Weekly timesheet submission reminder",
            "Please submit your timesheet for the week by end of day Friday.",
            random.random() > 0.4,
            NOW - timedelta(days=random.randint(2,10)),
            None
        ))

    # Admin notifications
    for adm_id in admin_ids:
        for _ in range(random.randint(3,8)):
            rows.append((
                adm_id, "approval",
                "Timesheets pending your approval",
                "You have pending timesheet submissions awaiting review.",
                random.random() > 0.5,
                NOW - timedelta(days=random.randint(1,14)),
                NOW - timedelta(hours=random.randint(1,48)) if random.random() > 0.4 else None
            ))

    batch_insert(cur,
        "INSERT INTO notification_log (recipient_id,type,subject,body,is_read,sent_at,read_at) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s)",
        rows
    )
    print(f"  -> {len(rows)} notifications")

def seed_audit_logs(cur, admin_ids, emp_data, sa_id):
    rows = []
    active_emps = [e for e in emp_data if e["status"] == "active"]

    # User creation audit (admins creating employees — sample)
    for emp in random.sample(active_emps, min(100, len(active_emps))):
        actor = random.choice(admin_ids + [sa_id])
        rows.append((
            actor, "User", emp["id"], "CREATE",
            None,
            json.dumps({"email": emp["email"], "role": "employee", "department": emp["dept"]}),
            random.choice(IP_POOL),
            "Mozilla/5.0 (Windows NT 10.0) HourHive/1.0",
            NOW - timedelta(days=random.randint(30,365))
        ))

    # Login audits
    for emp in random.sample(active_emps, min(200, len(active_emps))):
        for _ in range(random.randint(1,5)):
            rows.append((
                emp["id"], "Auth", emp["id"], "LOGIN",
                None, json.dumps({"status": "success"}),
                random.choice(IP_POOL),
                "Mozilla/5.0 (Windows NT 10.0) Chrome/120 HourHive/1.0",
                NOW - timedelta(days=random.randint(0,30), hours=random.randint(0,23))
            ))

    # Admin approval actions
    for adm_id in admin_ids:
        for _ in range(random.randint(10,25)):
            rows.append((
                adm_id, "Timesheet", random.randint(1,5000), "APPROVE",
                json.dumps({"status": "submitted"}),
                json.dumps({"status": "approved"}),
                random.choice(IP_POOL),
                "Mozilla/5.0 (Windows NT 10.0) Chrome/120",
                NOW - timedelta(days=random.randint(0,60), hours=random.randint(0,8))
            ))

    # SuperAdmin actions
    for _ in range(20):
        rows.append((
            sa_id, "User", random.randint(1, len(active_emps)), "UPDATE",
            json.dumps({"status": "active"}),
            json.dumps({"status": "inactive"}),
            random.choice(IP_POOL), "HourHive-Admin/1.0",
            NOW - timedelta(days=random.randint(1,90))
        ))

    # Project creation
    for i, (code,name,*_) in enumerate(PROJECTS[:20]):
        rows.append((
            sa_id, "Project", i+1, "CREATE",
            None, json.dumps({"project_code": code, "project_name": name}),
            random.choice(IP_POOL), "HourHive-Admin/1.0",
            NOW - timedelta(days=random.randint(60,365))
        ))

    # Timesheet submissions
    for emp in random.sample(active_emps, min(150, len(active_emps))):
        for _ in range(random.randint(1,3)):
            rows.append((
                emp["id"], "Timesheet", random.randint(1,5000), "SUBMIT",
                json.dumps({"status": "draft"}),
                json.dumps({"status": "submitted"}),
                random.choice(IP_POOL), "Mozilla/5.0",
                NOW - timedelta(days=random.randint(0,60))
            ))

    batch_insert(cur,
        "INSERT INTO audit_log "
        "(user_id,entity_type,entity_id,action,old_values,new_values,ip_address,user_agent,created_at) "
        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        rows
    )
    print(f"  -> {len(rows)} audit log entries")


def main():
    print("=" * 60)
    print("  HourHive Enterprise Seed Script")
    print("=" * 60)
    print("\nHashing passwords (this takes ~5 seconds)…")

    global PWD_ADMIN, PWD_EMP
    PWD_ADMIN = bcrypt.hashpw(b"Admin@123456", bcrypt.gensalt()).decode()
    PWD_EMP   = bcrypt.hashpw(b"Employee@123", bcrypt.gensalt()).decode()

    print("Connecting to MySQL…")
    conn = pymysql.connect(**DB)
    cur  = conn.cursor()

    try:
        # ── Wipe & reset ──────────────────────────────────────────────────────
        print("\nClearing existing data…")
        cur.execute("SET FOREIGN_KEY_CHECKS=0")
        for t in ["approval_history","timesheet_detail","timesheet_header",
                  "audit_log","notification_log","holiday_master","system_config",
                  "activity_master","project_master","user_project_assignment",
                  "designation_master","department_master"]:
            # Skip tables that might not exist yet
            cur.execute(f"SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='{t}'")
            if cur.fetchone()[0]:
                cur.execute(f"TRUNCATE TABLE `{t}`")
        cur.execute("DELETE FROM user_master WHERE role != 'super_admin'")
        cur.execute("SET FOREIGN_KEY_CHECKS=1")
        conn.commit()

        # Get super_admin ID
        cur.execute("SELECT id FROM user_master WHERE role='super_admin' LIMIT 1")
        row = cur.fetchone()
        sa_id = row[0] if row else 1

        # ── Seed ──────────────────────────────────────────────────────────────
        print("\n[1/10] Designations…")
        seed_designations(cur, sa_id)
        conn.commit()

        print("\n[2/10] Departments…")
        seed_departments(cur, sa_id)
        conn.commit()

        print("\n[3/10] System config…")
        seed_system_config(cur, sa_id)
        conn.commit()

        print("\n[4/10] Users (10 managers + 500 employees)…")
        admin_ids, emp_data = seed_users(cur, sa_id)
        conn.commit()

        print("\n[5/10] Projects (55)…")
        project_ids = seed_projects(cur, admin_ids, sa_id)
        conn.commit()

        print("\n[6/10] Activities (20)…")
        activity_ids = seed_activities(cur, sa_id)
        conn.commit()

        print("\n[7/10] Holidays…")
        seed_holiday_master(cur, sa_id)
        conn.commit()

        print("\n[8/10] Timesheets (26 weeks × 500 employees — may take 1-2 min)…")
        seed_timesheets(cur, emp_data, admin_ids, project_ids, activity_ids)
        conn.commit()

        print("\n[9/10] Notifications…")
        seed_notifications(cur, emp_data, admin_ids)
        conn.commit()

        print("\n[10/10] Audit logs…")
        seed_audit_logs(cur, admin_ids, emp_data, sa_id)
        conn.commit()

        # ── Summary ───────────────────────────────────────────────────────────
        cur.execute("SELECT COUNT(*) FROM user_master")
        u = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM timesheet_header")
        h = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM timesheet_detail")
        d = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM approval_history")
        a = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM notification_log")
        n = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM audit_log")
        al = cur.fetchone()[0]

        print("\n" + "=" * 60)
        print("  SEED COMPLETE!")
        print("=" * 60)
        cur.execute("SELECT COUNT(*) FROM designation_master")
        dsg = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM department_master")
        dpt = cur.fetchone()[0]
        print(f"  Users            : {u}  (1 super_admin | 10 managers | {u-11} employees)")
        print(f"  Designations     : {dsg}")
        print(f"  Departments      : {dpt}")
        print(f"  Projects         : {len(project_ids)}")
        print(f"  Activities       : {len(activity_ids)}")
        print(f"  Timesheet weeks  : {h}")
        print(f"  Timesheet entries: {d}")
        print(f"  Approval records : {a}")
        print(f"  Notifications    : {n}")
        print(f"  Audit log rows   : {al}")
        print()
        print("  Login credentials:")
        print("  Super Admin : (existing super admin account)")
        print("  Manager     : manager01@gnxtsystems.com  /  Admin@123456")
        print("  Employee    : <firstname>.<lastname>@gnxtsystems.com  /  Employee@123")
        print("=" * 60)

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
