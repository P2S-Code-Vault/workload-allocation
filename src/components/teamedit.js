import React, { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import './TeamEdit.css';
import { ProjectDataService } from '../services/ProjectDataService';
import TableRow from './TableRow';
import WeekPicker from './WeekPicker'; 
import { format, startOfWeek, endOfWeek } from 'date-fns';

const TeamEdit = forwardRef(({ selectedUser, navigate }, ref) => {
  const [userData, setUserData] = useState(null);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [weekStartDate, setWeekStartDate] = useState(null);
  const [weekEndDate, setWeekEndDate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialRowsData, setInitialRowsData] = useState('');

  useEffect(() => {
    if (!selectedUser) {
      console.error("No selected user provided to TeamEdit. Cannot fetch data.");
      setLoadError("No user selected. Please navigate back and select a user.");
      setIsLoading(false);
      return;
    }

    console.log("Selected user received in TeamEdit:", selectedUser);

    // Initialize week dates from localStorage or use current date as fallback
    if (!weekStartDate || !weekEndDate) {
      try {
        // Try to get the date from localStorage
        const storedDate = localStorage.getItem('selectedWeekDate');
        let initialDate;
        
        if (storedDate) {
          initialDate = new Date(storedDate);
          if (!(initialDate instanceof Date) || isNaN(initialDate)) {
            // Invalid date from storage, use current date
            initialDate = new Date();
          }
        } else {
          // No stored date, use current date
          initialDate = new Date();
        }
        
        const startDate = format(
          startOfWeek(initialDate, { weekStartsOn: 1 }),
          'yyyy-MM-dd'
        );
        const endDate = format(
          endOfWeek(initialDate, { weekStartsOn: 1 }),
          'yyyy-MM-dd'
        );
        
        console.log("TeamEdit - Initializing with dates:", { startDate, endDate });
        setWeekStartDate(startDate);
        setWeekEndDate(endDate);
      } catch (e) {
        console.warn("Error getting dates from localStorage:", e);
        // Default to current date if there's an error
        const today = new Date();
        const startDate = format(today, 'yyyy-MM-dd');
        const endDate = format(today, 'yyyy-MM-dd');
        console.log("Initializing with current date (after error):", { startDate, endDate });
        setWeekStartDate(startDate);
        setWeekEndDate(endDate);
      }
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

  useEffect(() => {
    // Track changes when rows are modified, but only after initial loading
    if (rows.length > 0 && !isLoading) {
      // Create a reference to original data to detect actual changes
      const initialRowsJSON = JSON.stringify(rows);
      
      // Store original data on first load
      if (!hasUnsavedChanges) {
        setInitialRowsData(initialRowsJSON);
      } else {
        // Compare current data with initial data
        const currentRowsJSON = JSON.stringify(rows);
        setHasUnsavedChanges(initialRowsData !== currentRowsJSON);
      }
    }
  }, [rows, isLoading]);

  const fetchAllocations = async (email, startDate, endDate) => {
    try {
      setIsLoading(true);
      setLoadError(null);
      setHasUnsavedChanges(false); // Reset unsaved changes flag when fetching new data

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
      
      // Store the initial state of the rows after loading
      setInitialRowsData(JSON.stringify(processedRows));
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

  // Update addRow to mark changes
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
    setHasUnsavedChanges(true); // Explicitly mark changes on add row
  }, []);

  const updateRow = useCallback((index, field, value) => {
    setRows(prevRows => {
      const newRows = [...prevRows];
      newRows[index][field] = value;
      return newRows;
    });
  }, []);

  // Update deleteRow to mark changes
  const deleteRow = useCallback(async (index) => {
    const rowToDelete = rows[index];

    if (rowToDelete.id) {
      try {
        setIsSaving(true);
        await ProjectDataService.deleteAllocation(rowToDelete.id);
        setRows(prevRows => prevRows.filter((_, i) => i !== index));
        console.log(`Deleted allocation with ID: ${rowToDelete.id}`);
        setHasUnsavedChanges(true); // Explicitly mark changes on delete row
      } catch (error) {
        console.error("Failed to delete allocation:", error);
      } finally {
        setIsSaving(false);
      }
    } else {
      setRows(prevRows => prevRows.filter((_, i) => i !== index));
      setHasUnsavedChanges(true); // Explicitly mark changes on delete row
    }
  }, [rows]);

  const calculateTotalHours = useCallback(() => {
    return rows.reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);
  }, [rows]);

  // Wrap the save function to accept a callback
  const saveWithCallback = async (callback) => {
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
      
      setHasUnsavedChanges(false);

      if (callback && typeof callback === 'function') {
        callback();
      } else {
        // Redirect to LeadershipPage with a refresh parameter
        // Clear hasUnsavedChanges before navigating to prevent the confirmation dialog
        navigate('leadership', { refresh: true, bypassConfirm: true });
      }
    } catch (error) {
      console.error("Error saving allocations:", error);
      setLoadError("Failed to save allocations. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Make hasUnsavedChanges and saveChanges accessible via ref
  useImperativeHandle(ref, () => ({
    hasUnsavedChanges: () => {
      // Check for route to leadership after save
      const bypassing = navigate.bypassConfirm === true;
      return bypassing ? false : hasUnsavedChanges;
    },
    saveChanges: saveWithCallback
  }));

  if (!userData) {
    return <div>Loading user data...</div>;
  }

  return (
    <div className="team-edit-container">
      <WeekPicker 
        onWeekChange={handleWeekChange} 
        hasUnsavedChanges={hasUnsavedChanges}
        onSaveChanges={saveWithCallback}
      />
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
          onClick={() => saveWithCallback()} 
          className="save-btn" 
          disabled={isSaving || isLoading}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
});

export default TeamEdit;