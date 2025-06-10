import React, { useState, useEffect, useCallback } from "react";
import { UserService } from "../services/UserService";
import { GLTeamService } from "../services/GLTeamService";
import QuarterPicker from "./QuarterPicker";
import "./LeadershipPage.css";
import API_CONFIG from "../services/apiConfig";
import { getCurrentQuarterString, getCurrentYear, getQuarterMonths, getCurrentQuarter } from "../utils/dateUtils";
import { 
  normalizeMonthlyWorkloadData, 
  groupStaffByManager, 
  calculateGroupSummary, 
  validateMonthlyData 
} from "../utils/monthlyPayloadUtils";

const LeadershipPage = ({ navigate }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [teamData, setTeamData] = useState({});
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarterString());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [viewMode, setViewMode] = useState("hierarchy");
  const [currentUser, setCurrentUser] = useState(null);
  const [groupList, setGroupList] = useState([]);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

  const [months, setMonths] = useState(getQuarterMonths(getCurrentQuarter()));
  const [allStaffMonthlyData, setAllStaffMonthlyData] = useState(null);

  useEffect(() => {
    const userDetails = UserService.getCurrentUserDetails();
    if (userDetails) {
      setCurrentUser(userDetails);
    }
  }, []);

  useEffect(() => {
    // Check if the page has already been refreshed or if a refresh is requested
    const urlParams = new URLSearchParams(window.location.search);
    const refresh = urlParams.get("refresh");
    const hasRefreshed = sessionStorage.getItem("leadershipPageRefreshed");

    if (refresh === "true" && !hasRefreshed) {
      console.log("Refreshing LeadershipPage after save in TeamEdit...");
      sessionStorage.setItem("leadershipPageRefreshed", "true");
      urlParams.delete("refresh"); // Remove the parameter to avoid repeated refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.reload();
    }
  }, []);

  // Helper to fetch group manager email from backend contacts API
  async function fetchGroupManagerEmailFromBackend(name) {
    if (!name || name.includes("@")) return name;
    try {
      // Use /contacts?search=<name> (not /contacts/search)
      const params = new URLSearchParams({ search: name });
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTACTS}?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].email) {
        return data[0].email;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  const loadTeamData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(
        "Loading leadership data for current user:",
        currentUser.email
      );

      const userGroupManager = currentUser.groupManager;

      // Fix: Only declare quarterString once
      const quarterString = typeof selectedQuarter === 'number' ? `Q${selectedQuarter}` : selectedQuarter;

      if (!userGroupManager && !showAllGroups) {
        console.log("User is not assigned to any group");
        setTeamData({});
        setIsLoading(false);
        return;
      }      if (showAllGroups) {
        // Fetch all staff monthly workload for all groups
        console.log('Fetching all staff monthly workload for all groups...');
        const allStaffData = await GLTeamService.getAllStaffMonthlyWorkload(
          selectedYear,
          quarterString
        );
        console.log('All staff monthly workload data received:', allStaffData);
        
        // Add detailed structure inspection
        if (allStaffData && allStaffData.managers) {
          console.log('Managers structure found:');
          Object.entries(allStaffData.managers).forEach(([managerName, managerData]) => {
            console.log(`Manager: ${managerName}`, {
              hasStudios: !!managerData.studios,
              studiosCount: managerData.studios ? Object.keys(managerData.studios).length : 0,
              groupNo: managerData.groupNo,
              memberCount: managerData.memberCount,
              hasMonthlyTotals: !!managerData.monthlyTotals
            });
            
            if (managerData.studios) {
              Object.entries(managerData.studios).forEach(([studioName, studioData]) => {
                console.log(`  Studio: ${studioName}`, {
                  membersCount: studioData.members ? studioData.members.length : 0,
                  hasMembers: !!studioData.members,
                  sampleMember: studioData.members && studioData.members[0] ? {
                    name: studioData.members[0].name,
                    hasScheduledHours: !!studioData.members[0].scheduled_hours,
                    hasDirectHours: !!studioData.members[0].direct_hours
                  } : null
                });
              });
            }
          });
        }
        
        // Validate the data structure
        const validation = validateMonthlyData(allStaffData);
        console.log('Data validation result:', validation);
        
        if (!validation.isValid) {
          console.error('Invalid data structure:', validation.errors);
          setError('Invalid data received from server: ' + validation.errors.join(', '));
          setIsLoading(false);
          return;
        }
        
        if (validation.warnings.length > 0) {
          console.warn('Data structure warnings:', validation.warnings);
        }
        
        setAllStaffMonthlyData(allStaffData);

        // Set months for selector based on the received data structure
        if (allStaffData) {
          if (allStaffData.expectedMonths) {
            setMonths(allStaffData.expectedMonths);
          } else if (allStaffData.expected_months) {
            setMonths(allStaffData.expected_months);
          } else {
            // Fallback to quarter months if not provided
            const quarterNum = typeof selectedQuarter === 'number' ? selectedQuarter : 
              selectedQuarter === 'Q1' ? 1 : selectedQuarter === 'Q2' ? 2 : 
              selectedQuarter === 'Q3' ? 3 : 4;
            setMonths(getQuarterMonths(quarterNum));
          }
        }
        setTeamData({}); // Clear teamData for all groups view
        setIsLoading(false);
        return;
      }

      console.log(`User belongs to group managed by: ${userGroupManager}`);      // Always refresh and get the group manager's email, don't use localStorage
      let groupManagerEmail = userGroupManager;
      if (groupManagerEmail && !groupManagerEmail.includes('@')) {
        try {
          // First try to find from mockStaffData
          const staffList = window.mockStaffData || [];
          const gm = staffList.find(
            (s) => s.name === groupManagerEmail || s.groupManager === groupManagerEmail
          );
          if (gm && gm.email) {
            groupManagerEmail = gm.email;
          } else {
            // Always fetch from backend, don't use cached value
            const backendEmail = await fetchGroupManagerEmailFromBackend(groupManagerEmail);
            if (backendEmail) {
              groupManagerEmail = backendEmail;
              // Optionally store for this session, but always refresh on page load
              localStorage.setItem('userGroupManagerEmail', backendEmail);
            }
          }
        } catch (e) {
          console.warn('Failed to fetch group manager email:', e);
          // fallback: leave as is
        }
      }
      // Use new GLTeamService signature: only groupManagerEmail
      const members = await GLTeamService.getTeamMembers(groupManagerEmail);

      if (!members || members.length === 0) {
        console.log("No team members found for this group");
        setError(
          "No team members found for your group. You might not be assigned to a group yet."
        );
        setTeamData({});
        setIsLoading(false);
        return;
      }

      console.log(
        `Found ${members.length} team members for group manager: ${userGroupManager}`
      );

      // Remove unused emails variable
      // const emails = members.map((member) => member.email);

      // Use the new monthly allocations method
      // const monthlyData = await GLTeamService.getTeamMonthlyAllocations(
      //   groupManagerEmail,
      //   selectedYear,
      //   quarterString
      // );

      const monthlyData = await GLTeamService.getTeamMonthlyAllocationsWithDetails(
        groupManagerEmail,
        selectedYear,
        quarterString
      );

      // Use backend's expected_months for month selector
      setMonths(monthlyData.expected_months || [1, 2, 3]);

      // Instead of milestones, use monthlyData.monthly_data for allocations
      // Determine which month key to use based on selectedMonthIndex
      const monthKey = `month${selectedMonthIndex + 1}`;
      const monthAllocations = (monthlyData.monthly_data && monthlyData.monthly_data[monthKey]) || [];

      const allGroupsData = {};
      const groupManager = userGroupManager;

      allGroupsData[groupManager] = {
        studios: {},
        totalHours: 0,
        scheduledHours: 0,
        directHours: 0,
        ptoHours: 0,
        overheadHours: 0,
        availableHours: 0, //new
        memberCount: members.length,
      };

      members.forEach((member) => {
        let studio = "Unassigned";

        if (member.GroupName) {
          console.log(
            `Found GroupName for ${member.name}: ${member.GroupName}`
          );
          studio = member.GroupName;
        } else {
          console.log(
            `No GroupName found for ${member.name}, using 'Unassigned'}`
          );
        }

        if (selectedGroup && studio !== selectedGroup) {
          console.log(
            `Filtering out member ${member.name} because group "${studio}" doesn't match selected group "${selectedGroup}"`
          );
          return;
        }

        let scheduledHours = 40.0;

        if (
          member.scheduled_hours !== null &&
          member.scheduled_hours !== undefined
        ) {
          scheduledHours = Number(member.scheduled_hours);

          if (isNaN(scheduledHours)) {
            console.warn(
              `Invalid hours value for ${member.name}: ${member.scheduled_hours}, using default 40`
            );
            scheduledHours = 40.0;
          }
        }

        console.log(
          `Processing member: ${
            member.name
          }, Studio: ${studio}, Hours: ${scheduledHours} (type: ${typeof scheduledHours})`
        );

        // if (!allGroupsData[groupManager].studios[studio]) {
        //   allGroupsData[groupManager].studios[studio] = {
        //     members: [],
        //     totalHours: 0,
        //     scheduledHours: 0,
        //     directHours: 0,
        //     ptoHours: 0,
        //     overheadHours: 0,
        //     availableHours: 0, 
        //     studioLeader: member.studio_leader || 'Unassigned',
        //     discipline: member.discipline || ''//new
        //   };
        // }
        if (!allGroupsData[groupManager].studios[studio]) {
          allGroupsData[groupManager].studios[studio] = {
            members: [],
            totalHours: 0,
            scheduledHours: 0,
            directHours: 0,
            ptoHours: 0,
            overheadHours: 0,
            availableHours: 0,
            // ADD THESE LINES:
            studioLeader: member.studio_leader || 'Unassigned',
            discipline: member.discipline || ''
          };
        } else {
          // UPDATE existing studio data if this member has better info
          if (member.studio_leader && !allGroupsData[groupManager].studios[studio].studioLeader) {
            allGroupsData[groupManager].studios[studio].studioLeader = member.studio_leader;
          }
          if (member.discipline && !allGroupsData[groupManager].studios[studio].discipline) {
            allGroupsData[groupManager].studios[studio].discipline = member.discipline;
          }
        }

        // FIX: Use contact_id for matching allocations
        const memberAllocations = monthAllocations.filter(
          (a) => a.contact_id === member.contact_id
        );
        const memberRows = memberAllocations.map((allocation) => ({
              // Core identifiers
                        ra_id: allocation.ra_id,
                        milestone_id: allocation.milestone_id,
                        contact_id: allocation.contact_id,
                        
                        // Project/Milestone Information (now with detailed data)
                        projectNumber: allocation.project_number || allocation.proj_id || "",
                        projectName: allocation.project_name || "",
                        milestone: allocation.milestone_name || "",
                        pm: allocation.project_manager || "",
                        
                        // Financial Information
                        labor: parseFloat(allocation.contract_labor || allocation.labor || 0),
                        pctLaborUsed: parseFloat(allocation.forecast_pm_labor || allocation.percentLaborUsed || 0) * 100,
                        
                        // Hours Information
                        hours: parseFloat(allocation.ra_hours || allocation.hours || 0),
                        month_hours: parseFloat(allocation.month_hours || 0),
                        month_hours1: parseFloat(allocation.month_hours1 || 0),
                        month_hours2: parseFloat(allocation.month_hours2 || 0),
                        
                        // Classification flags
                        directHours: !!allocation.direct_hours,
                        ptoHolidayHours: !!allocation.pto_holiday_hours,
                        lwopHours: !!allocation.lwop_hours,
                        indirectHours: !!allocation.indirect_hours,
                        availableHours: !!allocation.available_hours,
                        
                        // Additional Information
                        remarks: allocation.ra_remarks || allocation.remarks || "",
                        quarter: allocation.quarter,
                        year: allocation.year,
                        month: allocation.month,
                        
                        // Milestone status and billing info
                        milestone_status: allocation.milestone_status,
                        is_billable: allocation.is_billable,
                        act_mult_rate: allocation.act_mult_rate,
                        
                        // Dates and metadata
                        ra_date: allocation.ra_date,
                        modified_by: allocation.modified_by,
                      }));
        
        const directHours = memberRows
          .filter((row) => !row.projectNumber.startsWith("0000-0000"))
          .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);

        const ptoHours = memberRows
          .filter(
            (row) =>
              row.projectNumber.startsWith("0000-0000-0PTO") ||
              row.projectNumber.startsWith("0000-0000-0HOL") ||
              row.projectNumber.startsWith("0000-0000-0SIC") ||
              row.projectNumber.startsWith("0000-0000-LWOP") ||
              row.projectNumber.startsWith("0000-0000-JURY")
          )
          .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);

        //new
        const availableHours = memberRows
          .filter(
            (row) =>
              row.availableHours ||
              row.projectNumber.startsWith("0000-0000-AVAIL_HOURS")
          )
          .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);

        const overheadHours = memberRows
          .filter(
            (row) =>
              row.projectNumber.startsWith("0000-0000") &&
              !row.projectNumber.startsWith("0000-0000-0PTO") &&
              !row.projectNumber.startsWith("0000-0000-0HOL") &&
              !row.projectNumber.startsWith("0000-0000-0SIC") &&
              !row.projectNumber.startsWith("0000-0000-LWOP") &&
              !row.projectNumber.startsWith("0000-0000-JURY") &&
              !row.availableHours && // new
              !row.projectNumber.startsWith("0000-0000-AVAIL_HOURS") //new
          )
          .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);        //check with team
        const totalHours =
          directHours + ptoHours + overheadHours;

        allGroupsData[groupManager].studios[studio].members.push({
          id: member.id,
          name: member.name,
          email: member.email,
          laborCategory: member.labor_category || "",
          scheduledHours: scheduledHours,
          directHours,
          ptoHours,
          overheadHours,          availableHours, //new
          totalHours,
          ratioB: calculateRatioB(directHours, scheduledHours, ptoHours),
          rows: memberRows,
          studioLeader: member.studio_leader || 'Unassigned',
          discipline: member.discipline || ''
        });

        allGroupsData[groupManager].studios[studio].totalHours += totalHours;
        allGroupsData[groupManager].studios[studio].scheduledHours +=
          scheduledHours;
        allGroupsData[groupManager].studios[studio].directHours += directHours;
        allGroupsData[groupManager].studios[studio].ptoHours += ptoHours;
        allGroupsData[groupManager].studios[studio].overheadHours +=
          overheadHours;
        allGroupsData[groupManager].studios[studio].availableHours +=
          availableHours; //new

        allGroupsData[groupManager].totalHours += totalHours;
        allGroupsData[groupManager].scheduledHours += scheduledHours;
        allGroupsData[groupManager].directHours += directHours;
        allGroupsData[groupManager].ptoHours += ptoHours;
        allGroupsData[groupManager].overheadHours += overheadHours;
        allGroupsData[groupManager].availableHours += availableHours; //new
      });

      Object.keys(allGroupsData[groupManager].studios).forEach((studio) => {
        const studioData = allGroupsData[groupManager].studios[studio];
        studioData.ratioB = calculateRatioB(
          studioData.directHours,
          studioData.scheduledHours,
          studioData.ptoHours
        );
      });

      allGroupsData[groupManager].ratioB = calculateRatioB(
        allGroupsData[groupManager].directHours,
        allGroupsData[groupManager].scheduledHours,
        allGroupsData[groupManager].ptoHours
      );

      const groups = extractGroupNames(allGroupsData);
      setGroupList(groups);
      console.log("Available groups:", groups);

      console.log(
        "FINAL DATA STRUCTURE:",
        JSON.stringify(allGroupsData, null, 2)
      );
      setTeamData(allGroupsData);
    } catch (err) {
      console.error("Error loading team data:", err);
      setError(`Failed to load team data: ${err.message}`);
      setTeamData({});
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, selectedGroup, showAllGroups, selectedQuarter, selectedYear, selectedMonthIndex]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    loadTeamData();  }, [currentUser, selectedGroup, showAllGroups, loadTeamData]);
  
  const handleQuarterChange = useCallback((quarter, year) => {
    console.log("Quarter changed in LeadershipPage:", {
      quarter,
      year,
    });

    setSelectedQuarter(quarter);
    setSelectedYear(year);
    // Update months when quarter changes
    const quarterNum = quarter === 'Q1' ? 1 : quarter === 'Q2' ? 2 : quarter === 'Q3' ? 3 : quarter === 'Q4' ? 4 : quarter;
    setMonths(getQuarterMonths(quarterNum));
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  const extractGroupNames = (teamData) => {
    const groups = new Set();

    Object.entries(teamData).forEach(([manager, managerData]) => {
      Object.keys(managerData.studios).forEach((studio) => {
        if (studio !== "Unassigned") {
          groups.add(studio);
        }
      });
    });

    return Array.from(groups).sort();
  };

  const calculateRatioB = (directHours, scheduledHours, ptoHours) => {
    const denominator = scheduledHours - ptoHours;
    if (denominator <= 0) return 0;
    return directHours / denominator;
  };

  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  const formatPercent = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="page-layout">
      <main className="gl-dashboard">
        <div className="content-wrapper">
          <QuarterPicker
            onQuarterChange={handleQuarterChange}
            initialYear={selectedYear}
            initialQuarter={selectedQuarter}
          />

          <div className="user-info-container">
            {groupList.length > 0 && (
              <div className="view-controls-container">
                <button
                  className={`view-control-btn ${showAllGroups ? "active" : ""}`}
                  onClick={() => {
                    if (!showAllGroups) {
                      setSelectedGroup("");
                    }
                    setShowAllGroups(!showAllGroups);
                  }}
                >
                  {showAllGroups ? "My Group Only" : "All Groups"}
                </button>

                <button
                  className={`view-control-btn ${
                    viewMode === "hierarchy" ? "active" : ""
                  }`}
                  onClick={() => setViewMode("hierarchy")}
                >
                  Group By Team
                </button>

                {/* <button
                  className={`view-control-btn ${
                    viewMode === "projects" ? "active" : ""
                  } ${showAllGroups ? "disabled" : ""}`}
                  onClick={() => !showAllGroups && setViewMode("projects")}
                  disabled={showAllGroups}
                  title={
                    showAllGroups
                      ? "Projects view not available when viewing all groups"
                      : ""
                  }
                >
                  Group By Projects
                </button> */}
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {isLoading ? (
              <div className="loading-indicator">Loading team data...</div>            ) : showAllGroups ? (
              allStaffMonthlyData ? (
                <div className="group-summary">
                  <div className="project-summary">
                    <div className="pm-dashboard-title">
                      All Groups Summary
                      <div className="month-selector">
                        {/* Month selector buttons */}
                        {months.map((monthNum, idx) => (
                          <button
                            key={monthNum}
                            className={`view-control-btn ${selectedMonthIndex === idx ? "active" : ""}`}
                            onClick={() => setSelectedMonthIndex(idx)}
                          >
                            {new Date(2000, monthNum - 1, 1).toLocaleString('default', { month: 'long' })}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Group-by-group summary table for All Groups view */}
                    {(() => {
                      console.log('Processing all staff data for summary table...');
                      console.log('AllStaffMonthlyData structure:', allStaffMonthlyData);
                      
                      // Use utility functions to normalize and process the data
                      const normalizedStaffMembers = normalizeMonthlyWorkloadData(allStaffMonthlyData, selectedMonthIndex);
                      console.log('Normalized staff members:', normalizedStaffMembers);
                      
                      if (normalizedStaffMembers.length === 0) {
                        return (
                          <div className="no-data-message">
                            <p>No data found for this month/quarter.</p>
                            <p>Debug info: selectedMonthIndex = {selectedMonthIndex}, dataStructure = {Object.keys(allStaffMonthlyData).join(', ')}</p>
                          </div>
                        );
                      }

                      // Group staff by manager using utility function
                      const groupedByManager = groupStaffByManager(normalizedStaffMembers);
                      console.log('Staff grouped by manager:', groupedByManager);                      // Calculate summary for each group using utility function
                      const groupSummaries = Object.entries(groupedByManager).map(([manager, members]) => {
                        const summary = calculateGroupSummary(members);
                        summary.manager = manager;
                        // Try to get group number from the original allStaffMonthlyData
                        if (allStaffMonthlyData.managers && allStaffMonthlyData.managers[manager]) {
                          summary.groupNo = allStaffMonthlyData.managers[manager].groupNo;
                        }
                        return summary;
                      });return (
                        <table className="summary-table">
                          <thead>
                            <tr className="project-metrics">
                              {showAllGroups && <th>Group</th>}
                              <th>Group Leader</th>
                              <th>Team Members</th>
                              <th>Scheduled Hours</th>
                              <th>Direct Hours</th>
                              <th>PTO/HOL</th>
                              <th>Indirect Hours</th>
                              <th>Available Hours</th>
                              <th>Total Hours</th>
                              <th>Utilization Ratio</th>
                            </tr>
                          </thead>                          <tbody>                            {groupSummaries
                              .sort((a, b) => {
                                if (showAllGroups && a.groupNo && b.groupNo) {
                                  // Sort by group number when showing all groups
                                  const groupA = parseInt(a.groupNo);
                                  const groupB = parseInt(b.groupNo);
                                  if (!isNaN(groupA) && !isNaN(groupB)) {
                                    return groupA - groupB;
                                  }
                                }
                                // Fallback to manager name sorting
                                return a.manager.localeCompare(b.manager);
                              })
                              .map((summary, index) => (
                                <tr key={index}>
                                  {showAllGroups && <td>{summary.groupNo || 'N/A'}</td>}
                                  <td>{summary.manager}</td>
                                  <td className="number-cell">{summary.memberCount}</td>
                                  <td className="number-cell">{formatter.format(summary.scheduled_hours)}</td>
                                  <td className="number-cell">{formatter.format(summary.direct_hours)}</td>
                                  <td className="number-cell">{formatter.format(summary.pto_holiday_hours)}</td>
                                  <td className="number-cell">{formatter.format(summary.indirect_hours)}</td>
                                  <td className={`number-cell available-hours-cell ${summary.available_hours === 0 ? 'zero-hours' : ''}`}>{formatter.format(summary.available_hours)}</td>
                                  <td className="number-cell"><strong>{formatter.format(summary.total_hours)}</strong></td>
                                  <td className="number-cell"><strong>{formatPercent(summary.ratio_b)}</strong></td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      );
                    })()}                    {/* Collapsible groups for each manager */}
                    <div className="collapsible-group-list">
                      {(() => {
                        console.log('Rendering collapsible groups for selectedMonthIndex:', selectedMonthIndex);
                        
                        // Use utility function to normalize and extract staff members for the selected month
                        const allStaffMembers = normalizeMonthlyWorkloadData(allStaffMonthlyData, selectedMonthIndex);
                        console.log('Staff members for collapsible view:', allStaffMembers);
                        
                        if (allStaffMembers.length === 0) {
                          return (
                            <div className="no-data-message">
                              <p>No staff members found for the selected month.</p>
                              <p>This could be due to:</p>
                              <ul>
                                <li>No data available for {new Date(2000, months[selectedMonthIndex] - 1, 1).toLocaleString('default', { month: 'long' })}</li>
                                <li>Data processing issues in utility functions</li>
                                <li>Backend data structure changes</li>
                              </ul>
                            </div>
                          );
                        }
                        
                        // Group staff by manager using utility function
                        const groupedByManager = groupStaffByManager(allStaffMembers);
                        console.log('Grouped by manager for collapsible view:', groupedByManager);
                        
                        // Convert the managers structure from backend to the format expected by CollapsibleGroup
                        const teamDataForGroups = {};
                        Object.entries(groupedByManager).forEach(([managerName, staffMembers]) => {
                          // Create studios structure grouped by studio/discipline
                          const studios = {};
                          staffMembers.forEach(member => {
                            const studioName = member.studio || 'Unassigned';
                            if (!studios[studioName]) {
                              studios[studioName] = {
                                members: [],
                                studioLeader: member.studio_leader || 'Unassigned',
                                discipline: member.discipline || '',
                                totalHours: 0,
                                scheduledHours: 0,
                                directHours: 0,
                                ptoHours: 0,
                                overheadHours: 0,
                                availableHours: 0,
                                ratioB: 0
                              };
                            }
                            
                            // Add member to studio
                            studios[studioName].members.push({
                              ...member,
                              laborCategory: member.labor_category,
                              scheduledHours: member.scheduled_hours,
                              directHours: member.direct_hours,
                              ptoHours: member.pto_holiday_hours,
                              overheadHours: member.indirect_hours,
                              availableHours: member.available_hours,
                              totalHours: member.total_hours,
                              ratioB: member.ratio_b,
                              rows: member.rows || []
                            });
                            
                            // Accumulate studio totals
                            studios[studioName].scheduledHours += member.scheduled_hours || 0;
                            studios[studioName].directHours += member.direct_hours || 0;
                            studios[studioName].ptoHours += member.pto_holiday_hours || 0;
                            studios[studioName].overheadHours += member.indirect_hours || 0;
                            studios[studioName].availableHours += member.available_hours || 0;
                            studios[studioName].totalHours += member.total_hours || 0;
                          });
                          
                          // Calculate studio ratios
                          Object.values(studios).forEach(studio => {
                            studio.ratioB = calculateRatioB(studio.directHours, studio.scheduledHours, studio.ptoHours);
                          });
                          
                          teamDataForGroups[managerName] = {
                            studios: studios,
                            memberCount: staffMembers.length
                          };
                        });
                        
                        console.log('TeamData for collapsible groups:', teamDataForGroups);
                        
                        // Render CollapsibleGroup components similar to the "My Group Only" view
                        return Object.entries(teamDataForGroups)
                          .sort(([managerA], [managerB]) => managerA.localeCompare(managerB))
                          .map(([manager, managerData]) => (
                            <CollapsibleGroup
                              key={manager}
                              manager={manager}
                              managerData={managerData}
                              formatter={formatter}
                              formatPercent={formatPercent}
                              navigate={navigate}
                              isEditable={false} // Read-only for all groups view
                            />
                          ));
                      })()}
                    </div></div>
                </div>
              ) : (
                <div className="no-data-message">
                  <p>No workload data available for all groups.</p>
                  <p>This could be due to:</p>
                  <ul>
                    <li>No data returned from the backend</li>
                    <li>Data structure mismatch</li>
                    <li>Network connectivity issues</li>
                  </ul>
                  {process.env.NODE_ENV !== 'production' && (
                    <div style={{marginTop: '10px'}}>
                      <strong>Debug Info:</strong>
                      <pre style={{fontSize: '10px', color: '#888', background: '#f8f8f8', padding: '10px'}}>
                        AllStaffMonthlyData: {JSON.stringify(allStaffMonthlyData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )
            ) : Object.keys(teamData).length === 0 ? (
              <div className="no-data-message">
                No data found for your group. You might not be assigned to a group yet.
              </div>
            ) : (
              <div className="group-summary">
                <div className="project-summary">
                  <div className="pm-dashboard-title">
                    Group Summary
                    <div className="month-selector">
                      {/* Month selector buttons */}
                      {months.map((monthNum, idx) => (
                        <button
                          key={monthNum}
                          className={`view-control-btn ${selectedMonthIndex === idx ? "active" : ""}`}
                          onClick={() => setSelectedMonthIndex(idx)}
                        >
                          {new Date(2000, monthNum - 1, 1).toLocaleString('default', { month: 'long' })}
                        </button>
                      ))}
                    </div>
                  </div>
                  <table className="summary-table">
                    <thead>
                      <tr className="project-metrics">
                        <th>Group Leader</th>
                        <th>Team Members</th>
                        <th>Scheduled Hours</th>
                        <th>Direct Hours</th>
                        <th>PTO/HOL</th>
                        <th>Indirect Hours</th>
                        <th>Available Hours</th>
                        <th>Total Hours</th>
                        <th>Utilization Ratio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(teamData)
                        .sort(([managerA, dataA], [managerB, dataB]) => {
                          const groupA = dataA.groupNo;
                          const groupB = dataB.groupNo;
                          if (groupA == null && groupB == null) return 0;
                          if (groupA == null) return 1;
                          if (groupB == null) return -1;
                          const numA = parseInt(groupA);
                          const numB = parseInt(groupB);
                          if (isNaN(numA) && isNaN(numB)) return 0;
                          if (isNaN(numA)) return 1;
                          if (isNaN(numB)) return -1;
                          return numA - numB;
                        })
                        .map(([manager, data], index) => (
                          <tr key={index}>
                            <td>{manager}</td>
                            <td className="number-cell">{data.memberCount}</td>
                            <td className="number-cell">{formatter.format(data.scheduledHours)}</td>
                            <td className="number-cell">{formatter.format(data.directHours)}</td>
                            <td className="number-cell">{formatter.format(data.ptoHours)}</td>
                            <td className="number-cell">{formatter.format(data.overheadHours)}</td>
                            <td className={`number-cell available-hours-cell ${data.availableHours === 0 ? 'zero-hours' : ''}`}>{formatter.format(data.availableHours)}</td>
                            <td className="number-cell"><strong>{formatter.format(data.totalHours)}</strong></td>
                            <td className="number-cell"><strong>{formatPercent(data.ratioB)}</strong></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {/* Collapsible group for each manager */}
                {Object.entries(teamData)
                  .sort(([managerA, dataA], [managerB, dataB]) => {
                    const groupA = dataA.groupNo;
                    const groupB = dataB.groupNo;
                    if (groupA == null && groupB == null) return 0;
                    if (groupA == null) return 1;
                    if (groupB == null) return -1;
                    const numA = parseInt(groupA);
                    const numB = parseInt(groupB);
                    if (isNaN(numA) && isNaN(numB)) return 0;
                    if (isNaN(numA)) return 1;
                    if (isNaN(numB)) return -1;
                    return numA - numB;
                  })
                  .map(([manager, managerData]) => (
                    <CollapsibleGroup
                      key={manager}
                      manager={manager}
                      managerData={managerData}
                      formatter={formatter}
                      formatPercent={formatPercent}
                      navigate={navigate}
                      isEditable={true}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// CollapsibleGroup, CollapsibleStudio, CollapsibleMember components from RA app version
const CollapsibleGroup = ({ manager, managerData, formatter, formatPercent, navigate, isEditable = true }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  return (
    <div className="collapsible-group">
      <div className="collapsible-header" onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? <span style={{marginRight: 8}}>▼</span> : <span style={{marginRight: 8}}>▶</span>}
        <h3 style={{display: 'inline'}}>{manager} Group</h3>
      </div>
      {isExpanded && (
        <div className="collapsible-content">
          <table className="summary-table">
            <thead>
              <tr className="project-metrics">
                <th>Studio Leader</th>
                <th>Discipline</th>
                <th>Team Members</th>
                <th>Scheduled Hours</th>
                <th>Direct Hours</th>
                <th>PTO/HOL</th>
                <th>Indirect Hours</th>
                <th>Available Hours</th>
                <th>Total Hours</th>
                <th>Utilization Ratio</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(managerData.studios).map(([studio, studioData], index) => {
                const studioLeaderName = studioData.studioLeader || (studioData.members.length > 0 && studioData.members[0].studioLeader) || 'Unassigned';
                const discipline = studioData.discipline || '';
                return (
                  <tr key={index}>
                    <td>{studioLeaderName}</td>
                    <td>{discipline}</td>
                    <td className="number-cell">{studioData.members.length}</td>
                    <td className="number-cell">{formatter.format(studioData.scheduledHours)}</td>
                    <td className="number-cell">{formatter.format(studioData.directHours)}</td>
                    <td className="number-cell">{formatter.format(studioData.ptoHours)}</td>
                    <td className="number-cell">{formatter.format(studioData.overheadHours)}</td>
                    <td className={`number-cell available-hours-cell ${studioData.availableHours === 0 ? 'zero-hours' : ''}`}>{formatter.format(studioData.availableHours)}</td>
                    <td className="number-cell"><strong>{formatter.format(studioData.totalHours)}</strong></td>
                    <td className="number-cell"><strong>{formatPercent(studioData.ratioB)}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {Object.entries(managerData.studios).map(([studio, studioData]) => (
            <CollapsibleStudio
              key={studio}
              studio={studio}
              studioData={studioData}
              formatter={formatter}
              formatPercent={formatPercent}
              navigate={navigate}
              isEditable={isEditable}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CollapsibleStudio = ({ studio, studioData, formatter, formatPercent, navigate, isEditable = true }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const studioLeaderName =studioData.studioLeader || 'Unassigned';
  const discipline = studioData.discipline || (studioData.members.length > 0 && studioData.members[0].discipline) || '';
  return (
    <div className="collapsible-studio">
      <div className="collapsible-header" onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? <span style={{marginRight: 8}}>▼</span> : <span style={{marginRight: 8}}>▶</span>}
        <h4 style={{display: 'inline'}}>{studioLeaderName} - {discipline}</h4>
      </div>
      {isExpanded && (
        <table className="summary-table">
          <thead>
            <tr className="project-metrics">
              <th>Team Member</th>
              <th>Labor Category</th>
              <th>Scheduled Hours</th>
              <th>Direct Hours</th>
              <th>PTO/HOL</th>
              <th>Indirect Hours</th>
              <th>Available Hours</th>
              <th>Total Hours</th>
              <th>Utilization Ratio</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {studioData.members
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((member, index) => (
                <CollapsibleMember
                  key={index}
                  member={member}
                  formatter={formatter}
                  formatPercent={formatPercent}
                  navigate={navigate}
                  isEditable={isEditable}
                />
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const CollapsibleMember = ({ member, formatter, formatPercent, navigate, isEditable = true }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const sortedRows = [...(member.rows || [])].sort((a, b) => a.projectNumber.localeCompare(b.projectNumber));
  return (
    <>
      <tr>
        <td>
          {member.name}
        </td>
        <td>{member.laborCategory}</td>
        <td className="number-cell">{formatter.format(member.scheduledHours || 0)}</td>
        <td className="number-cell">{formatter.format(member.directHours)}</td>
        <td className="number-cell">{formatter.format(member.ptoHours)}</td>
        <td className="number-cell">{formatter.format(member.overheadHours)}</td>
        <td className={`number-cell available-hours-cell ${member.availableHours === 0 ? 'zero-hours' : ''}`}>{formatter.format(member.availableHours)}</td>
        <td className={`number-cell ${member.totalHours < member.scheduledHours ? 'hours-warning' : ''}`}>{formatter.format(member.totalHours)}</td>
        <td className="number-cell"><strong>{formatPercent(member.ratioB)}</strong></td>
        <td>
          <button
            className="expand-details-btn"
            onClick={e => { e.preventDefault(); setIsExpanded(!isExpanded); }}
          >
            Details
          </button>
        </td>      </tr>
      {isExpanded && (
        <tr className="member-details">
          <td colSpan="10">
            <div className="time-entries">
              {sortedRows.length === 0 ? (
                <div className="no-entries">No time entries found</div>
              ) : (
                sortedRows.map((entry, i) => (
                  <div key={i} className="time-entry">
                    <span className="project-number">{entry.projectNumber}</span>
                    <span className="project-name">{entry.milestone}</span>
                    <span className="remarks">{entry.remarks}</span>
                    <span className="number-cell">{formatter.format(entry.hours)}</span>
                  </div>
                ))
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default LeadershipPage;
