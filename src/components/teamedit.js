import React, {
  useEffect,
  useState,
  useCallback,
  forwardRef
} from "react";
import "./TeamEdit.css";
import { ProjectDataService } from "../services/ProjectDataService";
import TableRow from "./TableRow";
import QuarterPicker from "./QuarterPicker";
import { format } from "date-fns";
import { getCurrentQuarterString, getCurrentYear } from "../utils/dateUtils";

const defaultQuarterMonths = {
  1: [0, 1, 2],
  2: [3, 4, 5],
  3: [6, 7, 8],
  4: [9, 10, 11],
};
const getQuarterMonths = (quarterString) => {
  // Extract number from "Q1", "Q2", etc.
  const quarterNum = parseInt(quarterString.replace('Q', ''));
  return defaultQuarterMonths[quarterNum] || [0, 1, 2];
};

const TeamEdit = forwardRef(({ selectedUser, navigate }, ref) => {
  const [userData, setUserData] = useState(null);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);  const [initialRowsData, setInitialRowsData] = useState("");  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarterString());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());

  useEffect(() => {
    if (!selectedUser) {
      setLoadError("No user selected. Please navigate back and select a user.");
      setIsLoading(false);
      return;
    }
    setUserData({
      name: selectedUser.name,
      email: selectedUser.email,
      laborCategory: selectedUser.laborCategory,
      scheduledHours: selectedUser.scheduledHours || 40,
    });
  }, [selectedUser]);

  // Load allocations for the selected quarter/year
  useEffect(() => {
    if (!selectedUser || !selectedQuarter || !selectedYear) {
      setRows([]);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    setHasUnsavedChanges(false);
    ProjectDataService.getAllocationsByQuarter(
      selectedUser.email,
      selectedYear,
      selectedQuarter
    )
      .then((data) => {
        const processedRows = (Array.isArray(data) ? data : []).map(
          (allocation) => ({
            id: allocation.ra_id,
            projectNumber: allocation.project_number,
            projectName: allocation.project_name,
            milestone: allocation.milestone_name,
            pm: allocation.project_manager,
            labor: allocation.contract_labor,
            pctLaborUsed: allocation.forecast_pm_labor * 100,
            month: allocation.month || 0,
            month1: allocation.month1 || 0,
            month2: allocation.month2 || 0,
            remarks: allocation.remarks,
          })
        );
        setRows(processedRows);
        setInitialRowsData(JSON.stringify(processedRows));
        setIsLoading(false);
      })
      .catch((error) => {
        setLoadError("Failed to load allocations.");
        setRows([]);
        setIsLoading(false);
      });
  }, [selectedUser, selectedQuarter, selectedYear]);

  // Track changes when rows are modified
  useEffect(() => {
    if (rows.length > 0 && !isLoading) {
      const initialRowsJSON = JSON.stringify(rows);
      if (!hasUnsavedChanges) {
        setInitialRowsData(initialRowsJSON);
      } else {
        const currentRowsJSON = JSON.stringify(rows);
        setHasUnsavedChanges(initialRowsData !== currentRowsJSON);
      }
    }
  }, [rows, isLoading, hasUnsavedChanges, initialRowsData]);

  // Add row
  const addRow = useCallback(() => {
    setRows((prevRows) => [
      ...prevRows,
      {
        projectNumber: "",
        projectName: "",
        milestone: "",
        pm: "",
        labor: "",
        pctLaborUsed: "",
        month: "",
        month1: "",
        month2: "",
        remarks: "",
      },
    ]);
    setHasUnsavedChanges(true);
  }, []);

  const updateRow = useCallback((index, field, value) => {
    setRows((prevRows) => {
      const newRows = [...prevRows];
      newRows[index][field] = value;
      return newRows;
    });
  }, []);

  // Quarter/month column headers
  const getMonthNames = () => {
    if (!selectedQuarter || !selectedYear) return ["", "", ""];
    const months = getQuarterMonths(selectedQuarter);
    return months.map((m) =>
      format(new Date(selectedYear, m, 1), "MMMM yyyy")
    );
  };
  const [monthCol, month1Col, month2Col] = getMonthNames();

  // Save logic (implement as needed)
  // ...

  return (
    <div className="team-edit-container">
      {loadError && <div className="error-banner">{loadError}</div>}
      <QuarterPicker
        className="resource-quarter-picker"
        onQuarterChange={(q, y) => {
          setSelectedQuarter(q);
          setSelectedYear(y);
        }}
        initialYear={selectedYear}
        initialQuarter={selectedQuarter}
      />
      <div className="user-info-container">
        <span className="user-label">User:</span>
        <span className="user-name">{userData?.name || selectedUser?.name}</span>
      </div>
      <button onClick={addRow}>Add Row</button>
      <table className="resource-table">
        <thead>
          <tr>
            <th>Project No.</th>
            <th>Project Name</th>
            <th>Milestone</th>
            <th>Project Manager</th>
            <th>Contract Total Labor</th>
            <th>% EAC Labor Used</th>
            <th>{monthCol} Hours</th>
            <th>{month1Col} Hours</th>
            <th>{month2Col} Hours</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <TableRow
              key={row.id || index}
              row={row}
              index={index}
              updateRow={updateRow}
              isLoading={isLoading}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default TeamEdit;
