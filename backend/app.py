from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io
from flask import send_file
import csv
import pandas as pd
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet


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

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []

    styles = getSampleStyleSheet()

    # Title
    elements.append(Paragraph("Employee Report", styles['Title']))
    elements.append(Spacer(1, 12))

    # Applied Filters
    filters_applied = [
        f"Employee Name: {filters.get('employee_name', '') or 'All'}",
        f"Department: {filters.get('department', '') or 'All'}",
        f"Status: {filters.get('status', '') or 'All'}",
        f"Performance: {filters.get('performance', '') or 'All'}",
        f"Start Date: {filters.get('start_date', '') or 'Any'}",
        f"End Date: {filters.get('end_date', '') or 'Any'}",
        f"Min Hours: {filters.get('min_hours', '') or 'Any'}",
        f"Max Hours: {filters.get('max_hours', '') or 'Any'}"
    ]
    for line in filters_applied:
        elements.append(Paragraph(line, styles['Normal']))
    elements.append(Spacer(1, 12))

    # Table Data
    table_data = [['ID', 'Name', 'Dept', 'Status', 'Date', 'Hours', 'Performance']] + list(data)

    # Create and style the table
    table = Table(table_data, repeatRows=1, colWidths=[0.7*inch, 1.5*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1.0*inch, 1.2*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#00ACC1")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('ALIGN',(0,0),(-1,-1),'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('BACKGROUND', (0,1), (-1,-1), colors.whitesmoke)
    ]))

    elements.append(table)

    doc.build(elements)
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
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
