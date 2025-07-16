import React, { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import headerLogo from "./P2S_Legence_Logo_White.png";
import TableRow from "./components/TableRow";
import { ProjectDataService } from "./services/ProjectDataService";
import { WorkloadPreloadService } from "./services/WorkloadPreloadService";
import { UserService } from "./services/UserService";
import { GLService } from "./services/GLService";
import { StaffService } from "./services/StaffService";
import QuarterPicker from "./components/QuarterPicker";
import Login from "./components/Login";
import PMPage from "./components/PMPage";
import LeadershipPage from "./components/LeadershipPage";
import format from "date-fns/format";
import TeamMemberSelector from "./components/TeamMemberSelector";
import TeamEdit from "./components/teamedit";
import OpportunityRow from "./components/OpportunityRow";
import { getCurrentQuarterString, getCurrentYear } from "./utils/dateUtils";
import ProjectSearchService from "./services/ProjectSearchService";

// Header Component
const Header = ({ currentView, onNavigate, onLogout }) => {
  return (
    <header className="header">
      <img src={headerLogo} alt="Logo" className="header-logo" />
      {/* <h1 className="header-title">Resource Allocation</h1> */}
      <h1 className="header-title">
        {currentView === "pm"
          ? "Project Manager Dashboard"
          : currentView === "leadership"
          ? "Group Leader Dashboard"
          : "Workload Projection"}
      </h1>
      <div className="nav-buttons">
        <button
          className={`nav-button ${
            currentView === "resource" ? "disabled" : ""
          }`}
          onClick={() => currentView !== "resource" && onNavigate("resource")}
          disabled={currentView === "resource"}
        >
          Main View
        </button>

        {/* PM View Button - disabled when on pm view */}
        <button
          className={`nav-button ${currentView === "pm" ? "disabled" : ""}`}
          onClick={() => currentView !== "pm" && onNavigate("pm")}
          disabled={currentView === "pm"}
        >
          PM View
        </button>

        {/* GL View Button - disabled when on leadership view */}
        <button
          className={`nav-button ${
            currentView === "leadership" ? "disabled" : ""
          }`}
          onClick={() =>
            currentView !== "leadership" && onNavigate("leadership")
          }
          disabled={currentView === "leadership"}
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
        <button className="nav-button logout-button" onClick={onLogout}>
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
  const [currentUser, setCurrentUser] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);  const [scheduledHours, setScheduledHours] = useState(40);
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarterString());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [usePreloadService, setUsePreloadService] = useState(true); // New flag to use WorkloadPreloadService
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);
  const [teamMembersError, setTeamMembersError] = useState(null);
  const [opportunityRows, setOpportunityRows] = useState([
    // Initial 3 empty rows for demonstration
    {
      opportunityNumber: "",
      opportunityName: "",
      proposalChampion: "",
      estimatedFee: "",
      remarks: "",
      month: "",
      month1: "",
      month2: "",
    },
    {
      opportunityNumber: "",
      opportunityName: "",
      proposalChampion: "",
      estimatedFee: "",
      remarks: "",
      month: "",
      month1: "",
      month2: "",
    },
    {
      opportunityNumber: "",
      opportunityName: "",
      proposalChampion: "",
      estimatedFee: "",
      remarks: "",
      month: "",
      month1: "",
      month2: "",
    },
  ]);

  // --- QUARTER MONTHS LOGIC ---
  // Returns [month0, month1, month2] as full month names for the selected quarter/year
  function getQuarterMonthNames(quarter, year) {
    let months;
    switch (String(quarter)) {
      case '1':
      case 'Q1':
        months = [0, 1, 2]; // Jan, Feb, Mar
        break;
      case '2':
      case 'Q2':
        months = [3, 4, 5]; // Apr, May, Jun
        break;
      case '3':
      case 'Q3':
        months = [6, 7, 8]; // Jul, Aug, Sep
        break;
      case '4':
      case 'Q4':
        months = [9, 10, 11]; // Oct, Nov, Dec
        break;
      default:
        months = [0, 1, 2];
    }
    return months.map((m) => format(new Date(year, m, 1), "MMMM"));
  }

  // State for month column headers
  const [monthCol, setMonthCol] = useState("");
  const [month1Col, setMonth1Col] = useState("");
  const [month2Col, setMonth2Col] = useState("");

  // Update month column headers whenever quarter or year changes
  useEffect(() => {
    const [m0, m1, m2] = getQuarterMonthNames(selectedQuarter, selectedYear);
    setMonthCol(m0);
    setMonth1Col(m1);
    setMonth2Col(m2);  }, [selectedQuarter, selectedYear]);
  
  // Fix useEffect dependency warning by using useCallback for fetchSameGroupMembers
  const fetchSameGroupMembers = useCallback(async () => {
    try {
      setIsLoadingTeamMembers(true);
      setTeamMembersError(null);
      console.log("Fetching team members for user:", currentUser);
      
      // First try to get team members from GLService
      try {
        const glTeamMembers = await GLService.getTeamMembers(currentUser);
        console.log("GLService team members result:", glTeamMembers);
        if (glTeamMembers && glTeamMembers.length > 0) {
          setTeamMembers(glTeamMembers);
          setIsLoadingTeamMembers(false);
          return;
        }
      } catch (glError) {
        console.warn("GLService failed, trying alternative:", glError.message);
      }
      
      // Fallback to StaffService with mock data
      try {
        const staffData = await StaffService.loadStaffData();
        console.log("StaffService data loaded:", staffData);
        
        // Find current user's group manager to filter team members
        const currentUserData = staffData.find(staff => staff.email === currentUser);
        const groupManager = currentUserData?.groupManager || currentUserData?.studioLeader;
        
        if (groupManager) {
          // Get all staff members with the same group manager
          const teamMembers = staffData.filter(staff => 
            staff.groupManager === groupManager || staff.studioLeader === groupManager
          ).map(staff => ({
            id: staff.email,
            name: staff.name,
            email: staff.email,
            title: staff.laborCategory,
            hrs_worked_per_week: 40 // Default to 40 hours if not specified
          }));
          
          console.log("Team members from StaffService:", teamMembers);
          setTeamMembers(teamMembers);
        } else {
          // If no group manager found, just return all staff as potential team members
          const allTeamMembers = staffData.map(staff => ({
            id: staff.email,
            name: staff.name,
            email: staff.email,
            title: staff.laborCategory,
            hrs_worked_per_week: 40
          }));
          console.log("All staff as team members:", allTeamMembers);
          setTeamMembers(allTeamMembers);
        }
      } catch (staffError) {
        console.error("StaffService also failed:", staffError);
        // Last fallback - use empty array
        setTeamMembers([]);
        setTeamMembersError("Failed to load team members from all sources");
      }
      
      setIsLoadingTeamMembers(false);
    } catch (error) {
      console.error("Error fetching team members:", error);
      setTeamMembersError("Failed to load team members");
      setIsLoadingTeamMembers(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchSameGroupMembers();
    }
  }, [currentUser, fetchSameGroupMembers]);

  useEffect(() => {
    // Initialize allocatingForUser with the current user's email
    if (currentUser) {
      localStorage.setItem("allocatingForUser", currentUser);
    }

    // Clean up when component unmounts
    return () => {
      localStorage.removeItem("allocatingForUser");
    };
  }, [currentUser]);

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
      if (
        details.scheduledHours !== null &&
        details.scheduledHours !== undefined
      ) {
        console.log(`Setting scheduled hours to: ${details.scheduledHours}`);
        setScheduledHours(details.scheduledHours);
      } else {
        console.log("No scheduled hours found, defaulting to 40");
        setScheduledHours(40);
      }
    } else {
      console.warn("No valid user details found");
    }
  }, []);

  // Add this handler for team member selection
  const handleTeamMemberSelect = (member) => {
    console.log(
      `Selected team member: ${member.name}, ${member.email}, Hours: ${member.hrs_worked_per_week}`
    );
    setSelectedTeamMember(member);

    localStorage.setItem("allocatingForUser", member.email);
    console.log(`Set allocatingForUser in localStorage to: ${member.email}`);
    // Reset states for the new team member
    setRows([]);
    setLoadError(null);
    setHasLoadedInitialData(false);

    if (
      member.hrs_worked_per_week !== null &&
      member.hrs_worked_per_week !== undefined
    ) {
      const hours = Number(member.hrs_worked_per_week);
      console.log(
        `Setting scheduled hours to: ${hours} (type: ${typeof hours})`
      );
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
    if (
      userDetails &&
      userDetails.scheduledHours !== null &&
      userDetails.scheduledHours !== undefined
    ) {
      setScheduledHours(userDetails.scheduledHours);
    } else {
      setScheduledHours(40);
    }

    // Set current user back to the original user
    setCurrentUser(userDetails.email);
    localStorage.setItem("allocatingForUser", userDetails.email);
  };

  // Replace handleWeekChange with handleQuarterChange
  const handleQuarterChange = useCallback((quarter, year) => {
    setSelectedQuarter(quarter);
    setSelectedYear(year);
    // Optionally clear or reload data here
  }, []);

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update hasUnsavedChanges whenever rows are modified
  useEffect(() => {
    if (hasLoadedInitialData && rows.length > 0 && !isLoading) {
      setHasUnsavedChanges(true);
    }
  }, [rows, hasLoadedInitialData, isLoading]);

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
  const saveWithCallback = useCallback(
    (callback) => {
      const originalSave = async () => {
        try {
          setIsSaving(true);
          setSaveError(null);

          const savePromises = [];
          const updatedRows = [];
          const newRows = [];

          // Debug log all rows before saving
          console.log("All rows before saving:", JSON.stringify(rows, null, 2));

          // Organize rows for saving
          for (let row of rows) {
            // Skip rows with no project number or hours
            if (!row.projectNumber || (!row.month && !row.month1 && !row.month2)) {
              console.log(
                "Skipping row - missing project number or hours:",
                row
              );
              continue;
            }

            // Check if row has a valid integer ra_id (real database ID) vs composite string ID (new row)
            const hasValidRaId = row.id && 
              (typeof row.id === 'number' || 
              (typeof row.id === 'string' && /^\d+$/.test(row.id)));
            
            if (hasValidRaId) {
              console.log(
                `Found existing row with valid ra_id: ${row.id}, Type: ${typeof row.id}`
              );
              updatedRows.push(row);
            } else {
              console.log(`New row without valid ra_id (ID: ${row.id}):`, row);
              newRows.push(row);
            }
          }

          // Process updates
          for (let row of updatedRows) {
            console.log(`Updating allocation with ID: ${row.id}`);
            savePromises.push(
              ProjectDataService.updateProjectAllocationByQuarter(
                row.id,
                row.month,
                row.month1,
                row.month2,
                row.remarks
              )
                .then((result) => {
                  console.log(`Update result for ID ${row.id}:`, result);
                  return { ...result, action: "update", id: row.id };
                })
                .catch((err) => {
                  console.error(`Error updating allocation ${row.id}:`, err);
                  throw err;
                })
            );
          }

          // Process new rows
          for (let row of newRows) {
            console.log(
              `Creating new allocation for project: ${row.projectNumber}`
            );
            savePromises.push(
              ProjectDataService.saveResourceAllocationByQuarter({
                email: currentUser,
                project_number: row.projectNumber,
                year: selectedYear,
                quarter: selectedQuarter,
                month: row.month,
                month1: row.month1,
                month2: row.month2,
                remarks: row.remarks || "",
              })
                .then((result) => {
                  console.log(`Create result:`, result);
                  return { ...result, action: "create" };
                })
                .catch((err) => {
                  console.error(`Error creating allocation:`, err);
                  throw err;
                })
            );
          }
          
          // Process opportunity rows
          const updatedOpportunityRows = [];
          const newOpportunityRows = [];

          // Organize opportunity rows for saving
          for (let row of opportunityRows) {
            // Skip rows with no opportunity number or hours
            if (!row.opportunityNumber || (!row.month && !row.month1 && !row.month2)) {
              console.log("Skipping opportunity row - missing number or hours:", row);
              continue;
            }

            // Check if row has a valid integer ra_id (real database ID) vs composite string ID (new row)
            const hasValidRaId = row.id && 
              (typeof row.id === 'number' || 
              (typeof row.id === 'string' && /^\d+$/.test(row.id)));
            
            if (hasValidRaId) {
              console.log(`Found existing opportunity row with valid ra_id: ${row.id}`);
              updatedOpportunityRows.push(row);
            } else {
              console.log(`New opportunity row without valid ra_id (ID: ${row.id}):`, row);
              newOpportunityRows.push(row);
            }
          }

          // Process opportunity updates
          for (let row of updatedOpportunityRows) {
            console.log(`Updating opportunity allocation with ID: ${row.id}`);
            savePromises.push(
              ProjectDataService.updateOpportunityAllocationByQuarter(
                row.id,
                row.month,
                row.month1,
                row.month2,
                row.remarks
              )
                .then((result) => {
                  console.log(`Opportunity update result for ID ${row.id}:`, result);
                  return { ...result, action: "update", id: row.id };
                })
                .catch((err) => {
                  console.error(`Error updating opportunity allocation ${row.id}:`, err);
                  throw err;
                })
            );
          }

          // Process new opportunity rows
          for (let row of newOpportunityRows) {
            console.log(`Creating new opportunity allocation for: ${row.opportunityNumber}`);
            savePromises.push(
              ProjectDataService.saveOpportunityAllocationByQuarter({
                email: currentUser,
                opportunity_number: row.opportunityNumber,
                year: selectedYear,
                quarter: selectedQuarter,
                month: row.month,
                month1: row.month1,
                month2: row.month2,
                remarks: row.remarks || "",
              })
                .then((result) => {
                  console.log(`Opportunity create result:`, result);
                  return { ...result, action: "create" };
                })
                .catch((err) => {
                  console.error(`Error creating opportunity allocation:`, err);
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

          if (callback && typeof callback === "function") {
            callback();
          }
        } catch (error) {
          console.error("Save failed:", error);
          setSaveError("Failed to save data: " + error.message);
        } finally {
          setIsSaving(false);
        }
      };      originalSave();
    },
    [rows, opportunityRows, selectedYear, selectedQuarter, currentUser]
  );

  // Debug the dependencies in the allocation loading effect
  useEffect(() => {
    // Log the state of dependencies whenever they change
    console.log("Loading allocations with scheduledHours:", scheduledHours);
    console.log("Allocation effect dependencies changed:", {
      currentUser,
      selectedQuarter,
      selectedYear,
      isLoading,
      scheduledHours,
    });
  }, [
    currentUser,
    selectedQuarter,
    selectedYear,
    isLoading,
    hasLoadedInitialData,
    scheduledHours,
  ]);

  useEffect(() => {
    // Only proceed if we have both a user and date range
    if (!currentUser || !selectedQuarter || !selectedYear) {
      console.log("Skipping allocation load - missing required data");
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    setRows([]);
    setOpportunityRows([]);

    // Convert quarter label (e.g., 'Q2') to string number if needed
    // let apiQuarter = selectedQuarter;
    // if (typeof apiQuarter === 'string' && apiQuarter.startsWith('Q')) {
    //   apiQuarter = apiQuarter.replace('Q', '');
    // }
    // apiQuarter = String(apiQuarter); // Always send as string

    // Keep quarter in Q format since database stores 'Q1', 'Q2', etc.
    let apiQuarter = selectedQuarter;
    // Ensure it's in Q format
    if (typeof apiQuarter === 'string' && !apiQuarter.startsWith('Q')) {
      apiQuarter = 'Q' + apiQuarter;
    }
    // If it's a number, convert to Q format
    if (typeof apiQuarter === 'number') {
      apiQuarter = 'Q' + apiQuarter;
    }    // Fetch project allocations using the new preload service or fallback to original
    if (usePreloadService) {
      console.log("Using WorkloadPreloadService to fetch data");
      WorkloadPreloadService.preloadActiveProjects(currentUser, selectedYear, apiQuarter)
        .then((preloadData) => {
          console.log("=== PRELOAD SERVICE DEBUG ===");
          console.log("Preload data received:", preloadData);
          console.log("Project rows:", preloadData.projectRows);
          console.log("Stats:", preloadData.stats);
          
          // Log breakdown of allocation types
          if (preloadData.projectRows && preloadData.projectRows.length > 0) {
            const ptoRows = preloadData.projectRows.filter(row => 
              row.projectNumber?.startsWith('0000-0000-0PTO') || 
              row.projectNumber?.startsWith('0000-0000-0HOL') ||
              row.projectNumber?.startsWith('0000-0000-0SIC') ||
              row.projectNumber?.startsWith('0000-0000-JURY')
            );
            const adminRows = preloadData.projectRows.filter(row => 
              row.projectNumber?.startsWith('0000-0000') && 
              !row.projectNumber?.startsWith('0000-0000-0PTO') &&
              !row.projectNumber?.startsWith('0000-0000-0HOL') &&
              !row.projectNumber?.startsWith('0000-0000-0SIC') &&
              !row.projectNumber?.startsWith('0000-0000-JURY') &&
              !row.projectNumber?.startsWith('0000-0000-LWOP')
            );
            const lwopRows = preloadData.projectRows.filter(row => 
              row.projectNumber?.startsWith('0000-0000-LWOP')
            );
            const regularRows = preloadData.projectRows.filter(row => 
              !row.projectNumber?.startsWith('0000-0000')
            );
            
            console.log("Allocation type breakdown:");
            console.log(`- PTO/Holiday/Sick/Jury: ${ptoRows.length}`);
            console.log(`- Administrative: ${adminRows.length}`);
            console.log(`- LWOP: ${lwopRows.length}`);
            console.log(`- Regular projects: ${regularRows.length}`);
            console.log(`- Total: ${preloadData.projectRows.length}`);
          }
          
          console.log("=== END PRELOAD DEBUG ===");

          if (preloadData.projectRows && preloadData.projectRows.length > 0) {
            setRows(preloadData.projectRows);
          } else {
            // Create empty rows if no data
            setRows(
              [...Array(3)].map(() => ({
                resource: currentUser,
                projectNumber: "",
                projectName: "",
                pm: "",
                labor: 0,
                pctLaborUsed: 0,
                month: "",
                month1: "",
                month2: "",
                remarks: "",
              }))
            );
          }
          setHasLoadedInitialData(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("WorkloadPreloadService failed, falling back to original service:", err);
          // Fallback to original service
          setUsePreloadService(false);
          
          // Retry with original service immediately
          ProjectDataService.getAllocationsByQuarterWithDetails(
            currentUser,
            selectedYear,
            apiQuarter
          )
            .then((allocationsData) => {
               const dataArray = Array.isArray(allocationsData) ? allocationsData : [];
                console.log("=== FALLBACK PROJECT FETCH DEBUG ===");
                console.log("Raw allocations data:", allocationsData);
                console.log("Data array length:", dataArray.length);
                console.log("=== END FALLBACK PROJECT DEBUG ===");
              if (dataArray.length > 0) {
                const newRows = dataArray.map((allocation) => ({
                  id: allocation.ra_id,
                  resource: currentUser,
                  projectNumber: allocation.proj_id || allocation.project_number,
                  projectName: allocation.project_name || "",
                  pm: allocation.project_manager || "",
                  labor: allocation.project_contract_labor || allocation.contract_labor || 0,
                  pctLaborUsed: allocation.eac_pct || 0,
                  hours: allocation.ra_hours || allocation.hours || 0,
                  remarks: allocation.ra_remarks || allocation.remarks || "",
                  month: allocation.month_hours || 0,
                  month1: allocation.month_hours1 || 0,
                  month2: allocation.month_hours2 || 0,
                }));
                setRows(newRows);
              } else {
                setRows(
                  [...Array(3)].map(() => ({
                    resource: currentUser,
                    projectNumber: "",
                    projectName: "",
                    pm: "",
                    labor: 0,
                    pctLaborUsed: 0,
                    month: "",
                    month1: "",
                    month2: "",
                    remarks: "",
                  }))
                );
              }
              setHasLoadedInitialData(true);
              setIsLoading(false);
            })
            .catch((fallbackErr) => {
              console.error("Both services failed:", fallbackErr);
              setLoadError("Failed to load data: " + fallbackErr.message);
              setRows(
                [...Array(3)].map(() => ({
                  resource: currentUser,
                  projectNumber: "",
                  projectName: "",
                  pm: "",
                  labor: 0,
                  pctLaborUsed: 0,
                  month: "",
                  month1: "",
                  month2: "",
                  remarks: "",
                }))
              );
              setIsLoading(false);
            });
        });
    } else {
      // Original data loading logic
      ProjectDataService.getAllocationsByQuarterWithDetails(
        currentUser,
        selectedYear,
        apiQuarter
      )
        .then((allocationsData) => {
           const dataArray = Array.isArray(allocationsData) ? allocationsData : [];
            console.log("=== PROJECT FETCH DEBUG ===");
            console.log("Raw allocations data:", allocationsData);
            console.log("Data array length:", dataArray.length);
            if (dataArray.length > 0) {
              console.log("First allocation item:", JSON.stringify(dataArray[0], null, 2));
              console.log("Available fields:", Object.keys(dataArray[0]));
            }
            console.log("=== END PROJECT DEBUG ===");
          if (dataArray.length > 0) {
            const newRows = dataArray.map((allocation) => ({
              id: allocation.ra_id,
              resource: currentUser,
              projectNumber: allocation.proj_id || allocation.project_number,
              projectName: allocation.project_name || "",
              pm: allocation.project_manager || "",
              labor: allocation.project_contract_labor || allocation.contract_labor || 0,
              pctLaborUsed: allocation.eac_pct || 0,
              hours: allocation.ra_hours || allocation.hours || 0,
              remarks: allocation.ra_remarks || allocation.remarks || "",
              month: allocation.month_hours || 0,
              month1: allocation.month_hours1 || 0,
              month2: allocation.month_hours2 || 0,
            }));
            setRows(newRows);
          } else {
            setRows(
              [...Array(3)].map(() => ({
                resource: currentUser,
                projectNumber: "",
                projectName: "",
                pm: "",
                labor: 0,
                pctLaborUsed: 0,
                month: "",
                month1: "",
                month2: "",
                remarks: "",
              }))
            );
          }
          setHasLoadedInitialData(true);
          setIsLoading(false);
        })
      .catch((err) => {
        console.error("Error loading allocations:", err);
        setLoadError("Failed to load data: " + err.message);
        setRows(
          [...Array(3)].map(() => ({
            resource: currentUser,
            projectNumber: "",
            projectName: "",
            pm: "",
            labor: 0,
            pctLaborUsed: 0,
            month: "",
            month1: "",
            month2: "",
            remarks: "",
          }))
        );
        setIsLoading(false);
      });
    }

    // Fetch opportunity projections for the opportunities table
    if (usePreloadService) {
      // Use the new preload service for opportunities
      console.log("Using WorkloadPreloadService to fetch opportunities");
      WorkloadPreloadService.preloadActiveOpportunities(currentUser, selectedYear, apiQuarter)
        .then((opportunityPreloadData) => {
          console.log("=== OPPORTUNITY PRELOAD SERVICE DEBUG ===");
          console.log("Opportunity preload data received:", opportunityPreloadData);
          console.log("Opportunity rows:", opportunityPreloadData.opportunityRows);
          console.log("Opportunity stats:", opportunityPreloadData.stats);
          console.log("=== END OPPORTUNITY PRELOAD DEBUG ===");

          if (opportunityPreloadData.opportunityRows && opportunityPreloadData.opportunityRows.length > 0) {
            setOpportunityRows(opportunityPreloadData.opportunityRows);
          } else {
            // Create empty rows if no data
            setOpportunityRows([
              { opportunityNumber: "", opportunityName: "", proposalChampion: "", estimatedFee: "", remarks: "", month: "", month1: "", month2: "" },
              { opportunityNumber: "", opportunityName: "", proposalChampion: "", estimatedFee: "", remarks: "", month: "", month1: "", month2: "" },
              { opportunityNumber: "", opportunityName: "", proposalChampion: "", estimatedFee: "", remarks: "", month: "", month1: "", month2: "" },
            ]);
          }
        })
        .catch((err) => {
          console.error("WorkloadPreloadService failed for opportunities, falling back:", err);
          // Fallback to original opportunities service
          ProjectDataService.getOpportunitiesByQuarter(
            currentUser,
            selectedYear,
            apiQuarter
          )
            .then((oppsData) => {
              const dataArray = Array.isArray(oppsData) ? oppsData : [];
              console.log("=== FALLBACK OPPORTUNITY FETCH DEBUG ===");
              console.log("Raw opportunities data:", oppsData);
              console.log("Data array length:", dataArray.length);
              console.log("=== END FALLBACK OPPORTUNITY DEBUG ===");
              if (dataArray.length > 0) {
                const newOppRows = dataArray.map((opp) => ({
                  id: opp.ra_id,
                  opportunityNumber: opp.opportunity_number || "",
                  opportunityName: opp.opportunity_name || "",
                  proposalChampion: opp.proposal_champion || "",
                  estimatedFee: opp.estimated_fee || "",
                  remarks: opp.remarks || "",
                  month: opp.month_hours || 0,
                  month1: opp.month_hours1 || 0,
                  month2: opp.month_hours2 || 0,
                }));
                setOpportunityRows(newOppRows);
              } else {
                setOpportunityRows([
                  { opportunityNumber: "", opportunityName: "", proposalChampion: "", estimatedFee: "", remarks: "", month: "", month1: "", month2: "" },
                  { opportunityNumber: "", opportunityName: "", proposalChampion: "", estimatedFee: "", remarks: "", month: "", month1: "", month2: "" },
                  { opportunityNumber: "", opportunityName: "", proposalChampion: "", estimatedFee: "", remarks: "", month: "", month1: "", month2: "" },
                ]);
              }
            })
            .catch((fallbackErr) => {
              console.error("Fallback opportunity service also failed:", fallbackErr);
              setOpportunityRows([
                { opportunityNumber: "", opportunityName: "", proposalChampion: "", estimatedFee: "", remarks: "", month: "", month1: "", month2: "" },
                { opportunityNumber: "", opportunityName: "", proposalChampion: "", estimatedFee: "", remarks: "", month: "", month1: "", month2: "" },
                { opportunityNumber: "", opportunityName: "", proposalChampion: "", estimatedFee: "", remarks: "", month: "", month1: "", month2: "" },
              ]);
            });
        });
    } else {
      // Original opportunities loading logic
      ProjectDataService.getOpportunitiesByQuarter(
        currentUser,
        selectedYear,
        apiQuarter
      )
        .then((oppsData) => {
          const dataArray = Array.isArray(oppsData) ? oppsData : [];
            console.log("=== OPPORTUNITY FETCH DEBUG ===");
            console.log("Raw opportunities data:", oppsData);
            console.log("Data array length:", dataArray.length);
            if (dataArray.length > 0) {
              console.log("First opportunity item:", JSON.stringify(dataArray[0], null, 2));
              console.log("Available fields:", Object.keys(dataArray[0]));
            }
            console.log("=== END OPPORTUNITY DEBUG ===");
          if (dataArray.length > 0) {
            const newOppRows = dataArray.map((opp) => ({
              id: opp.ra_id,
              opportunityNumber: opp.opportunity_number || "",
              opportunityName: opp.opportunity_name || "",
              proposalChampion: opp.proposal_champion || "",
              estimatedFee: opp.estimated_fee || "",
              remarks: opp.remarks || "",
              month: opp.month_hours || 0,
              month1: opp.month_hours1 || 0,
              month2: opp.month_hours2 || 0,
            }));
            setOpportunityRows(newOppRows);
          } else {
            setOpportunityRows([
              { opportunityNumber: "", opportunityName: "", proposalChampion: "", estimatedFee: "", remarks: "", month: "", month1: "", month2: "" },
              { opportunityNumber: "", opportunityName: "", proposalChampion: "", estimatedFee: "", remarks: "", month: "", month1: "", month2: "" },
              { opportunityNumber: "", opportunityName: "", proposalChampion: "", estimatedFee: "", remarks: "", month: "", month1: "", month2: "" },
            ]);
          }
        })
        .catch((err) => {
          console.error("Error loading opportunities:", err);
          setOpportunityRows([
            { opportunityNumber: "", opportunityName: "", proposalChampion: "", estimatedFee: "", remarks: "", month: "", month1: "", month2: "" },
            { opportunityNumber: "", opportunityName: "", proposalChampion: "", estimatedFee: "", remarks: "", month: "", month1: "", month2: "" },
            { opportunityNumber: "", opportunityName: "", proposalChampion: "", estimatedFee: "", remarks: "", month: "", month1: "", month2: "" },
          ]);
        });
    }

    // Return cleanup function to prevent state updates after unmounting
    return () => {
      // isMounted = false;
    };
  }, [currentUser, selectedQuarter, selectedYear, hasLoadedInitialData, usePreloadService]);
  // Rest of the component remains the same
  const addRow = useCallback(() => {
    setRows((prevRows) => [
      ...prevRows,
      {
        resource: currentUser,
        projectNumber: "",
        projectName: "",
        pm: "",
        labor: 0,
        pctLaborUsed: 0,
        month: "",
        month1: "",
        month2: "",
        remarks: "",
      },
    ]);
  }, [currentUser]);

  const updateRow = useCallback((index, field, value) => {
    setRows((prevRows) => {
      const newRows = [...prevRows];
      newRows[index][field] = value;
      return newRows;
    });
  }, []);

  // const deleteRow = useCallback(
  //   async (index) => {
  //     const rowToDelete = rows[index];

  //     // If the row has an ID, it exists in the database
  //     if (rowToDelete.id) {
  //       try {
  //         setIsSaving(true);
  //         setSaveError(null);

  //         await ProjectDataService.deleteAllocation(rowToDelete.id);

  //         setRows((prevRows) => prevRows.filter((_, i) => i !== index));
  //         console.log(`Deleted allocation with ID: ${rowToDelete.id}`);
  //       } catch (error) {
  //         console.error("Failed to delete allocation:", error);
  //         setSaveError("Failed to delete: " + error.message);
  //       } finally {
  //         setIsSaving(false);
  //       }
  //     } else {
  //       // If no ID, it's a new row that hasn't been saved yet
  //       setRows((prevRows) => prevRows.filter((_, i) => i !== index));
  //     }
  //   },
  //   [rows]
  // );
  const deleteRow = useCallback(
  async (index) => {
    const rowToDelete = rows[index];

    // If the row has an ID, it exists in the database
    if (rowToDelete.id) {
      try {
        setIsSaving(true);
        setSaveError(null);

        // Use the project-specific delete method
        await ProjectDataService.deleteProjectAllocation(rowToDelete.id);

        setRows((prevRows) => prevRows.filter((_, i) => i !== index));
        console.log(`Deleted project allocation with ID: ${rowToDelete.id}`);
      } catch (error) {
        console.error("Failed to delete project allocation:", error);
        setSaveError("Failed to delete: " + error.message);
      } finally {
        setIsSaving(false);
      }
    } else {
      // If no ID, it's a new row that hasn't been saved yet
      setRows((prevRows) => prevRows.filter((_, i) => i !== index));
    }
  },
  [rows]
);
  // Calculate total hours  // Calculate total hours for all resource and opportunity rows (all months)
  const totalResourceHours = rows.reduce((sum, row) => {
    return (
      sum + (parseFloat(row.month) || 0) + (parseFloat(row.month1) || 0) + (parseFloat(row.month2) || 0)
    );
  }, 0);
  const totalOpportunityHours = opportunityRows.reduce((sum, row) => {
    return (
      sum + (parseFloat(row.month) || 0) + (parseFloat(row.month1) || 0) + (parseFloat(row.month2) || 0)
    );
  }, 0);
  const totalHoursAllTables = totalResourceHours + totalOpportunityHours;

  const formatter = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const totalHoursFormatted = formatter.format(totalHoursAllTables);

  // Group rows by type
  const getGroupedRows = useCallback(() => {
    const ptoRows = rows.filter(
      (row) =>
        row.projectNumber?.startsWith("0000-0000-0PTO") ||
        row.projectNumber.startsWith("0000-0000-0SIC") ||
        row.projectNumber.startsWith("0000-0000-JURY") ||
        row.projectNumber?.startsWith("0000-0000-0HOL")
    );
    const lwopRows = rows.filter((row) =>
      row.projectNumber?.startsWith("0000-0000-LWOP")
    );
    //new
    const availableHoursRows = rows.filter(
      (row) =>
        row.availableHours ||
        row.projectNumber?.startsWith("0000-0000-AVAIL_HOURS")
    );
    const adminRows = rows.filter(
      (row) =>
        row.projectNumber?.startsWith("0000-0000") &&
        !row.projectNumber?.startsWith("0000-0000-0PTO") &&
        !row.projectNumber?.startsWith("0000-0000-0HOL") &&
        !row.projectNumber?.startsWith("0000-0000-0SIC") &&
        !row.projectNumber?.startsWith("0000-0000-JURY") &&
        !row.projectNumber?.startsWith("0000-0000-LWOP") &&
        !row.availableHours && //new
        !row.projectNumber?.startsWith("0000-0000-AVAIL_HOURS") //new
    );
    const normalRows = rows.filter(
      (row) => !row.projectNumber?.startsWith("0000-0000")
    );
    return { normalRows, adminRows, ptoRows, lwopRows, availableHoursRows };
  }, [rows]);
  //avail hours
  const calculateAvailableHours = useCallback(() => {
    return getGroupedRows().availableHoursRows.reduce((sum, row) => {
      return sum + (parseFloat(row.month) || 0) + (parseFloat(row.month1) || 0) + (parseFloat(row.month2) || 0);
    }, 0);
  }, [getGroupedRows]);

  // Get grouped rows once instead of calling multiple times
  const groupedRows = getGroupedRows();

  // Make hasUnsavedChanges and saveWithCallback accessible via ref
  React.useImperativeHandle(ref, () => ({
    hasUnsavedChanges,
    saveChanges: saveWithCallback,
  }));

  // Add row for opportunities
  const addOpportunityRow = useCallback(() => {
    setOpportunityRows((prev) => [
      ...prev,
      {
        opportunityNumber: "",
        opportunityName: "",
        proposalChampion: "",
        estimatedFee: "",
        remarks: "",
        month: "",
        month1: "",
        month2: "",
      },
    ]);
  }, []);

  // Update row for opportunities
  const updateOpportunityRow = useCallback((index, field, value) => {
    setOpportunityRows((prev) => {
      const newRows = [...prev];
      newRows[index][field] = value;
      return newRows;
    });
  }, []);

  // Delete row for opportunities
  // Delete row for opportunities
const deleteOpportunityRow = useCallback(async (index) => {
  const rowToDelete = opportunityRows[index];

  // If the row has an ID, it exists in the database
  if (rowToDelete.id) {
    try {
      setIsSaving(true);
      setSaveError(null);

      // Use the opportunity-specific delete method
      await ProjectDataService.deleteOpportunityAllocation(rowToDelete.id);

      setOpportunityRows((prev) => prev.filter((_, i) => i !== index));
      console.log(`Deleted opportunity allocation with ID: ${rowToDelete.id}`);
    } catch (error) {
      console.error("Failed to delete opportunity allocation:", error);
      setSaveError("Failed to delete: " + error.message);
    } finally {
      setIsSaving(false);
    }
  } else {
    // If no ID, it's a new row that hasn't been saved yet
    setOpportunityRows((prev) => prev.filter((_, i) => i !== index));
  }
}, [opportunityRows]);
  // const deleteOpportunityRow = useCallback((index) => {
  //   setOpportunityRows((prev) => prev.filter((_, i) => i !== index));
  // }, []);

  return (
    <main className="main-content">
      <div className="content-wrapper">
        <div className="table-container">
          {loadError && <div className="error-banner">{loadError}</div>}
          {saveError && <div className="error-banner">{saveError}</div>}
          <QuarterPicker
            className="resource-quarter-picker"
            onQuarterChange={handleQuarterChange}
            initialYear={selectedYear}
            initialQuarter={selectedQuarter}
          />

          <div className="user-info-container">
            <span className="user-label">Current User:</span>
            <span className="user-name">
              {userDetails?.name || currentUser}
            </span>
            <TeamMemberSelector
              currentUser={currentUser}
              teamMembers={teamMembers}
              isLoading={isLoadingTeamMembers}
              error={teamMembersError}
              selectedMember={selectedTeamMember}
              onSelectTeamMember={handleTeamMemberSelect}
              onReset={resetToCurrentUser}
              showAllContacts={true}
            />
            {/* <div className="scheduled-hours-container">
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
            </div> */}
          </div>

          {isLoading ? (
            <div className="loading-indicator">Loading data...</div>
          ) : (
            <>
              <table className="resource-table">
                <thead>
                  <tr>
                    <th>Project No.</th>
                    <th>Project Name</th>
                    <th>Project Manager</th>
                    <th>Contract Total Labor</th>
                    <th>% EAC Labor Used</th>
                    <th style={{ width: "110px" }}>{monthCol}</th>
                    <th style={{ width: "110px" }}>{month1Col}</th>
                    <th style={{ width: "110px" }}>{month2Col}</th>
                    <th>Remarks</th>
                    <th> </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Project Rows */}
                  {groupedRows.normalRows.map((row, index) => (
                    <TableRow
                      key={`normal-${index}-${row.id || "new"}`}
                      row={row}
                      index={rows.indexOf(row)}
                      updateRow={updateRow}
                      deleteRow={deleteRow}
                      isLoading={isLoading}
                      currentUser={currentUser}
                      monthCol={monthCol}
                      month1Col={month1Col}
                      month2Col={month2Col}
                    />
                  ))}
                  {/* Add Direct Hours Subtotal only if there are normal rows */}
                  {groupedRows.normalRows.length > 0 && (                    <tr className="direct-total">
                      <td
                        colSpan="5"
                        style={{ textAlign: "right" }}
                        className="direct-total-label"
                      >
                        Total:
                      </td>
                      <td style={{ textAlign: "center", fontWeight: "bold", width: "110px" }}>
                        {formatter.format(
                          groupedRows.normalRows.reduce((sum, row) => sum + (parseFloat(row.month) || 0), 0)
                        )}
                      </td>
                      <td style={{ textAlign: "center", fontWeight: "bold", width: "110px" }}>
                        {formatter.format(
                          groupedRows.normalRows.reduce((sum, row) => sum + (parseFloat(row.month1) || 0), 0)
                        )}
                      </td>
                      <td style={{ textAlign: "center", fontWeight: "bold", width: "110px" }}>
                        {formatter.format(
                          groupedRows.normalRows.reduce((sum, row) => sum + (parseFloat(row.month2) || 0), 0)
                        )}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  )}

                  {/* PTO/Holiday Rows */}
                  {groupedRows.ptoRows.length > 0 && (
                    <>                      <tr className="group-separator pto-section">
                        <td colSpan="8">PTO/Holiday Time</td>
                      </tr>
                      {groupedRows.ptoRows.map((row, index) => (
                        <TableRow
                          key={`pto-${index}-${row.id || "new"}`}
                          row={row}
                          index={rows.indexOf(row)}
                          updateRow={updateRow}
                          deleteRow={deleteRow}
                          isLoading={isLoading}
                          currentUser={currentUser}
                        />
                      ))}                      <tr className="pto-total">
                        <td colSpan="5" className="pto-total-label" style={{ textAlign: "right", fontWeight: "bold" }}>
                          Total:
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold", width: "110px" }}>
                          {formatter.format(
                            groupedRows.ptoRows.reduce((sum, row) => sum + (parseFloat(row.month) || 0), 0)
                          )}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold", width: "110px" }}>
                          {formatter.format(
                            groupedRows.ptoRows.reduce((sum, row) => sum + (parseFloat(row.month1) || 0), 0)
                          )}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold", width: "110px" }}>
                          {formatter.format(
                            groupedRows.ptoRows.reduce((sum, row) => sum + (parseFloat(row.month2) || 0), 0)
                          )}
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </>
                  )}

                  {/* Leave Without Pay Rows */}
                  {groupedRows.lwopRows.length > 0 && (
                    <>                      <tr className="group-separator lwop-section">
                        <td colSpan="8">Leave Without Pay</td>
                      </tr>
                      {groupedRows.lwopRows.map((row, index) => (
                        <TableRow
                          key={`lwop-${index}-${row.id || "new"}`}
                          row={row}
                          index={rows.indexOf(row)}
                          updateRow={updateRow}
                          deleteRow={deleteRow}
                          isLoading={isLoading}
                          currentUser={currentUser}
                        />
                      ))}                      <tr className="lwop-total">
                        <td colSpan="5" className="lwop-total-label" style={{ textAlign: "right", fontWeight: "bold" }}>
                          Total:
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold", width: "110px" }}>
                          {formatter.format(
                            groupedRows.lwopRows.reduce((sum, row) => sum + (parseFloat(row.month) || 0), 0)
                          )}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold", width: "110px" }}>
                          {formatter.format(
                            groupedRows.lwopRows.reduce((sum, row) => sum + (parseFloat(row.month1) || 0), 0)
                          )}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold", width: "110px" }}>
                          {formatter.format(
                            groupedRows.lwopRows.reduce((sum, row) => sum + (parseFloat(row.month2) || 0), 0)
                          )}
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </>
                  )}

                  {/* Administrative Rows (0000-0000) */}
                  {groupedRows.adminRows.length > 0 && (
                    <>                      <tr className="group-separator">
                        <td colSpan="8">Indirect Time</td>
                      </tr>
                      {groupedRows.adminRows.map((row, index) => (
                        <TableRow
                          key={`admin-${index}-${row.id || "new"}`}
                          row={row}
                          index={rows.indexOf(row)}
                          updateRow={updateRow}
                          deleteRow={deleteRow}
                          isLoading={isLoading}
                          currentUser={currentUser}
                        />
                      ))}                      <tr className="overhead-total">
                        <td colSpan="5" className="overhead-total-label" style={{ textAlign: "right", fontWeight: "bold" }}>
                          Total:
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold", width: "110px" }}>
                          {formatter.format(
                            groupedRows.adminRows.reduce((sum, row) => sum + (parseFloat(row.month) || 0), 0)
                          )}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold", width: "110px" }}>
                          {formatter.format(
                            groupedRows.adminRows.reduce((sum, row) => sum + (parseFloat(row.month1) || 0), 0)
                          )}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold", width: "110px" }}>
                          {formatter.format(
                            groupedRows.adminRows.reduce((sum, row) => sum + (parseFloat(row.month2) || 0), 0)
                          )}
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </>
                  )}
                  {/* Available Hours Rows */}
                  {groupedRows.availableHoursRows.length > 0 && (
                    <>                      <tr className="group-separator available-hours-section">
                        <td colSpan="8">Available Hours</td>
                      </tr>
                      {groupedRows.availableHoursRows.map((row, index) => (
                        <TableRow
                          key={`available-${index}-${row.id || "new"}`}
                          row={row}
                          index={rows.indexOf(row)}
                          updateRow={updateRow}
                          deleteRow={deleteRow}
                          isLoading={isLoading}
                          currentUser={currentUser}
                        />
                      ))}                      <tr className="available-hours-total">
                        <td colSpan="5" className="available-hours-total-label" style={{ textAlign: "right", fontWeight: "bold" }}>
                          Total:
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold", width: "110px" }}>
                          {formatter.format(
                            groupedRows.availableHoursRows.reduce((sum, row) => sum + (parseFloat(row.month) || 0), 0)
                          )}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold", width: "110px" }}>
                          {formatter.format(
                            groupedRows.availableHoursRows.reduce((sum, row) => sum + (parseFloat(row.month1) || 0), 0)
                          )}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: "bold", width: "110px" }}>
                          {formatter.format(
                            groupedRows.availableHoursRows.reduce((sum, row) => sum + (parseFloat(row.month2) || 0), 0)
                          )}
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>

              {/* Opportunities Table */}              <table className="resource-table opportunities-table">
                <thead>
                  <tr>
                    <th>Opportunity No.</th>
                    <th>Opportunity Name</th>
                    <th>Proposal Champion</th>
                    <th>Proposed Fee</th>
                    <th style={{ width: "110px" }}>{monthCol}</th>
                    <th style={{ width: "110px" }}>{month1Col}</th>
                    <th style={{ width: "110px" }}>{month2Col}</th>
                    <th>Remarks</th>
                    <th> </th>
                  </tr>
                </thead>
                <tbody>
                  {opportunityRows.map((row, index) => (
                    <OpportunityRow
                      key={`opp-${index}`}
                      row={row}
                      index={index}
                      updateOpportunityRow={updateOpportunityRow}
                      deleteOpportunityRow={deleteOpportunityRow}
                      isLoading={isLoading}
                    />
                  ))}
                  {/* Opportunities Total Row */}
                  {opportunityRows.length > 0 && (
                    <tr className="opportunities-total">
                      <td
                        colSpan="4"
                        style={{ textAlign: "right", fontWeight: "bold" }}
                        className="opportunities-total-label"
                      >
                        Total:
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          width: "110px",
                        }}
                        className="opportunities-total-month"
                      >
                        {formatter.format(
                          opportunityRows.reduce(
                            (sum, row) => sum + (parseFloat(row.month) || 0),
                            0
                          )
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          width: "110px",
                        }}
                        className="opportunities-total-month1"
                      >
                        {formatter.format(
                          opportunityRows.reduce(
                            (sum, row) => sum + (parseFloat(row.month1) || 0),
                            0
                          )
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          width: "110px",
                        }}
                        className="opportunities-total-month2"
                      >
                        {formatter.format(
                          opportunityRows.reduce(
                            (sum, row) => sum + (parseFloat(row.month2) || 0),
                            0
                          )
                        )}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="hours-summary">
                <span className="total-label">Total Hours:</span>
                <span className="total-hours">{totalHoursFormatted}</span>
                {calculateAvailableHours() > 0 && (
                  <>
                    <div className="ratio-separator"></div>
                    <span className="ratio-label">Available Hours:</span>
                    <span className="available-hours">
                      {formatter.format(calculateAvailableHours())}
                    </span>
                  </>
                )}
                {/* <div className="ratio-separator"></div>
                <span className="ratio-label">Ratio B:</span>
                <span className="ratio-value">
                  {percentFormatter.format(calculateRatioB())}
                </span> */}
              </div>
              <div className="table-actions">
                <button
                  onClick={addRow}
                  className="add-btn"
                  disabled={isSaving || isLoading}
                >
                  Add Project Row
                </button>
                <button
                  onClick={addOpportunityRow}
                  className="add-btn"
                  disabled={isSaving || isLoading}
                >
                  Add Opportunity Row
                </button>
                <button
                  onClick={() => saveWithCallback(handleSuccessfulSave)}
                  className="save-btn"
                  disabled={isSaving || isLoading}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </>
          )}
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
          <span className="footer-text">Version 0.0 | About</span>
          {showAboutTooltip && (
            <div className="tooltip">
              Our Workload Projection App was developed by Anvit Patil, Nilay
              Nagar, Chad Peterson, Jonathan Herrera.
            </div>
          )}
        </div>
        <a className="footer-link" href="mailto:jonathan.herrera@p2sinc.com">
          | Contact Support
        </a>
      </div>

      <div className="footer-right">
        <a
          href="https://www.p2sinc.com"
          target="_blank"
          rel="noopener noreferrer"
        >
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
    const savedView = localStorage.getItem("currentView");
    return savedView || "resource";
  });
  const [userDetails, setUserDetails] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(""); // Define currentUser and setCurrentUser
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
    if (currentView === "resource" && mainContentRef.current) {
      return mainContentRef.current.hasUnsavedChanges || false;
    } else if (currentView === "teamedit" && teamEditRef.current) {
      return teamEditRef.current.hasUnsavedChanges || false;
    }
    return false;
  };

  // In App.js, add this inside the App component
useEffect(() => {
  // Initialize project search service on app load
  const initializeProjectSearch = async () => {
    try {
      await ProjectSearchService.initialize();
      console.log('Project search service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize project search:', error);
      // Show user-friendly error message if needed
    }
  };

  initializeProjectSearch();

  // Set up background refresh every hour
  const refreshInterval = setInterval(() => {
    ProjectSearchService.backgroundRefresh();
  }, 60 * 60 * 1000); // Check every hour

  // Refresh when the tab becomes visible after being hidden
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      ProjectSearchService.backgroundRefresh();
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Refresh when coming back online
  const handleOnline = () => {
    console.log('Network connection restored, refreshing project data...');
    ProjectSearchService.refresh();
  };
  
  window.addEventListener('online', handleOnline);

  // Cleanup
  return () => {
    clearInterval(refreshInterval);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('online', handleOnline);
  };
}, []);

  const handleNavigate = (view, params = {}) => {
    console.log(`Attempting to navigate to ${view} view`, params);

    // Skip unsaved changes check if explicitly bypassing (e.g., after save)
    if (params.bypassConfirm) {
      proceedWithNavigation(view, params);
      return;
    }

    // Check for unsaved changes before navigating
    if (hasUnsavedChanges()) {
      if (
        !window.confirm(
          "You have unsaved changes. Press Ok to save them. Press Cancel to discard."
        )
      ) {
        // User chose not to save, proceed with navigation
        proceedWithNavigation(view, params);
      } else {
        // User chose to save, call save function then navigate
        if (
          currentView === "resource" &&
          mainContentRef.current &&
          mainContentRef.current.saveChanges
        ) {
          mainContentRef.current.saveChanges(() =>
            proceedWithNavigation(view, params)
          );
        } else if (
          currentView === "teamedit" &&
          teamEditRef.current &&
          teamEditRef.current.saveChanges
        ) {
          teamEditRef.current.saveChanges(() =>
            proceedWithNavigation(view, params)
          );
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
    if (view === "resource") {
      if (window.clearSearchSuggestions) {
        window.clearSearchSuggestions();
      }
      try {
        const inputs = document.querySelectorAll('input[type="text"]');
        inputs.forEach((input) => {
          input.blur();
        });
      } catch (e) {
        console.warn("Failed to clear input focus states:", e);
      }
    }

    // Save the current view to localStorage
    localStorage.setItem("currentView", view);

    // Force refresh for LeadershipPage if navigating after TeamEdit save
    if (view === "leadership" && params.refresh) {
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
    if (view === "teamedit" && params.member) {
      console.log("Setting selected user for TeamEdit:", params.member);
      setSelectedUser(params.member); // Set the selected user
    }
  };

  const handleLogin = (name, email, scheduledHours) => {
    setUserDetails({
      name,
      email,
      scheduledHours,
    });
    setIsLoggedIn(true);
    setCurrentView("resource");
  };

  // Update localStorage when user logs out
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      UserService.logout();
      // Clear the saved view when logging out
      localStorage.removeItem("currentView");
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
      {currentView === "resource" && (
        <MainContent
          ref={mainContentRef}
          userDetails={userDetails}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />
      )}
      {currentView === "pm" && <PMPage navigate={handleNavigate} />}
      {currentView === "leadership" && (
        <LeadershipPage navigate={handleNavigate} />
      )}
      {currentView === "teamedit" && (
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
