import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import headerLogo from './P2S_Legence_Logo_White.png';
import TableRow from './components/TableRow';
import { ProjectDataService } from './services/ProjectDataService';
import { UserService } from './services/UserService';
import WeekPicker from './components/WeekPicker';
import Login from './components/Login';
import PMPage from './components/PMPage';
import LeadershipPage from './components/LeadershipPage';
import GLView from './components/GLPage';
import format from 'date-fns/format';
import { startOfWeek, endOfWeek } from 'date-fns';
import API_CONFIG from './services/apiConfig';

// Header Component
const Header = ({ currentView,onNavigate, onLogout }) => {
  return (
    <header className="header">
      <img src={headerLogo} alt="Logo" className="header-logo" />
      {/* <h1 className="header-title">Resource Allocation</h1> */}
      <h1 className="header-title">
        {currentView === 'pm' ? 'Project Manager Dashboard' : 
         currentView === 'leadership' ? 'Group Leader Dashboard' : 
         'Resource Allocation'}
      </h1>
      <div className="nav-buttons">
        {/* <button 
          className="nav-button"
          onClick={() => onNavigate('pm')}
        >
          PM View
        </button>
        <button 
          className="nav-button"
          onClick={() => onNavigate('leadership')}
        >
          GL View
        </button>
        <button onClick={onLogout} className="logout-button">Logout</button> */}
         <button 
          className={`nav-button ${currentView === 'resource' ? 'disabled' : ''}`}
          onClick={() => currentView !== 'resource' && onNavigate('resource')}
          disabled={currentView === 'resource'}
        >
          Resource View
        </button>
        
        {/* PM View Button - disabled when on pm view */}
        <button 
          className={`nav-button ${currentView === 'pm' ? 'disabled' : ''}`}
          onClick={() => currentView !== 'pm' && onNavigate('pm')}
          disabled={currentView === 'pm'}
        >
          PM View
        </button>
        
        {/* GL View Button - disabled when on leadership view */}
        <button 
          className={`nav-button ${currentView === 'leadership' ? 'disabled' : ''}`}
          onClick={() => currentView !== 'leadership' && onNavigate('leadership')}
          disabled={currentView === 'leadership'}
        >
          GL View
        </button>
        
        {/* Logout Button - always enabled */}
        <button 
          className="nav-button logout-button"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

// Main Content Component
const MainContent = () => {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [currentUser, setCurrentUser] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [scheduledHours, setScheduledHours] = useState(40);
  const [ptoHolHours, setPTOHolHours] = useState(0);
  const [weekStartDate, setWeekStartDate] = useState(null);
  const [weekEndDate, setWeekEndDate] = useState(null);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [isGroupLeader, setIsGroupLeader] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.team-dropdown')) {
        setShowTeamDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set user data on component mount
  useEffect(() => {
    // Debug logging
    console.log("Checking for current user");
    
    const details = UserService.getCurrentUserDetails();
    console.log("User details from storage:", details);
    
    if (details && details.email) {
      console.log(`Setting current user to: ${details.email}`);
      setCurrentUser(details.email);
      setUserDetails(details);
      if (details.scheduledHours) {
        setScheduledHours(details.scheduledHours);
      }
      
      // Check if user is a group leader
      setIsGroupLeader(details.isGroupManager || false);
      
      // If the user is a group leader, fetch their team members
      if (details.isGroupManager) {
        fetchTeamMembers(details.email);
      }
    } else {
      console.warn("No valid user details found");
    }
  }, []);

  // const fetchTeamMembers = async (email) => {
  //   try {
  //     const apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_TEAM_MEMBERS}?group_manager_email=${encodeURIComponent(email)}`;
  //     console.log(`Fetching team members from: ${apiUrl}`);
      
  //     const response = await fetch(apiUrl);
  //     if (!response.ok) {
  //       throw new Error(`Failed to fetch team members: ${response.status}`);
  //     }
      
  //     const data = await response.json();
  //     console.log("Team members data:", data);
      
  //     if (data && data.members && data.members.length > 0) {
  //       setTeamMembers(data.members);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching team members:", error);
  //   }
  // };
  const fetchTeamMembers = async (email) => {
    try {
      // First check the status directly
      const statusUrl = `${API_CONFIG.BASE_URL}/gl/check-status?email=${encodeURIComponent(email)}`;
      console.log(`Checking GL status from: ${statusUrl}`);
      
      const statusResponse = await fetch(statusUrl);
      const statusData = await statusResponse.json();
      
      console.log("GL status check:", statusData);
      
      // Update group leader status based on direct check
      if (statusData.is_group_manager) {
        setIsGroupLeader(true);
        
        // Now fetch team members
        const apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_TEAM_MEMBERS}?group_manager_email=${encodeURIComponent(email)}`;
        console.log(`Fetching team members from: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch team members: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Team members data:", data);
        
        if (data && data.members && data.members.length > 0) {
          setTeamMembers(data.members);
        } else {
          console.log("No team members found, but user is a group leader");
        }
      } else {
        console.log("User is not a group leader according to direct database check");
        setIsGroupLeader(false);
      }
    } catch (error) {
      console.error("Error checking group leader status or fetching team members:", error);
    }
  };

  const handleTeamMemberSelect = (member) => {
    console.log(`Selected team member: ${member.name}, ${member.email}`);
    setSelectedTeamMember(member);
    
    // Reset states for the new team member
    setRows([]);
    setLoadError(null);
    setHasLoadedInitialData(false);
    
    // This will trigger the useEffect that loads allocations
    setCurrentUser(member.email);
  };

  const resetToGroupLeader = () => {
    console.log("Resetting to group leader view");
    setSelectedTeamMember(null);
    
    // Reset states
    setRows([]);
    setLoadError(null);
    setHasLoadedInitialData(false);
    
    // Set current user back to the group leader
    setCurrentUser(userDetails.email);
  };

  // Handle week change
  const handleWeekChange = useCallback((startDate, endDate) => {
    console.log("Week changed in MainContent:", {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });
    setWeekStartDate(startDate);
    setWeekEndDate(endDate);
  }, []);

  // Calculate PTO hours based on rows
  useEffect(() => {
    const ptoHours = rows.reduce((sum, row) => {
      if (row.projectNumber?.startsWith('0000-0000-0PTO') || 
          row.projectNumber?.startsWith('0000-0000-0HOL')) {
        return sum + (parseFloat(row.hours) || 0);
      }
      return sum;
    }, 0);
    
    setPTOHolHours(ptoHours);
  }, [rows]);

  // IMPORTANT: Initialize week dates if not set by WeekPicker
  useEffect(() => {
    if (!weekStartDate || !weekEndDate) {
      const today = new Date();
      const startDate = startOfWeek(today, { weekStartsOn: 0 });
      const endDate = endOfWeek(today, { weekStartsOn: 0 });
      
      console.log("Initializing with current week:", {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      });
      
      setWeekStartDate(startDate);
      setWeekEndDate(endDate);
    }
  }, []);

  // Debug the dependencies in the allocation loading effect
  useEffect(() => {
    // Log the state of dependencies whenever they change
    console.log("Allocation effect dependencies changed:", {
      currentUser,
      weekStartDate: weekStartDate ? format(weekStartDate, 'yyyy-MM-dd') : null,
      weekEndDate: weekEndDate ? format(weekEndDate, 'yyyy-MM-dd') : null,
      isLoading
    });
  }, [currentUser, weekStartDate, weekEndDate, isLoading]);
  
  // Load data when week dates change
  useEffect(() => {
    // Only proceed if we have both a user and date range
    if (!currentUser || !weekStartDate || !weekEndDate) {
      console.log("Skipping allocation load - missing required data");
      return;
    }

    // Don't reload if already loading
    if (isLoading && hasLoadedInitialData) {
      console.log("Already loading, skip duplicate request");
      return;
    }

    // Track if this effect should continue updating state
    let isMounted = true;
    
    // Set loading state
    setIsLoading(true);
    setLoadError(null);
    
    console.log("Loading allocations for:", {
      email: currentUser,
      startDate: format(weekStartDate, 'yyyy-MM-dd'),
      endDate: format(weekEndDate, 'yyyy-MM-dd')
    });
    
    // Make a direct API call to test endpoint accessibility
    console.log(`Testing API endpoint: /allocations?email=${encodeURIComponent(currentUser)}`);
    fetch(`http://localhost:8000/allocations?email=${encodeURIComponent(currentUser)}&start_date=${format(weekStartDate, 'yyyy-MM-dd')}&end_date=${format(weekEndDate, 'yyyy-MM-dd')}`)
      .then(response => {
        console.log('Direct fetch response status:', response.status);
        console.log('Direct fetch response headers:', {
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length')
        });
        return response.text();
      })
      .then(text => {
        console.log('Direct fetch response text:', text);
        try {
          const testData = JSON.parse(text);
          console.log('Direct fetch parsed data:', testData);
        } catch (e) {
          console.error('Direct fetch parse error:', e);
        }
      })
      .catch(err => console.error('Direct fetch error:', err));
    
    // Fetch the allocations using the service
    ProjectDataService.getAllocations(
      currentUser, 
      format(weekStartDate, 'yyyy-MM-dd'),
      format(weekEndDate, 'yyyy-MM-dd')
    )
    .then(allocationsData => {
      // Skip if component unmounted
      if (!isMounted) return;
      
      // Ensure allocationsData is always an array
      const dataArray = Array.isArray(allocationsData) ? allocationsData : [];
      console.log("Received allocations data:", dataArray);
      
      // Process the data
      if (dataArray.length > 0) {
        console.log("Processing non-empty allocations");
        const newRows = dataArray.map(allocation => ({
          id: allocation.ra_id,
          resource: currentUser,
          projectNumber: allocation.proj_id || allocation.project_number, // Handle different field names
          projectName: allocation.project_name || '',
          milestone: allocation.milestone_name || '',
          pm: allocation.project_manager || '',
          labor: allocation.contract_labor || 0,
          pctLaborUsed: (allocation.forecast_pm_labor || 0) * 100, // Convert to percentage
          hours: allocation.ra_hours || allocation.hours || 0,
          remarks: allocation.ra_remarks || allocation.remarks || ""
        }));
        setRows(newRows);
      } else {
        console.log("No allocations found, initializing with empty row");
        // Initialize with an empty row if no allocations
        setRows([{
          resource: currentUser,
          projectNumber: '',
          projectName: '',
          milestone: '',
          pm: '',
          labor: '',
          pctLaborUsed: '',
          hours: '',
          remarks: ''
        }]);
      }
      
      setHasLoadedInitialData(true);
      setIsLoading(false);  // Ensure we exit loading state
    })
    .catch(err => {
      // Skip if component unmounted
      if (!isMounted) return;
      
      console.error('Error loading allocations:', err);
      setLoadError('Failed to load data: ' + err.message);
      
      // Initialize with an empty row even if loading fails
      setRows([{
        resource: currentUser,
        projectNumber: '',
        projectName: '',
        milestone: '',
        pm: '',
        labor: '',
        pctLaborUsed: '',
        hours: '',
        remarks: ''
      }]);
      
      setIsLoading(false);  // Ensure we exit loading state
    });
    
    // Return cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
    };
  }, [currentUser, weekStartDate, weekEndDate, hasLoadedInitialData]);

  // Rest of the component remains the same
  const addRow = useCallback(() => {
    setRows(prevRows => [...prevRows, {
      resource: currentUser, 
      projectNumber: '',
      projectName: '',
      milestone: '',
      pm: '',
      labor: '',
      pctLaborUsed: '',
      hours: '',
      remarks: ''
    }]);
  }, [currentUser]);

  const updateRow = useCallback((index, field, value) => {
    setRows(prevRows => {
      const newRows = [...prevRows];
      newRows[index][field] = value;
      return newRows;
    });
  }, []);

  const deleteRow = useCallback(async (index) => {
    const rowToDelete = rows[index];
    
    // If the row has an ID, it exists in the database
    if (rowToDelete.id) {
      try {
        setIsSaving(true);
        setSaveError(null);
        
        await ProjectDataService.deleteAllocation(rowToDelete.id);
        
        setRows(prevRows => prevRows.filter((_, i) => i !== index));
        console.log(`Deleted allocation with ID: ${rowToDelete.id}`);
      } catch (error) {
        console.error('Failed to delete allocation:', error);
        setSaveError('Failed to delete: ' + error.message);
      } finally {
        setIsSaving(false);
      }
    } else {
      // If no ID, it's a new row that hasn't been saved yet
      setRows(prevRows => prevRows.filter((_, i) => i !== index));
    }
  }, [rows]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      
      const savePromises = [];
      const updatedRows = [];
      const newRows = [];
      
      // Debug log all rows before saving
      console.log("All rows before saving:", JSON.stringify(rows));
      
      // Organize rows for saving
      for (let row of rows) {
        // Skip rows with no project number or hours
        if (!row.projectNumber || !row.hours) {
          console.log("Skipping row - missing project number or hours:", row);
          continue;
        }
        
        // Explicitly check and log row ID to debug
        if (row.id) {
          console.log(`Found existing row with ID: ${row.id}, Type: ${typeof row.id}`);
          updatedRows.push(row);
        } else {
          console.log("New row without ID:", row);
          newRows.push(row);
        }
      }
      
      // First, handle updates to prevent duplications
      console.log(`Processing ${updatedRows.length} updates and ${newRows.length} new rows`);
      
      // Process updates
      for (let row of updatedRows) {
        console.log(`Updating allocation with ID: ${row.id}`);
        savePromises.push(
          ProjectDataService.updateAllocation(row.id, row.hours, row.remarks)
            .then(result => {
              console.log(`Update result for ID ${row.id}:`, result);
              return { ...result, action: 'update', id: row.id };
            })
            .catch(err => {
              console.error(`Error updating allocation ${row.id}:`, err);
              throw err;
            })
        );
      }
      
      // Process new rows
      for (let row of newRows) {
        console.log(`Creating new allocation for project: ${row.projectNumber}`);
        savePromises.push(
          ProjectDataService.saveResourceAllocation({
            email: currentUser,
            project_number: row.projectNumber,
            hours: parseFloat(row.hours) || 0,
            remarks: row.remarks || ""
          })
            .then(result => {
              console.log(`Create result:`, result);
              return { ...result, action: 'create' };
            })
            .catch(err => {
              console.error(`Error creating allocation:`, err);
              throw err;
            })
        );
      }
      
      // Wait for all save operations to complete
      if (savePromises.length > 0) {
        const results = await Promise.all(savePromises);
        console.log("Save operation results:", results);
        
        // Clear any cached allocations to ensure fresh data
        ProjectDataService.clearCacheWithPattern('allocations_');
        
        // Reload data with slight delay to ensure backend processing is complete
        if (weekStartDate && weekEndDate) {
          console.log("Reloading allocations after save");
          setTimeout(async () => {
            try {
              const allocationsData = await ProjectDataService.getAllocations(
                currentUser, 
                format(weekStartDate, 'yyyy-MM-dd'),
                format(weekEndDate, 'yyyy-MM-dd')
              );
              
              console.log("Refreshed allocation data:", allocationsData);
              
              // Ensure allocationsData is an array
              const dataArray = Array.isArray(allocationsData) ? allocationsData : [];
              
              if (dataArray.length > 0) {
                const newRows = dataArray.map(allocation => ({
                  id: allocation.ra_id,
                  resource: currentUser,
                  projectNumber: allocation.proj_id || allocation.project_number,
                  projectName: allocation.project_name || '',
                  milestone: allocation.milestone_name || '',
                  pm: allocation.project_manager || '',
                  labor: allocation.contract_labor || 0,
                  pctLaborUsed: (allocation.forecast_pm_labor || 0) * 100,
                  hours: allocation.ra_hours || allocation.hours || 0,
                  remarks: allocation.ra_remarks || allocation.remarks || ""
                }));
                setRows(newRows);
              }
            } catch (err) {
              console.error("Error reloading data after save:", err);
            }
          }, 500); // 500ms delay to ensure backend processing is complete
        }
        
        console.log("Save process completed successfully!");
      } else {
        console.log("No changes to save");
      }
    } catch (error) {
      console.error('Save failed:', error);
      setSaveError('Failed to save data: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate total hours
  const totalHours = rows.reduce((sum, row) => {
    const hours = parseFloat(row.hours) || 0;
    return sum + hours;
  }, 0);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const totalHoursFormatted = formatter.format(totalHours);

  // Group rows by type
  const getGroupedRows = useCallback(() => {
    const ptoRows = rows.filter(row => 
      row.projectNumber?.startsWith('0000-0000-0PTO') || 
      row.projectNumber?.startsWith('0000-0000-0HOL')
    );
    const lwopRows = rows.filter(row =>
      row.projectNumber?.startsWith('0000-0000-LWOP')
    );
    const adminRows = rows.filter(row => 
      row.projectNumber?.startsWith('0000-0000') && 
      !row.projectNumber?.startsWith('0000-0000-0PTO') && 
      !row.projectNumber?.startsWith('0000-0000-0HOL') &&
      !row.projectNumber?.startsWith('0000-0000-LWOP')
    );
    const normalRows = rows.filter(row => 
      !row.projectNumber?.startsWith('0000-0000')
    );
    return { normalRows, adminRows, ptoRows, lwopRows };
  }, [rows]);

  // Calculate overhead hours
  const calculateOverheadHours = useCallback(() => {
    return getGroupedRows().adminRows.reduce((sum, row) => {
      return sum + (parseFloat(row.hours) || 0);
    }, 0);
  }, [getGroupedRows]);

  // Calculate direct project hours
  const calculateDirectHours = useCallback(() => {
    return getGroupedRows().normalRows.reduce((sum, row) => {
      return sum + (parseFloat(row.hours) || 0);
    }, 0);
  }, [getGroupedRows]);

  // Calculate PTO/Holiday hours
  const calculatePTOHours = useCallback(() => {
    return getGroupedRows().ptoRows.reduce((sum, row) => {
      return sum + (parseFloat(row.hours) || 0);
    }, 0);
  }, [getGroupedRows]);

  // Calculate LWOP hours
  const calculateLWOPHours = useCallback(() => {
    return getGroupedRows().lwopRows.reduce((sum, row) => {
      return sum + (parseFloat(row.hours) || 0);
    }, 0);
  }, [getGroupedRows]);

  // Calculate Ratio B
  const calculateRatioB = useCallback(() => {
    const directHours = calculateDirectHours();
    const denominator = scheduledHours - ptoHolHours - calculateLWOPHours();
    
    if (denominator <= 0) return 0;
    return directHours / denominator;
  }, [calculateDirectHours, calculateLWOPHours, scheduledHours, ptoHolHours]);

  // Formatter for percentage
  const percentFormatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  // Get grouped rows once instead of calling multiple times
  const groupedRows = getGroupedRows();

  return (
    <main className="main-content">
      <div className="content-wrapper">
        <div className="table-container">
          {loadError && <div className="error-banner">{loadError}</div>}
          {saveError && <div className="error-banner">{saveError}</div>}
          <WeekPicker className="week-picker" onWeekChange={handleWeekChange} />

          {/* Add user info display here */}
        <div className="user-info-container">
          <span className="user-label">Current User:</span>
          <span className="user-name">{userDetails?.name || currentUser}</span>
        </div>
        {/* Add team member selector for group leaders */}
        {isGroupLeader && (
    <div className="team-controls">
      {!selectedTeamMember ? (
        <div className="team-dropdown">
          <button 
            className="team-dropdown-btn"
            onClick={() => setShowTeamDropdown(!showTeamDropdown)}
          >
            Select Team Member
          </button>
          
          {showTeamDropdown && (
            <div className="team-dropdown-list">
              {teamMembers.length > 0 ? (
                teamMembers.map(member => (
                  <div 
                    key={member.id}
                    className="team-member-option"
                    onClick={() => handleTeamMemberSelect(member)}
                  >
                    <div className="member-name">{member.name}</div>
                    <div className="member-details">{member.email}</div>
                  </div>
                ))
              ) : (
                <div className="no-team-members">No team members found</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="managing-indicator">
          <span>Managing team member:</span>
          <strong>{selectedTeamMember.name}</strong>
          <button 
            className="reset-view-btn"
            onClick={resetToGroupLeader}
          >
            Return to My View
          </button>
        </div>
      )}
    </div>
  )}
  

          
          <div className="scheduled-hours-container">
            <label htmlFor="scheduledHours">Scheduled Hours:</label>
            <input
              id="scheduledHours"
              type="number"
              value={scheduledHours}
              readOnly
              disabled
              onChange={(e) => setScheduledHours(Number(e.target.value))}
              min="0"
              max="168"
            />
          </div>
          
          {isLoading ? (
            <div className="loading-indicator">Loading data...</div>
          ) : (
            <table className="resource-table">
              <thead>
                <tr>
                  <th>Project No.</th>
                  <th>Name</th>
                  <th>Milestone</th>
                  <th>MS PM</th>
                  <th>Contract Total Labor</th>
                  <th>% EAC Labor Used</th>
                  <th style={{ width: '80px' }}>Planned Hours</th>
                  <th style={{ width: '250px' }}>Remarks</th>
                  <th> </th>
                </tr>
              </thead>
              <tbody>
                {/* Project Rows */}
                {groupedRows.normalRows.map((row, index) => (
                  <TableRow
                    key={`normal-${index}-${row.id || 'new'}`}
                    row={row}
                    index={rows.indexOf(row)}
                    updateRow={updateRow}
                    deleteRow={deleteRow}
                    isLoading={isLoading}
                    currentUser={currentUser}
                  />
                ))}
                {/* Add Direct Hours Subtotal only if there are normal rows */}
                {groupedRows.normalRows.length > 0 && (
                  <tr className="direct-total">
                    <td colSpan="6" style={{ textAlign: 'right' }} className="direct-total-label">Total:</td>
                    <td style={{ textAlign: 'center' }} className="direct-total-hours">{formatter.format(calculateDirectHours())}</td>
                    <td colSpan="2"></td>
                  </tr>
                )}

                {/* PTO/Holiday Rows */}
                {groupedRows.ptoRows.length > 0 && (
                  <>
                    <tr className="group-separator pto-section">
                      <td colSpan="9">PTO/Holiday Time</td>
                    </tr>
                    {groupedRows.ptoRows.map((row, index) => (
                      <TableRow
                        key={`pto-${index}-${row.id || 'new'}`}
                        row={row}
                        index={rows.indexOf(row)}
                        updateRow={updateRow}
                        deleteRow={deleteRow}
                        isLoading={isLoading}
                        currentUser={currentUser}
                      />
                    ))}
                    <tr className="pto-total">
                      <td colSpan="6" className="pto-total-label">Total:</td>
                      <td className="pto-total-hours">{formatter.format(calculatePTOHours())}</td>
                      <td colSpan="2"></td>
                    </tr>
                  </>
                )}
                
                {/* Leave Without Pay Rows */}
                {groupedRows.lwopRows.length > 0 && (
                  <>
                    <tr className="group-separator lwop-section">
                      <td colSpan="9">Leave Without Pay</td>
                    </tr>
                    {groupedRows.lwopRows.map((row, index) => (
                      <TableRow
                        key={`lwop-${index}-${row.id || 'new'}`}
                        row={row}
                        index={rows.indexOf(row)}
                        updateRow={updateRow}
                        deleteRow={deleteRow}
                        isLoading={isLoading}
                        currentUser={currentUser}
                      />
                    ))}
                    <tr className="lwop-total">
                      <td colSpan="6" className="lwop-total-label">Total:</td>
                      <td className="lwop-total-hours">{formatter.format(calculateLWOPHours())}</td>
                      <td colSpan="2"></td>
                    </tr>
                  </>
                )}

                {/* Administrative Rows (0000-0000) */}
                {groupedRows.adminRows.length > 0 && (
                  <>
                    <tr className="group-separator">
                      <td colSpan="9">Indirect Time</td>
                    </tr>
                    {groupedRows.adminRows.map((row, index) => (
                      <TableRow
                        key={`admin-${index}-${row.id || 'new'}`}
                        row={row}
                        index={rows.indexOf(row)}
                        updateRow={updateRow}
                        deleteRow={deleteRow}
                        isLoading={isLoading}
                        currentUser={currentUser}
                      />
                    ))}
                    <tr className="overhead-total">
                      <td colSpan="6" className="overhead-total-label">Total:</td>
                      <td className="overhead-total-hours">{formatter.format(calculateOverheadHours())}</td>
                      <td colSpan="2"></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          )}
          
          <div className="hours-summary">
            <span className="total-label">Total Hours:</span>
            <span className="total-hours">{totalHoursFormatted}</span>
            <div className="ratio-separator"></div>
            <span className="ratio-label">Ratio B:</span>
            <span className="ratio-value">{percentFormatter.format(calculateRatioB())}</span>
          </div>
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
      </div>
    </main>
  );
};

// Footer Component
const Footer = () => {
  const [showAboutTooltip, setShowAboutTooltip] = useState(false);

  return (
    <footer className="footer">
      <div className="footer-left">
        <div
          className="tooltip-container"
          onMouseEnter={() => setShowAboutTooltip(true)}
          onMouseLeave={() => setShowAboutTooltip(false)}
        >
          <span className="footer-text">About</span>
          {showAboutTooltip && (
            <div className="tooltip">
              Our P2S AI Assistant was developed by Nilay Nagar, Chad Peterson, and Jonathan Herrera.
            </div>
          )}
        </div>
      </div>

      <div className="footer-right">
        <a href="https://www.p2sinc.com" target="_blank" rel="noopener noreferrer">
          www.p2sinc.com
        </a>
        <span> | © {new Date().getFullYear()} P2S All rights reserved.</span>
      </div>
    </footer>
  );
};

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState('resource');
  const [userDetails, setUserDetails] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkLoginStatus = () => {
      const email = UserService.getCurrentUser();
      if (email) {
        setIsLoggedIn(true);
        setUserDetails(UserService.getCurrentUserDetails());
      } else {
        setIsLoggedIn(false);
        setUserDetails(null);
      }
    };
    
    checkLoginStatus();
  }, []);

  const handleNavigate = (view) => {
    console.log(`Navigating to ${view} view`);
    setCurrentView(view);
  };

  const handleLogin = (name, email, scheduledHours) => {
    setUserDetails({
      name,
      email,
      scheduledHours
    });
    setIsLoggedIn(true);
    setCurrentView('resource');
  };

  const handleLogout = () => {
    UserService.logout();
    setIsLoggedIn(false);
    setUserDetails(null);
  };

  // If not logged in, show login screen
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

return (
  <div className="page-layout">
    {/* Shared Header - always present */}
    <Header 
      currentView={currentView}
      onNavigate={handleNavigate} 
      onLogout={handleLogout}
      userDetails={userDetails}
    />
    
    {/* Main Content - changes based on current view */}
    <main className="main-content">
      {currentView === 'resource' && <MainContent userDetails={userDetails} />}
      {currentView === 'pm' && <PMPage navigate={handleNavigate} />}
      {currentView === 'leadership' && <LeadershipPage navigate={handleNavigate} />}
    </main>
    
    {/* Shared Footer - always present */}
    <Footer />
  </div>
);
}

export default App;