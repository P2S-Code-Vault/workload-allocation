import React, { useState, useEffect } from "react";
import "./WeekPicker.css";

const QUARTERS = [
  { label: "Q1", months: [1, 2, 3] },
  { label: "Q2", months: [4, 5, 6] },
  { label: "Q3", months: [7, 8, 9] },
  { label: "Q4", months: [10, 11, 12] },
];

const getQuarterFromMonth = (month) => {
  if (month >= 1 && month <= 3) return "Q1";
  if (month >= 4 && month <= 6) return "Q2";
  if (month >= 7 && month <= 9) return "Q3";
  return "Q4";
};

const QuarterPicker = ({ onQuarterChange, className = "", initialYear, initialQuarter }) => {
  const now = new Date();
  const defaultYear = initialYear || now.getFullYear();
  const defaultQuarter = initialQuarter || getQuarterFromMonth(now.getMonth() + 1);

  const [year, setYear] = useState(defaultYear);
  const [quarter, setQuarter] = useState(defaultQuarter);
  const [isInitialized, setIsInitialized] = useState(false);

  // Only call onQuarterChange after initial mount and when values actually change
  useEffect(() => {
    if (isInitialized && onQuarterChange) {
      onQuarterChange(quarter, year);
    }
  }, [quarter, year, onQuarterChange, isInitialized]);

  // Mark as initialized after first render
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  const handleQuarterChange = (e) => {
    setQuarter(e.target.value);
  };

  const handleYearChange = (e) => {
    setYear(Number(e.target.value));
  };

  return (
    <div className={`quarter-picker-outer ${className}`}>
      <div className="quarter-picker-box">
        <label className="quarter-label" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          Quarter:
          <select value={quarter} onChange={handleQuarterChange} className="quarter-select" style={{ marginLeft: 8 }}>
            {QUARTERS.map((q) => (
              <option key={q.label} value={q.label}>{q.label}</option>
            ))}
          </select>
        </label>
        <label className="year-label" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          Year:
          <input
            type="number"
            value={year}
            onChange={handleYearChange}
            min="2000"
            max="2100"
            className="year-input"
            style={{ marginLeft: 8, width: 90 }}
          />
        </label>
      </div>
    </div>
  );
};

export default QuarterPicker;
