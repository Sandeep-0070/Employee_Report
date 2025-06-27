from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import sqlite3
import io
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch
import os

app = Flask(__name__)
CORS(app)

# ✨ Define your table schema here.
# To switch databases or tables, just update this schema and the DB/table name in `query_reports()
def get_schema():
    return [
        {"name": "id", "type": "number", "enum": False},
        {"name": "employee_name", "type": "text", "enum": False},
        {"name": "department", "type": "text", "enum": True, "options": ["HR", "Engineering", "Sales", "Marketing"]},
        {"name": "status", "type": "text", "enum": True, "options": ["Active", "On Leave", "Resigned"]},
        {"name": "report_date", "type": "date", "enum": False},
        {"name": "hours_worked", "type": "number", "enum": False},
        {"name": "performance", "type": "text", "enum": True, "options": ["Excellent", "Good", "Average", "Poor"]}
    ]

# 🔁 Replace DB filename and table name here if using a different dataset.
def query_reports(filters):
    conn = sqlite3.connect('employee_reports.db') # 🔁 Change DB file if needed
    cursor = conn.cursor()
    schema = get_schema()

    query = "SELECT * FROM employee_reports WHERE 1=1"  # 🔁 Change table name if needed
    values = []

    for col in schema:
        name = col["name"]
        if col.get("enum"):
            selected = filters.get(name)
            if selected and isinstance(selected, list):
                placeholders = ','.join(['?'] * len(selected))
                query += f" AND {name} IN ({placeholders})"
                values.extend(selected)
        elif col["type"] == "text":
            val = filters.get(name)
            if val:
                query += f" AND LOWER({name}) LIKE ?"
                values.append(f"%{val.lower()}%")
        elif col["type"] == "number":
            min_key = f"min_{name}"
            max_key = f"max_{name}"
            if filters.get(min_key):
                query += f" AND {name} >= ?"
                values.append(filters[min_key])
            if filters.get(max_key):
                query += f" AND {name} <= ?"
                values.append(filters[max_key])
        elif col["type"] == "date":
            start_key = f"start_{name}"
            end_key = f"end_{name}"
            if filters.get(start_key):
                query += f" AND {name} >= ?"
                values.append(filters[start_key])
            if filters.get(end_key):
                query += f" AND {name} <= ?"
                values.append(filters[end_key])

    cursor.execute(query, values)
    results = cursor.fetchall()
    conn.close()
    return results

@app.route('/api/reports', methods=['POST'])
def get_reports():
    filters = request.get_json()
    schema = get_schema()
    data = query_reports(filters)
    columns = [col["name"] for col in schema]

    reports = [dict(zip(columns, row)) for row in data]

    selected_columns = filters.get("columns")
    if selected_columns:
        reports = [
            {key: record[key] for key in selected_columns if key in record}
            for record in reports
        ]

    return jsonify({"count": len(reports), "records": reports})

@app.route('/api/reports/pdf', methods=['POST'])
def generate_pdf():
    filters = request.get_json()
    schema = get_schema()
    columns = [col["name"] for col in schema]
    data = query_reports(filters)
    selected_columns = filters.get("columns") or columns

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    styles = getSampleStyleSheet()
    elements.append(Paragraph("Report", styles['Title']))
    elements.append(Spacer(1, 12))

    # 🔍 Add applied filters to the PDF
    filters_applied = []
    for col in schema:
        name = col["name"]
        if col.get("enum"):
            val = ", ".join(filters.get(name, [])) or "All"
        elif col["type"] == "number":
            min_val = filters.get(f"min_{name}", "")
            max_val = filters.get(f"max_{name}", "")
            val = f"{min_val} to {max_val}" if min_val or max_val else "Any"
        elif col["type"] == "date":
            start = filters.get(f"start_{name}", "")
            end = filters.get(f"end_{name}", "")
            val = f"{start} to {end}" if start or end else "Any"
        else:
            val = filters.get(name, "") or "All"
        filters_applied.append(f"{name.replace('_', ' ').title()}: {val}")

    for line in filters_applied:
        elements.append(Paragraph(line, styles['Normal']))
    elements.append(Spacer(1, 12))

    # 🔢 Add total count
    elements.append(Paragraph(f"Total Records: {len(data)}", styles['Heading4']))
    elements.append(Spacer(1, 12))

    # 🧾 Table
    table_data = [selected_columns] + [
        [row[columns.index(col)] for col in selected_columns] for row in data
    ]

    table = Table(table_data, repeatRows=1, colWidths=[6.5 * inch / len(selected_columns)] * len(selected_columns))
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
    return send_file(buffer, as_attachment=True, download_name="Report.pdf", mimetype='application/pdf')


@app.route('/api/reports/csv', methods=['POST'])
def generate_csv():
    filters = request.get_json()
    schema = get_schema()
    columns = [col["name"] for col in schema]
    data = query_reports(filters)
    selected_columns = filters.get("columns") or columns

    df = pd.DataFrame(data, columns=columns)
    df = df[selected_columns]

    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    return send_file(
        io.BytesIO(output.getvalue().encode()),
        mimetype="text/csv",
        as_attachment=True,
        download_name="Report.csv"
    )

@app.route('/api/reports/excel', methods=['POST'])
def generate_excel():
    filters = request.get_json()
    schema = get_schema()
    columns = [col["name"] for col in schema]
    data = query_reports(filters)
    selected_columns = filters.get("columns") or columns

    df = pd.DataFrame(data, columns=columns)
    df = df[selected_columns]

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Report')
    output.seek(0)

    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name="Report.xlsx"
    )

@app.route("/api/reports/columns", methods=["GET"])
def get_columns():
    return jsonify(get_schema())

@app.route("/")
def index():
    return "Report API is running."

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
