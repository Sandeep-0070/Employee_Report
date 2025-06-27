import React from "react";

function ActionButtons({
  fetchReports,
  downloadPdf,
  downloadCsv,
  downloadExcel,
  clearFilters,
}) {
  return (
    <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
      <button onClick={fetchReports} style={btnStyle("#4CAF50")}>Generate Report</button>
      <button onClick={downloadPdf} style={btnStyle("#007BFF")}>Download PDF</button>
      <button onClick={downloadCsv} style={btnStyle("#FFA500")}>Export CSV</button>
      <button onClick={downloadExcel} style={btnStyle("#6f42c1")}>Export Excel</button>
      <button onClick={clearFilters} style={btnStyle("#dc3545")}>Clear All Filters</button>
    </div>
  );
}

const btnStyle = (bg) => ({
  backgroundColor: bg,
  color: "white",
  padding: "10px 15px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
});

export default ActionButtons;
