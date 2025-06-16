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
        names = [f"%{name.strip().lower()}%" for name in filters["employee_name"].split(",")]
        like_clauses = " OR ".join(["LOWER(employee_name) LIKE ?"] * len(names))
        query += f" AND ({like_clauses})"
        values.extend(names)

    if filters.get("department") and isinstance(filters["department"], list):
        departments = [d.strip() for d in filters["department"] if d.strip()]
        if departments:
            placeholders = ','.join(['?'] * len(departments))
            query += f" AND department IN ({placeholders})"
            values.extend(departments)


    if filters.get("status") and isinstance(filters["status"], list):
        statuses = [s.strip() for s in filters["status"] if s.strip()]
        if statuses:
            placeholders = ','.join(['?'] * len(statuses))
            query += f" AND status IN ({placeholders})"
            values.extend(statuses)


    if filters.get("performance") and isinstance(filters["performance"], list):
        performances = [p.strip() for p in filters["performance"] if p.strip()]
        if performances:
            placeholders = ','.join(['?'] * len(performances))
            query += f" AND performance IN ({placeholders})"
            values.extend(performances)


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
        # 🆕 Apply column filtering if provided
        selected_columns = filters.get("columns")
        if selected_columns:
            reports = [
                {key: record[key] for key in selected_columns if key in record}
                for record in reports
            ]

    return jsonify(reports)

def column_index(column):
    # Mapping index according to the return order of query_employee_reports()
    index_map = {
        "id": 0,
        "employee_name": 1,
        "department": 2,
        "status": 3,
        "report_date": 4,
        "hours_worked": 5,
        "performance": 6
    }
    return index_map[column]


# Health check
@app.route("/")
def index():
    return "Employee Report API is running."

@app.route('/api/reports/pdf', methods=['POST'])
def generate_pdf():
    filters = request.get_json()
    data = query_employee_reports(filters)
    selected_columns = filters.get("columns")

    # Column map: backend column name → PDF table header label
    column_map = {
        "id": "ID",
        "employee_name": "Name",
        "department": "Dept",
        "status": "Status",
        "report_date": "Date",
        "hours_worked": "Hours",
        "performance": "Performance"
    }

    if not selected_columns:
        selected_columns = list(column_map.keys())

    # Filter the data based on selected columns
    filtered_data = [
        [row[column_index(col)] for col in selected_columns]
        for row in data
    ]
    headers = [column_map[col] for col in selected_columns]

    # PDF generation
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []

    styles = getSampleStyleSheet()
    elements.append(Paragraph("Employee Report", styles['Title']))
    elements.append(Spacer(1, 12))

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

    elements.append(Paragraph(f"Total Records: {len(data)}", styles['Heading4']))
    elements.append(Spacer(1, 12))

    # Create table data
    table_data = [headers] + filtered_data

    # Dynamically set column widths
    col_width = 6.5 * inch / len(headers)
    col_widths = [col_width] * len(headers)

    table = Table(table_data, repeatRows=1, colWidths=col_widths)
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
def generate_csv():
    filters = request.get_json()
    data = query_employee_reports(filters)
    selected_columns = filters.get("columns")

    # Use default order if no columns provided
    column_map = {
        "id": "ID",
        "employee_name": "Name",
        "department": "Dept",
        "status": "Status",
        "report_date": "Date",
        "hours_worked": "Hours",
        "performance": "Performance"
    }

    if not selected_columns:
        selected_columns = list(column_map.keys())

    df = pd.DataFrame(data, columns=list(column_map.keys()))
    df = df[selected_columns]  # filter columns

    output = io.StringIO()
    df.columns = [column_map[col] for col in selected_columns]  # rename headers
    df.to_csv(output, index=False)
    output.seek(0)

    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype="text/csv",
        as_attachment=True,
        download_name="employee_report.csv"
    )


# Export Excel
@app.route('/api/reports/excel', methods=['POST'])
def generate_excel():
    filters = request.get_json()
    data = query_employee_reports(filters)
    selected_columns = filters.get("columns")

    column_map = {
        "id": "ID",
        "employee_name": "Name",
        "department": "Dept",
        "status": "Status",
        "report_date": "Date",
        "hours_worked": "Hours",
        "performance": "Performance"
    }

    if not selected_columns:
        selected_columns = list(column_map.keys())

    df = pd.DataFrame(data, columns=list(column_map.keys()))
    df = df[selected_columns]
    df.columns = [column_map[col] for col in selected_columns]

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Employee Report')
    output.seek(0)

    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name="employee_report.xlsx"
    )

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
