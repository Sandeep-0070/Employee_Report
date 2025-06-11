import sqlite3
import random
from datetime import datetime, timedelta

# Connect to SQLite
conn = sqlite3.connect("employee_reports.db")
cursor = conn.cursor()

# Drop if exists
cursor.execute("DROP TABLE IF EXISTS employee_reports")

# Create the table
cursor.execute("""
CREATE TABLE employee_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_name TEXT,
    department TEXT,
    status TEXT,
    report_date TEXT,
    hours_worked REAL,
    performance TEXT
)
""")

# Sample data
names = ["Alice", "Bob", "Charlie", "David", "Eva", "Frank", "Grace", "Helen"]
departments = ["HR", "Engineering", "Sales", "Marketing"]
statuses = ["Active", "On Leave", "Resigned"]
performances = ["Excellent", "Good", "Average", "Poor"]

start_date = datetime(2024, 1, 1)

# Insert 200 rows
for _ in range(200):
    name = random.choice(names)
    dept = random.choice(departments)
    status = random.choice(statuses)
    date = (start_date + timedelta(days=random.randint(0, 150))).strftime("%Y-%m-%d")
    hours = round(random.uniform(4, 10), 2)
    performance = random.choice(performances)

    cursor.execute("""
        INSERT INTO employee_reports (
            employee_name, department, status, report_date, hours_worked, performance
        ) VALUES (?, ?, ?, ?, ?, ?)
    """, (name, dept, status, date, hours, performance))

conn.commit()
conn.close()

print("✅ employee_reports.db created with 200 sample records.")
