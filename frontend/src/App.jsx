import { useState } from "react";
import axios from "axios";
import "./App.css"; // Optional if you're using plain CSS

function App() {
  const [filters, setFilters] = useState({
    employee_name: "",
    department: "",
    status: "",
    performance: "",
    start_date: "",
    end_date: "",
    min_hours: "",
    max_hours: "",
  });

  const [reports, setReports] = useState([]);

  const fetchReports = async () => {
    try {
      const res = await axios.post("https://employee-report.onrender.com/api/reports", filters);
      setReports(res.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const downloadPdf = async () => {
    try {
      const res = await axios.post(
        "https://employee-report.onrender.com/api/reports/pdf",
        filters,
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "employee_report.pdf";
      link.click();
    } catch (error) {
      console.error("PDF generation failed:", error);
    }
  };

  const downloadCsv = async () => {
    try {
      const res = await axios.post("https://employee-report.onrender.com/api/reports/csv",filters,{ responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "employee_report.csv";
      link.click();
    } catch (err) {
      console.error("CSV download failed:", err);
    }
  };

  const downloadExcel = async () => {
  try {
    const res = await axios.post("https://employee-report.onrender.com/api/reports/excel",filters,{ responseType: "blob" });
    const blob = new Blob([res.data], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "employee_report.xlsx";
    link.click();
  } catch (err) {
    console.error("Excel download failed:", err);
  }
};


  return (

    <div style={{ padding: "20px", fontFamily: "Arial" }}>
    <div style={{
  backgroundColor: "#e0f7fa", // light cyan-blue
  border: "2px solid #00acc1",
  padding: "20px",
  borderRadius: "12px",
  marginBottom: "30px",
  textAlign: "center",
  boxShadow: "0 4px 10px rgba(0, 172, 193, 0.2)"
}}>
  <h1 style={{ fontSize: "30px", margin: 0, color: "#006064" }}>📄 Employee Report Generator</h1>
</div>



      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Employee Name"
          onChange={(e) => setFilters({ ...filters, employee_name: e.target.value })}
        />

        <select onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
          <option value="">Select Department</option>
          <option value="HR">HR</option>
          <option value="Engineering">Engineering</option>
          <option value="Sales">Sales</option>
          <option value="Marketing">Marketing</option>
        </select>

        <select onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Select Status</option>
          <option value="Active">Active</option>
          <option value="On Leave">On Leave</option>
          <option value="Resigned">Resigned</option>
        </select>

        <select onChange={(e) => setFilters({ ...filters, performance: e.target.value })}>
          <option value="">Select Performance</option>
          <option value="Excellent">Excellent</option>
          <option value="Good">Good</option>
          <option value="Average">Average</option>
          <option value="Poor">Poor</option>
        </select>

        <input
          type="date"
          onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
        />
        <input
          type="date"
          onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
        />

        <input
          type="number"
          placeholder="Min Hours"
          onChange={(e) => setFilters({ ...filters, min_hours: e.target.value })}
        />
        <input
          type="number"
          placeholder="Max Hours"
          onChange={(e) => setFilters({ ...filters, max_hours: e.target.value })}
        />
      </div>

      

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
  <button onClick={fetchReports} style={{ backgroundColor: "#4CAF50", color: "white", padding: "10px 15px", border: "none", borderRadius: "4px", cursor: "pointer" }}>
    Generate Report
  </button>
  <button onClick={downloadPdf} style={{ backgroundColor: "#007BFF", color: "white", padding: "10px 15px", border: "none", borderRadius: "4px", cursor: "pointer" }}>
    Download PDF
  </button>
  <button onClick={downloadCsv} style={{ backgroundColor: "#FFA500", color: "white", padding: "10px 15px", border: "none", borderRadius: "4px", cursor: "pointer" }}>
    Export CSV
  </button>
  <button onClick={downloadExcel} style={{ backgroundColor: "#6f42c1", color: "white", padding: "10px 15px", border: "none", borderRadius: "4px", cursor: "pointer" }}>
    Export Excel
  </button>
</div>


{reportData.length > 0 && (
  <div style={{ margin: "10px 0", fontWeight: "bold", fontSize: "16px", color: "#333" }}>
    Total Records: {reportData.length}
  </div>
)}



      <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ backgroundColor: "#f2f2f2" }}>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Dept</th>
            <th>Status</th>
            <th>Date</th>
            <th>Hours</th>
            <th>Performance</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>{report.id}</td>
              <td>{report.employee_name}</td>
              <td>{report.department}</td>
              <td>{report.status}</td>
              <td>{report.report_date}</td>
              <td>{report.hours_worked}</td>
              <td>{report.performance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;

