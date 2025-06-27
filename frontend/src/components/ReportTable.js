import React from "react";

function ReportTable({ reports, selectedColumns, schema = [] }) {
  const columnLabels = {};
  if (Array.isArray(schema)) {
    schema.forEach((col) => {
      columnLabels[col.name] = col.name.replace(/_/g, " ").toUpperCase();
    });
  }

  return (
    <div style={{ marginTop: "30px" }}>
      {reports.length === 0 ? (
        <p>No data to display.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#00acc1", color: "#fff" }}>
              {selectedColumns.map((col) => (
                <th
                  key={col}
                  style={{
                    padding: "10px",
                    border: "1px solid #ccc",
                    textTransform: "capitalize",
                  }}
                >
                  {columnLabels[col] || col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  backgroundColor: rowIndex % 2 === 0 ? "#f9f9f9" : "#fff",
                }}
              >
                {selectedColumns.map((col) => (
                  <td
                    key={col}
                    style={{
                      padding: "8px",
                      border: "1px solid #ccc",
                      textAlign: "center",
                    }}
                  >
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ReportTable;
