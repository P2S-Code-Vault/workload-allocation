import React, { useState, useEffect, useRef } from "react";
import QuarterPicker from "./QuarterPicker";
import { format } from "date-fns";
import PMDashboardService from "../services/PMDashboardService";
import { ProjectDataService } from "../services/ProjectDataService";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

// CollapsibleProject component for individual project display
const CollapsibleProject = ({
  project,
  formatNumber,
  formatCurrency,
  formatPercent,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="pm-group">
      <div
        className="collapsible-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
        <h3>
          {project.name} - MS{" "}
          {project.projectNumber
            ? project.projectNumber.split("-").pop() || project.projectNumber
            : "N/A"}
        </h3>
        <div className="project-info">
          <span>Contract Labor: {formatCurrency(project.labor)}</span>
          <span>Total Hours: {formatNumber(project.totalHours)}</span>
          <span>Forecasted Cost: {formatCurrency(project.totalCost)}</span>
          <span>% EAC Labor Used: {formatPercent(project.laborUsed)}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="collapsible-content pm-projects">
          <table className="summary-table resource-details">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Labor Grade</th>
                <th>Planned Hours</th>
              </tr>
            </thead>
            <tbody>
              {project.resources &&
                project.resources.map((resource, index) => (
                  <tr key={index}>
                    <td>{resource.name}</td>
                    <td>{resource.laborCategory}</td>
                    <td className="number-cell">
                      {formatNumber(resource.hours)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const PMSelector = ({
  onPMChange,
  selectedPM,
  projectManagers = [],
  showAllMilestones,
  onToggleAllMilestones,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Log available PMs for debugging
  useEffect(() => {
    if (projectManagers && projectManagers.length > 0) {
      console.log("Available Project Managers:", projectManagers);

      // Check for any PMs with leading/trailing spaces
      const pmsWithSpaces = projectManagers.filter((pm) => pm !== pm.trim());
      if (pmsWithSpaces.length > 0) {
        console.warn("PMs with leading/trailing spaces:", pmsWithSpaces);
      }
    }

    if (selectedPM) {
      console.log("Currently selected PM:", selectedPM);
    }
  }, [projectManagers, selectedPM]);

  const filteredPMs = searchTerm
    ? projectManagers.filter((pm) =>
        pm.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : projectManagers;

  const handlePMSelection = (pm) => {
    // Always trim the PM name to ensure consistent API requests
    const trimmedPM = pm.trim();
    console.log(`PM selected: "${pm}"`);
    console.log(`Trimmed PM name: "${trimmedPM}"`);

    // Log character codes for debugging
    const charCodes = [];
    for (let i = 0; i < trimmedPM.length; i++) {
      charCodes.push(`${i}: '${trimmedPM[i]}' = ${trimmedPM.charCodeAt(i)}`);
    }
    console.log("PM name character codes:");
    console.log(charCodes.join("\n"));

    // Use the trimmed PM name
    onPMChange(trimmedPM);
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    console.log("Clearing PM selection");
    onPMChange("");
    setShowDropdown(false);
  };

  return (
    <div className="user-selector">
      <div className="user-selector-container" ref={dropdownRef}>
        <div
          className="user-info-container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span className="user-label">Filter by PM:</span>
            <strong className="user-name" style={{ marginRight: "10px" }}>
              {selectedPM || "All Projects"}
            </strong>
            <button
              className="team-dropdown-btn"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              Select Project Manager
            </button>
          </div>
          <div
            className="toggle-container"
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              paddingRight: "15px",
            }}
          >
            <span style={{ marginRight: "8px", fontSize: "14px" }}>
              All Milestones
            </span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={showAllMilestones}
                onChange={() => onToggleAllMilestones(!showAllMilestones)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {showDropdown && (
          <div className="user-dropdown pm-dashboard-dropdown">
            <input
              type="text"
              placeholder="Search project manager..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="user-search"
              autoFocus
            />

            <ul className="user-list">
              <li onClick={handleClearSelection} className="user-list-item">
                <div className="user-name">Show All Projects</div>
              </li>
              {filteredPMs.map((pm, index) => (
                <li
                  key={index}
                  onClick={() => handlePMSelection(pm)}
                  className={`user-list-item ${
                    selectedPM === pm ? "selected" : ""
                  }`}
                >
                  <div className="user-name">{pm}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// New function to group projects by project manager
const groupProjectsByPM = (projects) => {
  const grouped = {};

  projects.forEach((project) => {
    const pm = project.pm || "Unassigned";

    if (!grouped[pm]) {
      grouped[pm] = {
        projects: [],
        totalLabor: 0,
        totalHours: 0,
        totalCost: 0,
      };
    }

    grouped[pm].projects.push(project);
    grouped[pm].totalLabor += project.labor || 0;
    grouped[pm].totalHours += project.totalHours || 0;
    grouped[pm].totalCost += project.totalCost || 0;
  });

  return grouped;
};

// Collapsible PM Group component to display each PM and their projects
const CollapsiblePMGroup = ({
  pmName,
  pmData,
  formatNumber,
  formatCurrency,
  formatPercent,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="pm-group">
      <div
        className="collapsible-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
        <h3>{pmName}</h3>
        <div className="project-info">
          <span>Projects: {pmData.projects.length}</span>
          <span>Total Contract Labor: {formatCurrency(pmData.totalLabor)}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="collapsible-content">
          {pmData.projects.map((project) => (
            <CollapsibleProject
              key={project.projectNumber}
              project={project}
              formatNumber={formatNumber}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main PM Page Component
const PMPage = (props) => {
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dashboardData, setDashboardData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPM, setSelectedPM] = useState("");
  const [projectManagers, setProjectManagers] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const [showAllMilestones, setShowAllMilestones] = useState(false);

  // Format functions
  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value) => {
    // Add debugging
    console.log("Formatting percentage value:", value, "Type:", typeof value);

    // Convert to number and handle invalid values
    const numValue = parseFloat(value) || 0;
    console.log("Parsed percentage value:", numValue);

    // Case 1: Values like 9639 (should be 96.39%)
    if (numValue > 100 && numValue % 1 === 0) {
      return new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numValue / 10000);
    } else if (numValue >= 1 && numValue <= 100) {
      return new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numValue / 100);
    }
    // Case 3: Values like 0.78 (already in decimal form, should be 78.00%)
    else if (numValue > 0 && numValue < 1) {
      return new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numValue);
    }
    // Default case: just format as percentage with 2 decimal places
    else {
      return new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numValue / 100);
    }
  };
  // const formatPercent = (value) => {
  //   // Convert to number and handle invalid values
  //   const numValue = parseFloat(value) || 0;

  //   // Check if the value is already scaled to represent percentage directly
  //   if (numValue >= 100 && numValue % 100 === 0) {
  //     return new Intl.NumberFormat('en-US', {
  //       style: 'percent',
  //       minimumFractionDigits: 1,
  //       maximumFractionDigits: 1,
  //     }).format(numValue / 10000);
  //   } else {
  //     return new Intl.NumberFormat('en-US', {
  //       style: 'percent',
  //       minimumFractionDigits: 1,
  //       maximumFractionDigits: 1,
  //     }).format(numValue / 100);
  //   }
  // };

  // Load project managers on component mount
  useEffect(() => {
    const loadProjectManagers = async () => {
      try {
        const managers = await PMDashboardService.getAllProjectManagers();
        console.log("Loaded project managers:", managers);
        setProjectManagers(managers);
      } catch (err) {
        console.error("Error loading project managers:", err);
        setError(
          "Failed to load project managers. Please try refreshing the page."
        );
      }
    };

    loadProjectManagers();
  }, []);

  // Debug data state changes
  useEffect(() => {
    console.log("Dashboard data in state:", dashboardData);
    console.log(
      `Project count in state: ${
        dashboardData.projects ? dashboardData.projects.length : 0
      }`
    );
  }, [dashboardData]);

  // Handle retry button click
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setRetryCount(retryCount + 1);
  };

  // Load dashboard data when quarter/year or selected PM changes
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      setError(null);

      console.log("Loading dashboard data:", {
        selectedYear,
        selectedQuarter,
        selectedPM: selectedPM || "All Projects",
        showAllMilestones,
      });

      try {
        const data = await PMDashboardService.getPMDashboardDataByQuarter(
          selectedYear,
          selectedQuarter,
          selectedPM || null,
          showAllMilestones
        );

        console.log("Dashboard data received in component:", data);
        console.log(
          `Projects count: ${data.projects ? data.projects.length : 0}`
        );

        // Verify data structure before setting state
        if (!data || !data.projects) {
          console.error("Received invalid data structure:", data);
          setError("Data received from server has an unexpected format");
          setDashboardData({ projects: [], summary: {} });
        } else {
          // Force state update with a new object reference
          setDashboardData({ ...data });
          console.log("State updated with dashboard data");
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setError(
          "Failed to load project data. " +
            (err.message || "Please try again later.")
        );
        setDashboardData({ projects: [], summary: {} });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedQuarter, selectedYear, selectedPM, retryCount, showAllMilestones]);

  // Month column headers
  const getQuarterMonths = (quarter) => {
    const defaultQuarterMonths = {
      1: [0, 1, 2],
      2: [3, 4, 5],
      3: [6, 7, 8],
      4: [9, 10, 11],
    };
    return defaultQuarterMonths[quarter] || [0, 1, 2];
  };

  const getMonthNames = () => {
    if (!selectedQuarter || !selectedYear) return ["", "", ""];
    const months = getQuarterMonths(selectedQuarter);
    return months.map((m) =>
      format(new Date(selectedYear, m, 1), "MMMM yyyy")
    );
  };
  const [monthCol, month1Col, month2Col] = getMonthNames();

  return (
    <main className="main-content">
      <div className="content-wrapper">
        <div className="table-container">
          <QuarterPicker
            onQuarterChange={(q, y) => {
              setSelectedQuarter(q);
              setSelectedYear(y);
            }}
            initialYear={selectedYear}
            initialQuarter={selectedQuarter}
          />
          <PMSelector
            onPMChange={setSelectedPM}
            selectedPM={selectedPM}
            projectManagers={projectManagers.map((pm) => pm.name || "")}
            showAllMilestones={showAllMilestones}
            onToggleAllMilestones={setShowAllMilestones}
          />
          <div className="pm-dashboard">
            <div className="pm-dashboard-title">Project Planning Summary</div>

            {/* Debug information - remove in production */}
            <div
              style={{
                padding: "5px 10px",
                margin: "5px 0",
                backgroundColor: "#f0f0f0",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              <div>
                <strong>Debug Info:</strong>
              </div>
              <div>Selected PM: {selectedPM || "All Projects"}</div>
              <div>Show All Milestones: {showAllMilestones ? "Yes" : "No"}</div>
              <div>
                Data Status: {isLoading ? "Loading" : error ? "Error" : "Ready"}
              </div>
              <div>
                Projects Count:{" "}
                {dashboardData.projects ? dashboardData.projects.length : 0}
              </div>
            </div>

            {/* Error display with retry button */}
            {error && (
              <div className="error-banner">
                <p>{error}</p>
                <button className="retry-button" onClick={handleRetry}>
                  Retry
                </button>
              </div>
            )}

            {isLoading ? (
              <div className="loading">Loading summary data...</div>
            ) : dashboardData.projects && dashboardData.projects.length > 0 ? (
              // When filtering by a specific PM, just show their projects
              selectedPM ? (
                <div className="pm-groups">
                  {dashboardData.projects.map((project) => (
                    <CollapsibleProject
                      key={project.projectNumber}
                      project={project}
                      formatNumber={formatNumber}
                      formatCurrency={formatCurrency}
                      formatPercent={formatPercent}
                    />
                  ))}
                </div>
              ) : (
                // When showing all projects, group by PM
                <div className="pm-groups">
                  {Object.entries(groupProjectsByPM(dashboardData.projects))
                    .sort(([pmA], [pmB]) => pmA.localeCompare(pmB))
                    .map(([pmName, pmData]) => (
                      <CollapsiblePMGroup
                        key={pmName}
                        pmName={pmName}
                        pmData={pmData}
                        formatNumber={formatNumber}
                        formatCurrency={formatCurrency}
                        formatPercent={formatPercent}
                      />
                    ))}
                </div>
              )
            ) : (
              // Show "no projects found" message when data array is empty
              <div className="no-data">
                {selectedPM
                  ? `No projects found for ${selectedPM} in the selected date range.`
                  : "No projects found for the selected date range."}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default PMPage;
