import { useState } from "react";
import axios from "axios";
import "./App.css"; // Optional if you're using plain CSS
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function App() {
  const [filters, setFilters] = useState({
    employee_name: "",
    department: [],
    status: [],
    performance: [],
    start_date: "",
    end_date: "",
    min_hours: "",
    max_hours: "",
  });

  const [reports, setReports] = useState([]);
  const allColumns = [
  "id",
  "employee_name",
  "department",
  "status",
  "report_date",
  "hours_worked",
  "performance",
];

const [selectedColumns, setSelectedColumns] = useState([...allColumns]);
filters.columns = selectedColumns; 
  const fetchReports = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/api/reports", filters);
      setReports(res.data);
      if (res.data.length === 0) {
        toast.warning("No results found");
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } 
  };

  const downloadPdf = async () => {
  try {
    const res = await axios.post(
      "http://127.0.0.1:5000/api/reports/pdf",
      {
        ...filters,
        columns: selectedColumns, // ✅ include selected columns
      },
      { responseType: "blob" }
    );

    const blob = new Blob([res.data], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "employee_report.pdf";
    link.click();

    toast.success("PDF report downloaded");
  } catch (error) {
    console.error("PDF generation failed:", error);
    toast.error("Failed to generate PDF report");
  }
};




  const downloadCsv = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/api/reports/csv",filters,{ responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "employee_report.csv";
      link.click();
      toast.success("CSV report downloaded");
    } catch (err) {
      console.error("CSV download failed:", err);
    }
  };

  const downloadExcel = async () => {
  try {
    const res = await axios.post("http://127.0.0.1:5000/api/reports/excel",filters,{ responseType: "blob" });
    const blob = new Blob([res.data], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "employee_report.xlsx";
    link.click();
    toast.success("Excel report downloaded");
  } catch (err) {
    console.error("Excel download failed:", err);
  }
};


  return (

    <div style={{ padding: "20px", fontFamily: "Arial" }}>
    <ToastContainer position="top-right" autoClose={3000} />
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


<small style={{ color: "#555" }}>
  * You can enter multiple names separated by commas (e.g., John, Alice)
</small>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Employee Name"
          value={filters.employee_name}
          onChange={(e) => setFilters({ ...filters, employee_name: e.target.value })}
        />

        <div style={{ marginBottom: "15px" }}>
  <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>Department:</label>
  
  {["HR", "Engineering", "Sales", "Marketing"].map((dept) => (
    <label key={dept} style={{ marginRight: "15px" }}>
      <input
        type="checkbox"
        value={dept}
        checked={filters.department.includes(dept)}
        onChange={(e) => {
          const checked = e.target.checked;
          const value = e.target.value;
          setFilters((prev) => ({
            ...prev,
            department: checked
              ? [...prev.department, value]
              : prev.department.filter((d) => d !== value)
          }));
        }}
      />
      {` ${dept}`}
    </label>
  ))}
</div>



<div style={{ marginBottom: "15px" }}>
  <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>Status:</label>

  {["Active", "On Leave", "Resigned"].map((status) => (
    <label key={status} style={{ marginRight: "15px" }}>
      <input
        type="checkbox"
        value={status}
        checked={filters.status.includes(status)}
        onChange={(e) => {
          const checked = e.target.checked;
          const value = e.target.value;
          setFilters((prev) => ({
            ...prev,
            status: checked
              ? [...prev.status, value]
              : prev.status.filter((s) => s !== value)
          }));
        }}
      />
      {` ${status}`}
    </label>
  ))}
</div>



<div style={{ marginBottom: "15px" }}>
  <label style={{ fontWeight: "bold", marginBottom: "5px", display: "block" }}>Performance:</label>

  {["Excellent", "Good", "Average", "Poor"].map((perf) => (
    <label key={perf} style={{ marginRight: "15px" }}>
      <input
        type="checkbox"
        value={perf}
        checked={filters.performance.includes(perf)}
        onChange={(e) => {
          const checked = e.target.checked;
          const value = e.target.value;
          setFilters((prev) => ({
            ...prev,
            performance: checked
              ? [...prev.performance, value]
              : prev.performance.filter((p) => p !== value)
          }));
        }}
      />
      {` ${perf}`}
    </label>
  ))}
</div>



<DatePicker
  selected={filters.start_date ? new Date(filters.start_date) : null}
  onChange={(date) =>
    setFilters({ ...filters, start_date: date ? date.toISOString().split("T")[0] : "" })
  }
  placeholderText="Start Date"
/>

<DatePicker
  selected={filters.end_date ? new Date(filters.end_date) : null}
  onChange={(date) =>
    setFilters({ ...filters, end_date: date ? date.toISOString().split("T")[0] : "" })
  }
  placeholderText="End Date"
/>


        <input
          type="number"
          placeholder="Min Hours"
          value={filters.min_hours}
          onChange={(e) => setFilters({ ...filters, min_hours: e.target.value })}
        />
        <input
          type="number"
          placeholder="Max Hours"
          value={filters.max_hours}
          onChange={(e) => setFilters({ ...filters, max_hours: e.target.value })}
        />
         

      <div>
  <label><strong>Select Columns:</strong></label>
  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
    {allColumns.map((col) => (
      <label key={col}>
        <input
          type="checkbox"
          checked={selectedColumns.includes(col)}
          onChange={() => {
            setSelectedColumns((prev) =>
              prev.includes(col)
                ? prev.filter((c) => c !== col)
                : [...prev, col]
            );
          }}
        />
        {col.replace("_", " ")}
      </label>
    ))}
  </div>
</div>
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

<button
  onClick={() => {
    const clearedFilters = {
      employee_name: "",
      department: [],
      status: [],
      performance: [],
      start_date: "",
      end_date: "",
      min_hours: "",
      max_hours: ""
    };
    setFilters(clearedFilters);

      setSelectedColumns([
      "id",
      "employee_name",
      "department",
      "status",
      "report_date",
      "hours_worked",
      "performance"
    ]);

    toast.info("Filters cleared");
    // Ensure filters state is updated before fetching
    setTimeout(() => {
      fetchReports();
    }, 0);
  }}
  style={{
    padding: "8px 16px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginLeft: "10px"
  }}
>
  Clear All Filters
</button>





</div>


{reports.length > 0 && (
  <div style={{ margin: "10px 0", fontWeight: "bold", fontSize: "16px", color: "#333" }}>
    Total Records: {reports.length}
  </div>
)}
 


<table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
  <thead style={{ backgroundColor: "#f2f2f2" }}>
    <tr>
      {selectedColumns.includes("id") && <th>ID</th>}
      {selectedColumns.includes("employee_name") && <th>Name</th>}
      {selectedColumns.includes("department") && <th>Dept</th>}
      {selectedColumns.includes("status") && <th>Status</th>}
      {selectedColumns.includes("report_date") && <th>Date</th>}
      {selectedColumns.includes("hours_worked") && <th>Hours</th>}
      {selectedColumns.includes("performance") && <th>Performance</th>}
    </tr>
  </thead>
  <tbody>
    {reports.map((report) => (
      <tr key={report.id}>
        {selectedColumns.includes("id") && <td>{report.id}</td>}
        {selectedColumns.includes("employee_name") && <td>{report.employee_name}</td>}
        {selectedColumns.includes("department") && <td>{report.department}</td>}
        {selectedColumns.includes("status") && <td>{report.status}</td>}
        {selectedColumns.includes("report_date") && <td>{report.report_date}</td>}
        {selectedColumns.includes("hours_worked") && <td>{report.hours_worked}</td>}
        {selectedColumns.includes("performance") && <td>{report.performance}</td>}
      </tr>
    ))}
  </tbody>
</table>



    </div>
  );
}

export default App;

