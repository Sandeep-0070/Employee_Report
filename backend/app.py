from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io
from flask import send_file
import csv
import pandas as pd

app = Flask(__name__)
CORS(app)

# Function to query the database based on filters
def query_employee_reports(filters):
    conn = sqlite3.connect('employee_reports.db')
    cursor = conn.cursor()

    query = "SELECT * FROM employee_reports WHERE 1=1"
    values = []

    # Dynamic filters
    if filters.get("employee_name"):
        query += " AND employee_name LIKE ?"
        values.append(f"%{filters['employee_name']}%")

    if filters.get("department"):
        query += " AND department = ?"
        values.append(filters["department"])

    if filters.get("status"):
        query += " AND status = ?"
        values.append(filters["status"])

    if filters.get("performance"):
        query += " AND performance = ?"
        values.append(filters["performance"])

    if filters.get("start_date"):
        query += " AND report_date >= ?"
        values.append(filters["start_date"])

    if filters.get("end_date"):
        query += " AND report_date <= ?"
        values.append(filters["end_date"])

    if filters.get("min_hours"):
        query += " AND hours_worked >= ?"
        values.append(filters["min_hours"])

    if filters.get("max_hours"):
        query += " AND hours_worked <= ?"
        values.append(filters["max_hours"])

    cursor.execute(query, values)
    results = cursor.fetchall()
    conn.close()
    return results

# Route to fetch reports with filters
@app.route('/api/reports', methods=['POST'])
def get_reports():
    filters = request.get_json()
    data = query_employee_reports(filters)
    
    # Convert to list of dicts for easier handling on frontend
    reports = []
    for row in data:
        reports.append({
            "id": row[0],
            "employee_name": row[1],
            "department": row[2],
            "status": row[3],
            "report_date": row[4],
            "hours_worked": row[5],
            "performance": row[6]
        })
    return jsonify(reports)

# Health check
@app.route("/")
def index():
    return "Employee Report API is running."

@app.route('/api/reports/pdf', methods=['POST'])
def generate_pdf():
    filters = request.get_json()
    data = query_employee_reports(filters)

    # Generate PDF in memory
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.setFont("Helvetica", 10)
    width, height = letter

    pdf.drawString(30, height - 30, "Employee Report")

    y = height - 50
    pdf.drawString(30, y, "ID | Name | Dept | Status | Date | Hours | Performance")
    y -= 20

    for row in data:
        text = f"{row[0]} | {row[1]} | {row[2]} | {row[3]} | {row[4]} | {row[5]} | {row[6]}"
        pdf.drawString(30, y, text)
        y -= 15
        if y < 50:
            pdf.showPage()
            y = height - 50

    pdf.save()
    buffer.seek(0)

    return send_file(buffer, as_attachment=True, download_name="employee_report.pdf", mimetype='application/pdf')

# Export CSV
@app.route('/api/reports/csv', methods=['POST'])
def export_csv():
    filters = request.get_json()
    data = query_employee_reports(filters)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Name', 'Dept', 'Status', 'Date', 'Hours', 'Performance'])
    writer.writerows(data)
    output.seek(0)

    return send_file(io.BytesIO(output.getvalue().encode()), as_attachment=True, download_name="employee_report.csv", mimetype='text/csv')


# Export Excel
@app.route('/api/reports/excel', methods=['POST'])
def export_excel():
    filters = request.get_json()
    data = query_employee_reports(filters)

    df = pd.DataFrame(data, columns=['ID', 'Name', 'Dept', 'Status', 'Date', 'Hours', 'Performance'])
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Report')
    output.seek(0)

    return send_file(output, as_attachment=True, download_name="employee_report.xlsx", mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')


if __name__ == '__main__':
    app.run(debug=True)
