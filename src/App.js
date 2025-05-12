import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import headerLogo from './P2S_Legence_Logo_White.png';
import TableRow from './components/TableRow';
import { ProjectDataService } from './services/ProjectDataService';
import { UserService } from './services/UserService';
import WeekPicker from './components/WeekPicker';
import Login from './components/Login';
import PMPage from './components/PMPage';
import LeadershipPage from './components/LeadershipPage';
import format from 'date-fns/format';
import { startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import TeamMemberSelector from './components/TeamMemberSelector';
import API_CONFIG from './services/apiConfig';
import TeamEdit from './components/teamedit';

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
        <button 
          className={`nav-button ${currentView === 'resource' ? 'disabled' : ''}`}
          onClick={() => currentView !== 'resource' && onNavigate('resource')}
          disabled={currentView === 'resource'}
        >
          Main View
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

        {/* <button 
        className={`nav-button ${currentView === 'teamedit' ? 'disabled' : ''}`}
        onClick={() => currentView !== 'teamedit' && onNavigate('teamedit')}
        disabled={currentView === 'teamedit'}
        >
          Team Edit
        </button> */}

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
const MainContent = React.forwardRef((props, ref) => {
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
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);
  const [teamMembersError, setTeamMembersError] = useState(null);


  useEffect(() => {
    if (currentUser) {
      fetchSameGroupMembers();
    }
  }, [currentUser]);

  useEffect(() => {
    // Initialize allocatingForUser with the current user's email
    if (currentUser) {
      localStorage.setItem('allocatingForUser', currentUser);
    }
    
    // Clean up when component unmounts
    return () => {
      localStorage.removeItem('allocatingForUser');
    };
  }, [currentUser]);

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
      
      // Use the actual scheduled hours from user details without defaulting
      if (details.scheduledHours !== null && details.scheduledHours !== undefined) {
        console.log(`Setting scheduled hours to: ${details.scheduledHours}`);
        setScheduledHours(details.scheduledHours);
      } else {
        console.log("No scheduled hours found, defaulting to 40");
        setScheduledHours(40);
      }
      
      // Check if user is a group leader
      setIsGroupLeader(details.isGroupManager || false);
      
      
    } else {
      console.warn("No valid user details found");
    }
  }, []);

  const fetchSameGroupMembers = async () => {
    try {
      setIsLoadingTeamMembers(true);
      setTeamMembersError(null);
      
      const result = await ProjectDataService.getUsersInSameGroup(currentUser);
      setTeamMembers(result.members || []);
      
      setIsLoadingTeamMembers(false);
    } catch (error) {
      console.error('Error fetching same group members:', error);
      setTeamMembersError('Failed to load team members');
      setIsLoadingTeamMembers(false);
    }
  };

  
  // Add this handler for team member selection
const handleTeamMemberSelect = (member) => {
  console.log(`Selected team member: ${member.name}, ${member.email}, Hours: ${member.hrs_worked_per_week}`);
  setSelectedTeamMember(member);

  localStorage.setItem('allocatingForUser', member.email);
  console.log(`Set allocatingForUser in localStorage to: ${member.email}`);
  // Reset states for the new team member
  setRows([]);
  setLoadError(null);
  setHasLoadedInitialData(false);
  
  if (member.hrs_worked_per_week !== null && member.hrs_worked_per_week !== undefined) {
    const hours = Number(member.hrs_worked_per_week);
    console.log(`Setting scheduled hours to: ${hours} (type: ${typeof hours})`);
    setScheduledHours(hours);
  } else {
    setScheduledHours(40); // Default if not available
  }
  // This will trigger the useEffect that loads allocations
  setCurrentUser(member.email);
};

// Add this handler for resetting to the original user
const resetToCurrentUser = () => {
  console.log("Resetting to current user view");
  setSelectedTeamMember(null);
  console.log("Resetting to current user view");
  // Reset states
  setRows([]);
  setLoadError(null);
  setHasLoadedInitialData(false);
  
  // Reset scheduled hours to the original user's hours
  if (userDetails && userDetails.scheduledHours !== null && userDetails.scheduledHours !== undefined) {
    setScheduledHours(userDetails.scheduledHours);
  } else {
    setScheduledHours(40);
  }
  
  // Set current user back to the original user
  setCurrentUser(userDetails.email);
  localStorage.setItem('allocatingForUser', userDetails.email);
};
  
  // Handle week change
  const handleWeekChange = useCallback((startDate, endDate) => {
    console.log("Week changed in MainContent:", {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });
    
    // Clear cached allocations to ensure fresh data when switching weeks
    try {
      ProjectDataService.clearCacheWithPattern('allocations_');
    } catch (e) {
      console.warn("Failed to clear allocations cache:", e);
    }
    
    setWeekStartDate(startDate);
    setWeekEndDate(endDate);
  }, []);

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update hasUnsavedChanges whenever rows are modified
  useEffect(() => {
    if (hasLoadedInitialData && rows.length > 0) {
      // Only set unsaved changes when rows are actually modified after initial load
      if (!isLoading) {
        setHasUnsavedChanges(true);
      }
    }
  }, [rows]);

  // Reset hasUnsavedChanges when data is loaded
  useEffect(() => {
    if (!isLoading && hasLoadedInitialData) {
      setHasUnsavedChanges(false);
    }
  }, [isLoading, hasLoadedInitialData]);

  // Reset unsaved changes flag after successful save
  const handleSuccessfulSave = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  // Wrap the save function to accept a callback
  const saveWithCallback = useCallback((callback) => {
    const originalSave = async () => {
      try {
        setIsSaving(true);
        setSaveError(null);
        
        const savePromises = [];
        const updatedRows = [];
        const newRows = [];
        
        // Format week dates once for all operations
        const formattedWeekStart = weekStartDate ? format(weekStartDate, 'yyyy-MM-dd') : null;
        const formattedWeekEnd = weekEndDate ? format(weekEndDate, 'yyyy-MM-dd') : null;
        
        console.log("Saving with week dates:", {
          start: formattedWeekStart,
          end: formattedWeekEnd
        });
        
        // Debug log all rows before saving
        console.log("All rows before saving:", JSON.stringify(rows, null, 2));
        
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
              remarks: row.remarks || "",
              week_start: formattedWeekStart,
              week_end: formattedWeekEnd,
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
          setHasUnsavedChanges(false);
        } else {
          console.log("No changes to save");
        }
        
        if (callback && typeof callback === 'function') {
          callback();
        }
      } catch (error) {
        console.error('Save failed:', error);
        setSaveError('Failed to save data: ' + error.message);
      } finally {
        setIsSaving(false);
      }
    };

    originalSave();
  }, [rows, weekStartDate, weekEndDate, currentUser]);

  // IMPORTANT: Initialize week dates if not set by WeekPicker
  useEffect(() => {
    if (!weekStartDate || !weekEndDate) {
      try {
        // Try to get the date from localStorage
        const storedDate = localStorage.getItem('selectedWeekDate');
        let initialDate;
        
        if (storedDate) {
          initialDate = new Date(storedDate);
          if (!(initialDate instanceof Date) || isNaN(initialDate)) {
            // Invalid date from storage, use default
            initialDate = addWeeks(new Date(), 1);
          }
        } else {
          // No stored date, use default
          initialDate = addWeeks(new Date(), 1);
        }
        
        const startDate = startOfWeek(initialDate, { weekStartsOn: 1 });
        const endDate = endOfWeek(initialDate, { weekStartsOn: 1 });
        
        console.log("MainContent - Initializing with dates:", {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd')
        });
        
        setWeekStartDate(startDate);
        setWeekEndDate(endDate);
      } catch (e) {
        console.warn("Error getting dates from localStorage:", e);
        // Fall back to next week
        const today = addWeeks(new Date(), 1);
        const startDate = startOfWeek(today, { weekStartsOn: 1 });
        const endDate = endOfWeek(today, { weekStartsOn: 1 });
        
        console.log("Initializing with next week (after error):", {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd')
        });
        
        setWeekStartDate(startDate);
        setWeekEndDate(endDate);
      }
    }
  }, [weekStartDate, weekEndDate]);

  // Calculate PTO hours based on rows
  useEffect(() => {
    const ptoHours = rows.reduce((sum, row) => {
      if (row.projectNumber.startsWith('0000-0000-0PTO') || 
        row.projectNumber.startsWith('0000-0000-0HOL') ||
        row.projectNumber.startsWith('0000-0000-0SIC') ||
        row.projectNumber.startsWith('0000-0000-LWOP') ||
        row.projectNumber.startsWith('0000-0000-JURY')) {
        return sum + (parseFloat(row.hours) || 0);
      }
      return sum;
    }, 0);
    
    setPTOHolHours(ptoHours);
  }, [rows]);

  // Debug the dependencies in the allocation loading effect
  useEffect(() => {
    // Log the state of dependencies whenever they change
    console.log("Loading allocations with scheduledHours:", scheduledHours);
    console.log("Allocation effect dependencies changed:", {
      currentUser,
      weekStartDate: weekStartDate ? format(weekStartDate, 'yyyy-MM-dd') : null,
      weekEndDate: weekEndDate ? format(weekEndDate, 'yyyy-MM-dd') : null,
      isLoading,
      scheduledHours
    });
  }, [currentUser, weekStartDate, weekEndDate, isLoading,hasLoadedInitialData, scheduledHours]);
  
    useEffect(() => {
    // Only proceed if we have both a user and date range
    if (!currentUser || !weekStartDate || !weekEndDate) {
      console.log("Skipping allocation load - missing required data");
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    setRows([]); // Clear rows when loading new data

    const formattedStartDate = format(weekStartDate, 'yyyy-MM-dd');
    const formattedEndDate = format(weekEndDate, 'yyyy-MM-dd');

    let isMounted = true;
    
    console.log("Loading allocations for:", {
      email: currentUser,
      startDate: format(weekStartDate, 'yyyy-MM-dd'),
      endDate: format(weekEndDate, 'yyyy-MM-dd')
    });
    
    // Fetch the allocations using the service
    ProjectDataService.getAllocations(
      currentUser, 
      formattedStartDate,
      formattedEndDate
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
        // Initialize with 5 blank rows
        setRows([...Array(5)].map(() => ({
          resource: currentUser,
          projectNumber: '',
          projectName: '',
          milestone: '',
          pm: '',
          labor: '',
          pctLaborUsed: '',
          hours: '',
          remarks: ''
        })));
      }
      
      setHasLoadedInitialData(true);
      setIsLoading(false);  // Ensure we exit loading state
    })
    .catch(err => {
      // Skip if component unmounted
      if (!isMounted) return;
      
      console.error('Error loading allocations:', err);
      setLoadError('Failed to load data: ' + err.message);
      
      // Initialize with 5 blank rows even if loading fails
      setRows([...Array(5)].map(() => ({
        resource: currentUser,
        projectNumber: '',
        projectName: '',
        milestone: '',
        pm: '',
        labor: '',
        pctLaborUsed: '',
        hours: '',
        remarks: ''
      })));
      
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
      
      // Format week dates once for all operations
      const formattedWeekStart = weekStartDate ? format(weekStartDate, 'yyyy-MM-dd') : null;
      const formattedWeekEnd = weekEndDate ? format(weekEndDate, 'yyyy-MM-dd') : null;
      
      console.log("Saving with week dates:", {
        start: formattedWeekStart,
        end: formattedWeekEnd
      });
      
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
            remarks: row.remarks || "",
            week_start: formattedWeekStart,  // Add the week start date
            week_end: formattedWeekEnd,       // Add the week end date
            // The project details will be fetched from CSV in the saveResourceAllocation method
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
        
        // Rest of your existing code...
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
      row.projectNumber.startsWith('0000-0000-0SIC') ||
      row.projectNumber.startsWith('0000-0000-JURY') ||
      row.projectNumber?.startsWith('0000-0000-0HOL')
    );
    const lwopRows = rows.filter(row =>
      row.projectNumber?.startsWith('0000-0000-LWOP')
    );
    //new
    const availableHoursRows = rows.filter(row =>
      row.availableHours || row.projectNumber?.startsWith('0000-0000-AVAIL_HOURS')
    );
    const adminRows = rows.filter(row => 
      row.projectNumber?.startsWith('0000-0000') && 
      !row.projectNumber?.startsWith('0000-0000-0PTO') && 
      !row.projectNumber?.startsWith('0000-0000-0HOL') &&
      !row.projectNumber?.startsWith('0000-0000-0SIC') &&
      !row.projectNumber?.startsWith('0000-0000-JURY') &&
      !row.projectNumber?.startsWith('0000-0000-LWOP') &&
      !row.availableHours && //new
      !row.projectNumber?.startsWith('0000-0000-AVAIL_HOURS')  //new
    );
    const normalRows = rows.filter(row => 
      !row.projectNumber?.startsWith('0000-0000')
    );
    return { normalRows, adminRows, ptoRows, lwopRows, availableHoursRows };
  }, [rows]);
  
  
  //avail hours
  const calculateAvailableHours = useCallback(() => {
    return getGroupedRows().availableHoursRows.reduce((sum, row) => {
      return sum + (parseFloat(row.hours) || 0);
    }, 0);
  }, [getGroupedRows]);
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

  const copyPreviousWeekAllocations = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const previousWeekStart = startOfWeek(subWeeks(weekStartDate, 1), { weekStartsOn: 1 });
      const previousWeekEnd = endOfWeek(subWeeks(weekEndDate, 1), { weekStartsOn: 1 });

      console.log("Copying allocations from previous week:", {
        startDate: format(previousWeekStart, 'yyyy-MM-dd'),
        endDate: format(previousWeekEnd, 'yyyy-MM-dd'),
      });

      const previousAllocations = await ProjectDataService.getAllocations(
        currentUser,
        format(previousWeekStart, 'yyyy-MM-dd'),
        format(previousWeekEnd, 'yyyy-MM-dd')
      );

      if (previousAllocations && previousAllocations.length > 0) {
        const newRows = previousAllocations.map((allocation) => ({
          resource: currentUser,
          projectNumber: allocation.proj_id || allocation.project_number,
          projectName: allocation.project_name || '',
          milestone: allocation.milestone_name || '',
          pm: allocation.project_manager || '',
          labor: allocation.contract_labor || 0,
          pctLaborUsed: (allocation.forecast_pm_labor || 0) * 100,
          hours: allocation.ra_hours || allocation.hours || 0,
          remarks: allocation.ra_remarks || allocation.remarks || '',
        }));

        // Remove the 5 empty rows before adding the new rows
        setRows((prevRows) => [
          ...prevRows.filter((row) => row.projectNumber || row.hours), 
          ...newRows
        ]);

        console.log("Copied previous week's allocations successfully.");
      } else {
        console.warn("No allocations found for the previous week.");
      }
    } catch (error) {
      console.error("Error copying previous week's allocations:", error);
      setLoadError("Failed to copy previous week's allocations.");
    } finally {
      setIsLoading(false);
    }
  };

  // Make hasUnsavedChanges and saveWithCallback accessible via ref
  React.useImperativeHandle(ref, () => ({
    hasUnsavedChanges,
    saveChanges: saveWithCallback
  }));

  return (
    <main className="main-content">
      <div className="content-wrapper">
        <div className="table-container">
          {loadError && <div className="error-banner">{loadError}</div>}
          {saveError && <div className="error-banner">{saveError}</div>}
          <WeekPicker 
            className="resource-week-picker" 
            onWeekChange={handleWeekChange} 
            hasUnsavedChanges={hasUnsavedChanges}
            onSaveChanges={saveWithCallback}
          />

          <div className="user-info-container">
            <span className="user-label">Current User:</span>
            <span className="user-name">{userDetails?.name || currentUser}</span>
            <TeamMemberSelector 
              currentUser={currentUser}
              teamMembers={teamMembers}
              isLoading={isLoadingTeamMembers}
              error={teamMembersError}
              selectedMember={selectedTeamMember}
              onSelectTeamMember={handleTeamMemberSelect}
              onReset={resetToCurrentUser}
            />
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
        </div>
                 
          {isLoading ? (
            <div className="loading-indicator">Loading data...</div>
          ) : (
            <table className="resource-table">
              <thead>
                <tr>
                  <th>Project No.</th>
                  <th>Project No. & Name</th>
                  <th>Milestone</th>
                  <th>Project Manager</th>
                  <th>Contract Total Labor</th>
                  <th>% EAC Labor Used</th>
                  <th>Planned Hours</th>
                  <th>Remarks</th>
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
                {/* Available Hours Rows */}
                {groupedRows.availableHoursRows.length > 0 && (
                    <>
                      <tr className="group-separator available-hours-section">
                        <td colSpan="9">Available Hours</td>
                      </tr>
                      {groupedRows.availableHoursRows.map((row, index) => (
                        <TableRow
                          key={`available-${index}-${row.id || 'new'}`}
                          row={row}
                          index={rows.indexOf(row)}
                          updateRow={updateRow}
                          deleteRow={deleteRow}
                          isLoading={isLoading}
                          currentUser={currentUser}
                        />
                      ))}
                      <tr className="available-hours-total">
                        <td colSpan="6" className="available-hours-total-label">Total:</td>
                        <td className="available-hours-total-hours">{formatter.format(calculateAvailableHours())}</td>
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
            {calculateAvailableHours() > 0 && (
                <>
                  <div className="ratio-separator"></div>
                  <span className="ratio-label">Available Hours:</span>
                  <span className="available-hours">{formatter.format(calculateAvailableHours())}</span>
                </>
              )}
            <div className="ratio-separator"></div>
            <span className="ratio-label">Ratio B:</span>
            <span className="ratio-value">{percentFormatter.format(calculateRatioB())}</span>
          </div>
          <div className="table-actions">
          <button 
              className="support-button"
              onClick={() => window.location.href = 'mailto:jonathan.herrera@p2sinc.com'}
            >
            Contact Support
            </button>
            <button
              onClick={copyPreviousWeekAllocations}
              className="add-btn"
              disabled={isLoading || isSaving}
            >
              Copy Previous Week
            </button>
            <button onClick={addRow} className="add-btn" disabled={isSaving || isLoading}>Add Row</button>
            <button 
              onClick={() => saveWithCallback(handleSuccessfulSave)} 
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
});

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
          {/* <span className="footer-text">Version 0.4 </span> */}
          <span className="footer-text">Version 0.5 | About</span>
          {showAboutTooltip && (
            <div className="tooltip">
              Our Resource Allocation App was developed by Nilay Nagar, Chad Peterson, and Jonathan Herrera.
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
  const [currentView, setCurrentView] = useState(() => {
    const savedView = localStorage.getItem('currentView');
    return savedView || 'resource';
  });
  const [userDetails, setUserDetails] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(''); // Define currentUser and setCurrentUser
  const [selectedUser, setSelectedUser] = useState(null); // New state for selected user
  
  // Reference to the MainContent component to check for unsaved changes
  const mainContentRef = useRef(null);
  const teamEditRef = useRef(null);

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

  // Function to check if there are unsaved changes
  const hasUnsavedChanges = () => {
    // Check current view and component
    if (currentView === 'resource' && mainContentRef.current) {
      return mainContentRef.current.hasUnsavedChanges || false;
    } else if (currentView === 'teamedit' && teamEditRef.current) {
      return teamEditRef.current.hasUnsavedChanges || false;
    }
    return false;
  };

  const handleNavigate = (view, params = {}) => {
    console.log(`Attempting to navigate to ${view} view`, params);
    
    // Skip unsaved changes check if explicitly bypassing (e.g., after save)
    if (params.bypassConfirm) {
      proceedWithNavigation(view, params);
      return;
    }
    
    // Check for unsaved changes before navigating
    if (hasUnsavedChanges()) {
      if (!window.confirm("You have unsaved changes. Press Ok to save them. Press Cancel to discard.")) {
        // User chose not to save, proceed with navigation
        proceedWithNavigation(view, params);
      } else {
        // User chose to save, call save function then navigate
        if (currentView === 'resource' && mainContentRef.current && mainContentRef.current.saveChanges) {
          mainContentRef.current.saveChanges(() => proceedWithNavigation(view, params));
        } else if (currentView === 'teamedit' && teamEditRef.current && teamEditRef.current.saveChanges) {
          teamEditRef.current.saveChanges(() => proceedWithNavigation(view, params));
        } else {
          // No save method available, proceed anyway
          proceedWithNavigation(view, params);
        }
      }
    } else {
      // No unsaved changes, proceed with navigation
      proceedWithNavigation(view, params);
    }
  };
  
  const proceedWithNavigation = (view, params = {}) => {
    // Clear any cached data that might be causing dropdowns to appear
    if (view === 'resource') {
      if (window.clearSearchSuggestions) {
        window.clearSearchSuggestions();
      }
      try {
        const inputs = document.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
          input.blur();
        });
      } catch (e) {
        console.warn('Failed to clear input focus states:', e);
      }
    }
  
    // Save the current view to localStorage
    localStorage.setItem('currentView', view);
  
    // Force refresh for LeadershipPage if navigating after TeamEdit save
    if (view === 'leadership' && params.refresh) {
      console.log("Forcing refresh for LeadershipPage...");
      // If coming from a save action, don't show the confirmation dialog again
      if (params.bypassConfirm) {
        console.log("Bypassing confirmation dialog after save");
      }
      window.location.reload();
      return;
    }
  
    setCurrentView(view);
  
    // Handle additional parameters for specific views
    if (view === 'teamedit' && params.member) {
      console.log("Setting selected user for TeamEdit:", params.member);
      setSelectedUser(params.member); // Set the selected user
    }
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

  // Update localStorage when user logs out
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      UserService.logout();
      // Clear the saved view when logging out
      localStorage.removeItem('currentView');
      setIsLoggedIn(false);
      setUserDetails(null);
    }
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
      {currentView === 'resource' && (
        <MainContent 
          ref={mainContentRef}
          userDetails={userDetails} 
          currentUser={currentUser} 
          setCurrentUser={setCurrentUser} 
        />
      )}
      {currentView === 'pm' && <PMPage navigate={handleNavigate} />}
      {currentView === 'leadership' && <LeadershipPage navigate={handleNavigate} />}
      {currentView === 'teamedit' && (
        <>
          {console.log("Rendering TeamEdit with selectedUser:", selectedUser)}
          <TeamEdit 
            ref={teamEditRef}
            selectedUser={selectedUser} 
            navigate={handleNavigate} 
          />
        </>
      )}
      
      {/* Shared Footer - always present */}
      <Footer />
      
    </div>
  );
}

export { MainContent }; 
export default App;