import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

import FilterPanel from "./components/FilterPanel";
import ReportTable from "./components/ReportTable";
import ActionButtons from "./components/ActionButtons";

function App() {
  const [schema, setSchema] = useState([]);
  const [filters, setFilters] = useState({});
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [reports, setReports] = useState([]);
  const [recordCount, setRecordCount] = useState(0);


  // Fetch schema on initial load
  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const res = await axios.get("https://employee-report.onrender.com/api/reports/columns"); //Change URL if needed
        setSchema(res.data);
        setSelectedColumns(res.data.map((col) => col.name)); // default: all selected

        // Dynamically initialize filters
        const initial = {};
        res.data.forEach((col) => {
          if (col.enum) {
            initial[col.name] = [];
          } else if (col.type === "number") {
            initial[`min_${col.name}`] = "";
            initial[`max_${col.name}`] = "";
          } else if (col.type === "date") {
            initial[`start_${col.name}`] = "";
            initial[`end_${col.name}`] = "";
          } else {
            initial[col.name] = "";
          }
        });
        setFilters(initial);
      } catch (err) {
        console.error("Failed to fetch schema:", err);
        toast.error("Error loading column schema");
      }
    };

    fetchSchema();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.post("https://employee-report.onrender.com/api/reports", { //Change URL if needed
        ...filters,
        columns: selectedColumns,
      });
      setReports(res.data.records);
      setRecordCount(res.data.count);
      if (res.data.length === 0) toast.warning("No results found");
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to fetch reports");
    }
  };

  const downloadPdf = async () => {
    try {
      const res = await axios.post(
        "https://employee-report.onrender.com/api/reports/pdf", //Change URL if needed
        { ...filters, columns: selectedColumns },
        { responseType: "blob" }
      );
      triggerDownload(res.data, "employee_report.pdf", "application/pdf");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  const downloadCsv = async () => {
    try {
      const res = await axios.post(
        "https://employee-report.onrender.com/api/reports/csv", //Change URL if needed
        { ...filters, columns: selectedColumns },
        { responseType: "blob" }
      );
      triggerDownload(res.data, "employee_report.csv", "text/csv");
    } catch (error) {
      console.error("CSV generation failed:", error);
      toast.error("Failed to generate CSV");
    }
  };

  const downloadExcel = async () => {
    try {
      const res = await axios.post(
        "https://employee-report.onrender.com/api/reports/excel", //Change URL if needed
        { ...filters, columns: selectedColumns },
        { responseType: "blob" }
      );
      triggerDownload(
        res.data,
        "employee_report.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    } catch (error) {
      console.error("Excel download failed:", error);
      toast.error("Failed to generate Excel");
    }
  };

  const triggerDownload = (blobData, filename, mime) => {
    const blob = new Blob([blobData], { type: mime });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const clearFilters = () => {
    const cleared = {};
    schema.forEach((col) => {
      if (col.enum) {
        cleared[col.name] = [];
      } else if (col.type === "number") {
        cleared[`min_${col.name}`] = "";
        cleared[`max_${col.name}`] = "";
      } else if (col.type === "date") {
        cleared[`start_${col.name}`] = "";
        cleared[`end_${col.name}`] = "";
      } else {
        cleared[col.name] = "";
      }
    });

    setFilters(cleared);
    setSelectedColumns(schema.map((col) => col.name));
    toast.info("Filters cleared");
    setTimeout(fetchReports, 0);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <ToastContainer position="top-right" autoClose={3000} />

      <div
        style={{
          backgroundColor: "#e0f7fa",
          border: "2px solid #00acc1",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "30px",
          textAlign: "center",
          boxShadow: "0 4px 10px rgba(0, 172, 193, 0.2)",
        }}
      >
        <h1 style={{ fontSize: "30px", margin: 0, color: "#006064" }}>
          📄 Report Generator
        </h1>
      </div>

      {schema.length > 0 ? (
        <>
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            selectedColumns={selectedColumns}
            setSelectedColumns={setSelectedColumns}
            schema={schema}
          />

          <ActionButtons
            fetchReports={fetchReports}
            downloadPdf={downloadPdf}
            downloadCsv={downloadCsv}
            downloadExcel={downloadExcel}
            clearFilters={clearFilters}
          />

          {reports.length > 0 && (
            <div style={{ margin: "10px 0", fontWeight: "bold" }}>
              Total Records: {recordCount}
            </div>
          )}


          <ReportTable reports={reports} selectedColumns={selectedColumns} schema={schema} />
        </>
      ) : (
        <p>Loading schema...</p>
      )}
    </div>
  );
}

export default App;
