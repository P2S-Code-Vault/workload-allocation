import React, { useState, useEffect, useCallback } from "react";
import { UserService } from "../services/UserService";
import { GLTeamService } from "../services/GLTeamService";
import QuarterPicker from "./QuarterPicker";
import "./LeadershipPage.css";

const LeadershipPage = ({ navigate }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [teamData, setTeamData] = useState({});
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState("hierarchy");
  const [currentUser, setCurrentUser] = useState(null);
  const [groupList, setGroupList] = useState([]);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);

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

  const loadTeamData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(
        "Loading leadership data for current user:",
        currentUser.email
      );

      const userGroupManager = currentUser.groupManager;

      if (!userGroupManager && !showAllGroups) {
        console.log("User is not assigned to any group");
        setTeamData({});
        setIsLoading(false);
        return;
      }

      if (showAllGroups) {
        // Remove fetch and API_CONFIG usage for all groups
        // If you have a GLTeamService or similar, use it here for all groups
        // Otherwise, skip or setTeamData({})
        setTeamData({});
        setIsLoading(false);
        return;
      }

      console.log(`User belongs to group managed by: ${userGroupManager}`);

      const members = await GLTeamService.getTeamMembersForUser(
        currentUser.email,
        userGroupManager
      );

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

      const emails = members.map((member) => member.email);

      // Use the new quarter-based allocations method
      const allocations = await GLTeamService.getTeamAllocationsByQuarter(
        emails,
        selectedQuarter,
        selectedYear
      );

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

        if (!allGroupsData[groupManager].studios[studio]) {
          allGroupsData[groupManager].studios[studio] = {
            members: [],
            totalHours: 0,
            scheduledHours: 0,
            directHours: 0,
            ptoHours: 0,
            overheadHours: 0,
            availableHours: 0, //new
          };
        }

        const memberAllocations = allocations.filter(
          (a) => a.email === member.email
        );

        const memberRows = memberAllocations.map((allocation) => ({
          projectNumber: allocation.proj_id || allocation.project_number || "",
          projectName: allocation.project_name || "",
          milestone: allocation.milestone_name || "",
          pm: allocation.project_manager || "",
          labor: parseFloat(allocation.contract_labor || allocation.labor || 0),
          pctLaborUsed:
            parseFloat(
              allocation.forecast_pm_labor || allocation.percentLaborUsed || 0
            ) * 100,
          hours: parseFloat(allocation.ra_hours || allocation.hours || 0),
          remarks: allocation.ra_remarks || allocation.remarks || "",
          availableHours: !!allocation.availableHours, //new
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
          .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);

        //check with team
        const totalHours =
          directHours + ptoHours + overheadHours + availableHours;

        allGroupsData[groupManager].studios[studio].members.push({
          id: member.id,
          name: member.name,
          email: member.email,
          laborCategory: member.labor_category || "",
          scheduledHours: scheduledHours,
          directHours,
          ptoHours,
          overheadHours,
          availableHours, //new
          totalHours,
          ratioB: calculateRatioB(directHours, scheduledHours, ptoHours),
          rows: memberRows,
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
  }, [currentUser, selectedGroup, showAllGroups, selectedQuarter, selectedYear]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    loadTeamData();
  }, [currentUser, selectedGroup, showAllGroups, loadTeamData]);

  const handleQuarterChange = (quarter, year) => {
    console.log("Quarter changed in LeadershipPage:", {
      quarter,
      year,
    });

    setSelectedQuarter(quarter);
    setSelectedYear(year);
  };

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

                <button
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
                </button>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {isLoading ? (
              <div className="loading-indicator">Loading team data...</div>
            ) : Object.keys(teamData).length === 0 ? (
              <div className="no-data-message">
                No data found for your group. You might not be assigned to a group
                yet.
              </div>
            ) : (
              <div className="group-summary">
                {viewMode === "hierarchy" ? (
                  <>
                    <div className="project-summary">
                      <div className="pm-dashboard-title">
                        Group Summary
                        <div className="month-selector">
                          {/* Month selector buttons */}
                          <button
                            className={`view-control-btn ${
                              selectedMonthIndex === 0 ? "active" : ""
                            }`}
                            onClick={() => setSelectedMonthIndex(0)}
                          >
                            January
                          </button>
                          <button
                            className={`view-control-btn ${
                              selectedMonthIndex === 1 ? "active" : ""
                            }`}
                            onClick={() => setSelectedMonthIndex(1)}
                          >
                            February
                          </button>
                          <button
                            className={`view-control-btn ${
                              selectedMonthIndex === 2 ? "active" : ""
                            }`}
                            onClick={() => setSelectedMonthIndex(2)}
                          >
                            March
                          </button>
                          {/* TODO: Implement functionality to filter data by selected month */}
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
                            <th>Ratio B</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(teamData).map(
                            ([manager, data], index) => (
                              <tr key={index}>
                                <td>{manager}</td>
                                <td className="number-cell">
                                  {data.memberCount}
                                </td>
                                <td className="number-cell">
                                  {formatter.format(data.scheduledHours)}
                                </td>
                                <td className="number-cell">
                                  {formatter.format(data.directHours)}
                                </td>
                                <td className="number-cell">
                                  {formatter.format(data.ptoHours)}
                                </td>
                                <td className="number-cell">
                                  {formatter.format(data.overheadHours)}
                                </td>
                                <td className="number-cell">
                                  {formatter.format(data.availableHours)}
                                </td>
                                <td className="number-cell">
                                  <strong>
                                    {formatter.format(data.totalHours)}
                                  </strong>
                                </td>
                                <td className="number-cell">
                                  <strong>{formatPercent(data.ratioB)}</strong>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>

                    {Object.entries(teamData).map(([manager, managerData]) => (
                      <div key={manager} className="manager-summary">
                        <div className="manager-header">
                          <h3>{manager}</h3>
                        </div>
                        <div className="manager-content">
                          <table className="details-table">
                            <thead>
                              <tr>
                                <th>Studio</th>
                                <th>Members</th>
                                <th>Scheduled Hours</th>
                                <th>Direct Hours</th>
                                <th>PTO/HOL</th>
                                <th>Indirect Hours</th>
                                <th>Available Hours</th>
                                <th>Total Hours</th>
                                <th>Ratio B</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(managerData.studios).map(
                                ([studio, studioData]) => (
                                  <tr key={studio}>
                                    <td>{studio}</td>
                                    <td className="number-cell">
                                      {studioData.members.length}
                                    </td>
                                    <td className="number-cell">
                                      {formatter.format(studioData.scheduledHours)}
                                    </td>
                                    <td className="number-cell">
                                      {formatter.format(studioData.directHours)}
                                    </td>
                                    <td className="number-cell">
                                      {formatter.format(studioData.ptoHours)}
                                    </td>
                                    <td className="number-cell">
                                      {formatter.format(studioData.overheadHours)}
                                    </td>
                                    <td className="number-cell">
                                      {formatter.format(studioData.availableHours)}
                                    </td>
                                    <td className="number-cell">
                                      <strong>
                                        {formatter.format(studioData.totalHours)}
                                      </strong>
                                    </td>
                                    <td className="number-cell">
                                      <strong>
                                        {formatPercent(studioData.ratioB)}
                                      </strong>
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="projects-view">
                    {/* Projects view content here */}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LeadershipPage;
