import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function FilterPanel({ filters, setFilters, selectedColumns, setSelectedColumns, schema }) {
  const handleInputChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleCheckboxChange = (key, option) => {
    const current = filters[key] || [];
    if (current.includes(option)) {
      setFilters((prev) => ({ ...prev, [key]: current.filter((v) => v !== option) }));
    } else {
      setFilters((prev) => ({ ...prev, [key]: [...current, option] }));
    }
  };

  const renderInput = (col) => {
    if (col.enum && col.options) {
      return (
        <div key={col.name}>
          <label><strong>{col.name}</strong></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {col.options.map((option) => (
              <label key={option}>
                <input
                  type="checkbox"
                  checked={filters[col.name]?.includes(option)}
                  onChange={() => handleCheckboxChange(col.name, option)}
                />
                {" " + option}
              </label>
            ))}
          </div>
        </div>
      );
    }

    if (col.type === "number") {
      return (
        <div key={col.name}>
          <label><strong>{col.name} (range)</strong></label>
          <div>
            <input
              type="number"
              placeholder={`Min ${col.name}`}
              value={filters[`min_${col.name}`] || ""}
              onChange={(e) => handleInputChange(`min_${col.name}`, e.target.value)}
            />
            <input
              type="number"
              placeholder={`Max ${col.name}`}
              value={filters[`max_${col.name}`] || ""}
              onChange={(e) => handleInputChange(`max_${col.name}`, e.target.value)}
            />
          </div>
        </div>
      );
    }

    if (col.type === "date") {
      return (
        <div key={col.name}>
          <label><strong>{col.name} (date range)</strong></label>
          <div style={{ display: "flex", gap: "10px" }}>
            <DatePicker
              selected={filters[`start_${col.name}`] ? new Date(filters[`start_${col.name}`]) : null}
              onChange={(date) =>
                handleInputChange(
                  `start_${col.name}`,
                  date ? date.toISOString().split("T")[0] : ""
                )
              }
              placeholderText={`Start ${col.name}`}
            />
            <DatePicker
              selected={filters[`end_${col.name}`] ? new Date(filters[`end_${col.name}`]) : null}
              onChange={(date) =>
                handleInputChange(
                  `end_${col.name}`,
                  date ? date.toISOString().split("T")[0] : ""
                )
              }
              placeholderText={`End ${col.name}`}
            />
          </div>
        </div>
      );
    }

    return (
      <div key={col.name}>
        <label><strong>{col.name}</strong></label>
        <input
          type="text"
          placeholder={`Enter ${col.name}`}
          value={filters[col.name] || ""}
          onChange={(e) => handleInputChange(col.name, e.target.value)}
        />
      </div>
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px", marginBottom: "20px" }}>
      {schema.map(renderInput)}

      <div style={{ gridColumn: "span 2" }}>
        <label><strong>Select Columns:</strong></label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {schema.map((col) => (
            <label key={col.name}>
              <input
                type="checkbox"
                checked={selectedColumns.includes(col.name)}
                onChange={() =>
                  setSelectedColumns((prev) =>
                    prev.includes(col.name)
                      ? prev.filter((c) => c !== col.name)
                      : [...prev, col.name]
                  )
                }
              />
              {col.name.replace("_", " ")}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FilterPanel;

