import React, { useEffect, useState, useCallback } from 'react';
import './TeamEdit.css';
import { ProjectDataService } from '../services/ProjectDataService';
import TableRow from './TableRow';
import WeekPicker from './WeekPicker'; 
import { format } from 'date-fns';

const TeamEdit = ({ selectedUser, navigate }) => {
  const [userData, setUserData] = useState(null);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [weekStartDate, setWeekStartDate] = useState(null);
  const [weekEndDate, setWeekEndDate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!selectedUser) {
      console.error("No selected user provided to TeamEdit. Cannot fetch data.");
      setLoadError("No user selected. Please navigate back and select a user.");
      setIsLoading(false);
      return;
    }

    console.log("Selected user received in TeamEdit:", selectedUser);

    // Initialize week dates if not already set
    if (!weekStartDate || !weekEndDate) {
      const today = new Date();
      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = format(today, 'yyyy-MM-dd');
      console.log("Initializing week dates:", { startDate, endDate });
      setWeekStartDate(startDate);
      setWeekEndDate(endDate);
    }

    if (selectedUser && weekStartDate && weekEndDate) {
      console.log("Fetching data for selected user in TeamEdit:", selectedUser);
      setUserData({
        name: selectedUser.name,
        email: selectedUser.email,
        laborCategory: selectedUser.laborCategory,
        scheduledHours: selectedUser.scheduledHours || 40,
      });

      fetchAllocations(selectedUser.email, weekStartDate, weekEndDate);
    }
  }, [selectedUser, weekStartDate, weekEndDate]);

  const fetchAllocations = async (email, startDate, endDate) => {
    try {
      setIsLoading(true);
      setLoadError(null);

      console.log(`Fetching allocations for ${email} from ${startDate} to ${endDate}`);
      const data = await ProjectDataService.getAllocations(email, startDate, endDate);

      console.log("Received allocations:", data); // Debug log to verify data
      if (!Array.isArray(data) || data.length === 0) {
        console.warn("No allocations received or data is not an array.");
      }

      const processedRows = data.map(allocation => ({
        id: allocation.ra_id,
        projectNumber: allocation.project_number,
        projectName: allocation.project_name,
        milestone: allocation.milestone_name,
        pm: allocation.project_manager,
        labor: allocation.contract_labor,
        pctLaborUsed: allocation.forecast_pm_labor * 100, // Convert to percentage
        hours: allocation.hours,
        remarks: allocation.remarks,
      }));
      setRows(processedRows);
    } catch (error) {
      console.error("Error fetching allocations:", error);
      setLoadError("Failed to load allocations.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeekChange = useCallback((startDate, endDate) => {
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');

    console.log("Week changed in TeamEdit:", { startDate: formattedStartDate, endDate: formattedEndDate });
    setWeekStartDate(formattedStartDate);
    setWeekEndDate(formattedEndDate);

    if (userData) {
      fetchAllocations(userData.email, formattedStartDate, formattedEndDate);
    }
  }, [userData]);

  const addRow = useCallback(() => {
    setRows(prevRows => [
      ...prevRows,
      {
        projectNumber: '',
        projectName: '',
        milestone: '',
        pm: '',
        labor: '',
        pctLaborUsed: '',
        hours: '',
        remarks: '',
      },
    ]);
  }, []);

  const updateRow = useCallback((index, field, value) => {
    setRows(prevRows => {
      const newRows = [...prevRows];
      newRows[index][field] = value;
      return newRows;
    });
  }, []);

  const deleteRow = useCallback(async (index) => {
    const rowToDelete = rows[index];

    if (rowToDelete.id) {
      try {
        setIsSaving(true);
        await ProjectDataService.deleteAllocation(rowToDelete.id);
        setRows(prevRows => prevRows.filter((_, i) => i !== index));
        console.log(`Deleted allocation with ID: ${rowToDelete.id}`);
      } catch (error) {
        console.error("Failed to delete allocation:", error);
      } finally {
        setIsSaving(false);
      }
    } else {
      setRows(prevRows => prevRows.filter((_, i) => i !== index));
    }
  }, [rows]);

  const calculateTotalHours = useCallback(() => {
    return rows.reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);
  }, [rows]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setLoadError(null);

      console.log("Saving allocations for user:", userData.email);

      const savePromises = rows.map(row => {
        if (!row.projectNumber || !row.hours) {
          console.warn("Skipping row with missing project number or hours:", row);
          return null;
        }

        if (row.id) {
          // Update existing allocation
          return ProjectDataService.updateAllocation(row.id, row.hours, row.remarks);
        } else {
          // Create new allocation
          return ProjectDataService.saveResourceAllocation({
            email: userData.email,
            project_number: row.projectNumber,
            hours: parseFloat(row.hours) || 0,
            remarks: row.remarks || "",
            week_start: weekStartDate,
            week_end: weekEndDate,
          });
        }
      });

      // Wait for all save operations to complete
      const results = await Promise.all(savePromises.filter(Boolean));
      console.log("Save results:", results);

      // Redirect to LeadershipPage on successful save
      navigate('leadership');
    } catch (error) {
      console.error("Error saving allocations:", error);
      setLoadError("Failed to save allocations. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!userData) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="team-edit-container">
      <WeekPicker onWeekChange={handleWeekChange} />
      <div className="user-info-container">
        <span className="user-label">Team Member:</span>
        <span className="user-name">{userData.name}</span>
        <div className="scheduled-hours-container">
          <label htmlFor="scheduledHours">Scheduled Hours:</label>
          <input
            id="scheduledHours"
            type="number"
            value={userData.scheduledHours}
            readOnly
            disabled
            min="0"
            max="168"
          />
        </div>
      </div>

      
      {isLoading ? (
        <div>Loading allocations...</div>
      ) : loadError ? (
        <div className="error-message">{loadError}</div>
      ) : (
        <table className="resource-table">
          <thead>
            <tr>
              <th>Project No.</th>
              <th>Project No. & Name</th>
              <th>Milestone</th>
              <th>Project Manager</th>
              <th>Contract Total Labor</th>
              <th>Reported % Complete</th>
              <th>Planned Hours</th>
              <th>Remarks</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <TableRow
                key={index}
                row={row}
                index={index}
                updateRow={updateRow}
                deleteRow={deleteRow}
              />
            ))}
            <tr className="group-total">
              <td colSpan="6" style={{ textAlign: 'right' }}>Total:</td>
              <td>{calculateTotalHours()}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      )}

      <div className="table-actions">
        <button onClick={addRow} className="add-btn" disabled={isSaving || isLoading}>Add Row</button>
        <button 
          onClick={handleSave} 
          className="save-btn" 
          disabled={isSaving || isLoading}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default TeamEdit;