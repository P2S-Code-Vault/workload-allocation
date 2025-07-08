import React, { useState, useEffect, useRef } from "react";
import QuarterPicker from "./QuarterPicker";
import PMDashboardService from "../services/PMDashboardService";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import { getCurrentQuarterString, getCurrentYear, getQuarterMonthNamesShort } from "../utils/dateUtils";

// CollapsibleProject component for individual project/opportunity display
const CollapsibleProject = ({
  project,
  formatNumber,
  formatCurrency,
  formatPercent,
  selectedQuarter,
  activeView = "projects",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get month names for the selected quarter
  const getMonthNames = () => {
    const quarterNum = parseInt(selectedQuarter.replace('Q', ''));
    return getQuarterMonthNamesShort(quarterNum);
  };

  const monthNames = getMonthNames();

  // Get appropriate labels and values based on view type
  const isOpportunity = activeView === "opportunities";
  const itemNumber = isOpportunity ? project.opportunityNumber : project.projectNumber;
  const contractLabel = isOpportunity ? "Estimated Fee" : "Contract Labor";
  const contractValue = isOpportunity ? project.estimatedFee : project.labor;
  const usageLabel = isOpportunity ? "Probability" : "% EAC Labor Used";
  const usageValue = isOpportunity ? project.probability : project.laborUsed;

  return (
    <div className="pm-group">
      <div
        className="collapsible-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
        <h3>
          {project.name} - {isOpportunity ? "OP" : "MS"}{" "}
          {itemNumber
            ? itemNumber.split("-").pop() || itemNumber
            : "N/A"}
        </h3>
        <div className="project-info">
          <span>{contractLabel}: {formatCurrency(contractValue)}</span>
          <span>Total Hours: {formatNumber(project.totalHours)}</span>
          <span>Forecasted Cost: {formatCurrency(project.totalCost)}</span>
          <span>{usageLabel}: {isOpportunity ? `${usageValue}%` : formatPercent(usageValue)}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="collapsible-content pm-projects">
          <table className="summary-table resource-details">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Labor Grade</th>
                <th>{monthNames[0]}</th>
                <th>{monthNames[1]}</th>
                <th>{monthNames[2]}</th>
                <th>Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {project.resources &&
                project.resources.map((resource, index) => (
                  <tr key={index}>
                    <td>{resource.name}</td>
                    <td>{resource.laborCategory}</td>
                    <td className="number-cell">
                      {formatNumber(resource.month1Hours || 0)}
                    </td>
                    <td className="number-cell">
                      {formatNumber(resource.month2Hours || 0)}
                    </td>
                    <td className="number-cell">
                      {formatNumber(resource.month3Hours || 0)}
                    </td>
                    <td className="number-cell">
                      {formatNumber(resource.totalHours || 0)}
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
  showAllItems,
  onToggleAllItems,
  activeView = "projects",
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Dynamic labels based on view
  const managerLabel = activeView === "projects" ? "PM" : "Champion";
  const allItemsLabel = activeView === "projects" ? "All Projects" : "All Opportunities";
  const selectLabel = activeView === "projects" ? "Select Project Manager" : "Select Opportunity Champion";
  const searchPlaceholder = activeView === "projects" ? "Search project manager..." : "Search opportunity champion...";
  const showAllLabel = activeView === "projects" ? "Show All Projects" : "Show All Opportunities";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Log available PMs/Champions for debugging
  useEffect(() => {
    console.log(`=== PMSelector Debug (${activeView}) ===`);
    console.log("projectManagers prop:", projectManagers);
    console.log("projectManagers length:", projectManagers?.length || 0);
    
    if (projectManagers && projectManagers.length > 0) {
      console.log(`Available ${activeView === "projects" ? "Project Managers" : "Opportunity Champions"}:`, projectManagers);

      // Check for any entries with leading/trailing spaces
      const entriesWithSpaces = projectManagers.filter((entry) => entry !== entry.trim());
      if (entriesWithSpaces.length > 0) {
        console.warn(`${activeView === "projects" ? "PMs" : "Champions"} with leading/trailing spaces:`, entriesWithSpaces);
      }
    } else {
      console.warn(`No ${activeView === "projects" ? "project managers" : "opportunity champions"} available in dropdown`);
    }

    if (selectedPM) {
      console.log(`Currently selected ${activeView === "projects" ? "PM" : "Champion"}:`, selectedPM);
    }
  }, [projectManagers, selectedPM, activeView]);

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
            <span className="user-label">Filter by {managerLabel}:</span>
            <strong className="user-name" style={{ marginRight: "10px" }}>
              {selectedPM || allItemsLabel}
            </strong>
            <button
              className="team-dropdown-btn"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {selectLabel}
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
              {allItemsLabel}
            </span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={showAllItems}
                onChange={() => onToggleAllItems(!showAllItems)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {showDropdown && (
          <div className="user-dropdown pm-dashboard-dropdown">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="user-search"
              autoFocus
            />

            <ul className="user-list">
              <li onClick={handleClearSelection} className="user-list-item">
                <div className="user-name">{showAllLabel}</div>
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

// New function to group projects by project manager or opportunities by champion
const groupProjectsByPM = (projects, activeView = "projects") => {
  const grouped = {};

  projects.forEach((project) => {
    // Use pm for projects, proposalChampion for opportunities (with fallback to pm for transformed data)
    const manager = activeView === "opportunities" 
      ? (project.proposalChampion || project.pm || "Unassigned")
      : (project.pm || "Unassigned");

    if (!grouped[manager]) {
      grouped[manager] = {
        projects: [],
        totalLabor: 0,
        totalHours: 0,
        totalCost: 0,
      };
    }

    grouped[manager].projects.push(project);
    // Use appropriate field based on view type
    grouped[manager].totalLabor += (activeView === "opportunities" ? project.estimatedFee : project.labor) || 0;
    grouped[manager].totalHours += project.totalHours || 0;
    grouped[manager].totalCost += project.totalCost || 0;
  });

  return grouped;
};

// Collapsible PM Group component to display each PM/Champion and their projects/opportunities
const CollapsiblePMGroup = ({
  pmName,
  pmData,
  formatNumber,
  formatCurrency,
  formatPercent,
  selectedQuarter,
  activeView = "projects",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const itemsLabel = activeView === "opportunities" ? "Opportunities" : "Projects";
  const contractLabel = activeView === "opportunities" ? "Total Estimated Fees" : "Total Contract Labor";
  
  // Display name for PM/Champion - show "Unassigned" if no allocations
  const displayName = pmName === "Unassigned" || !pmName || pmName.trim() === "" ? "Unassigned" : pmName;

  return (
    <div className="pm-group">
      <div
        className="collapsible-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
        <h3>{displayName}</h3>
        <div className="project-info">
          <span>{itemsLabel}: {pmData.projects.length}</span>
          <span>{contractLabel}: {formatCurrency(pmData.totalLabor)}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="collapsible-content">
          {pmData.projects.map((project) => (
            <CollapsibleProject
              key={project.projectNumber || project.opportunityNumber}
              project={project}
              formatNumber={formatNumber}
              formatCurrency={formatCurrency}
              formatPercent={formatPercent}
              selectedQuarter={selectedQuarter}
              activeView={activeView}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main PM Page Component
const PMPage = (props) => {
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarterString());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [dashboardData, setDashboardData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPM, setSelectedPM] = useState("");
  const [projectManagers, setProjectManagers] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const [showAllItems, setShowAllItems] = useState(false);
  const [activeView, setActiveView] = useState("projects"); // "projects" or "opportunities"

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

  // Load project managers or opportunity champions based on active view
  useEffect(() => {
    const loadManagers = async () => {
      try {
        let managers;
        if (activeView === "projects") {
          managers = await PMDashboardService.getAllProjectManagers();
          console.log("Loaded project managers:", managers);
        } else {
          managers = await PMDashboardService.getAllOpportunityChampions();
          console.log("Loaded opportunity champions:", managers);
        }
        setProjectManagers(managers);
      } catch (err) {
        console.error(`Error loading ${activeView === "projects" ? "project managers" : "opportunity champions"}:`, err);
        setError(
          `Failed to load ${activeView === "projects" ? "project managers" : "opportunity champions"}. Please try refreshing the page.`
        );
      }
    };

    loadManagers();
    // Reset selected manager when switching views
    setSelectedPM("");
  }, [activeView]);

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

      const viewType = activeView === "projects" ? "Projects" : "Opportunities";
      const managerType = activeView === "projects" ? selectedPM : selectedPM; // Could be PM or Champion

      console.log(`Loading ${viewType.toLowerCase()} dashboard data:`, {
        selectedYear,
        selectedQuarter,
        selectedManager: managerType || `All ${viewType}`,
        showAllItems,
        activeView,
      });

      try {
        let data;
        
        // Check if "All Items" toggle is enabled
        if (showAllItems) {
          if (activeView === "projects") {
            data = await PMDashboardService.getAllProjectsWithMilestones();
          } else {
            data = await PMDashboardService.getAllOpportunities();
          }
        } else {
          // Use regular quarterly data
          if (activeView === "projects") {
            data = await PMDashboardService.getPMDashboardDataByQuarter(
              selectedYear,
              selectedQuarter,
              selectedPM || null,
              false // No longer using showAllMilestones
            );
          } else {
            data = await PMDashboardService.getOpportunitiesDashboardDataByQuarter(
              selectedYear,
              selectedQuarter,
              selectedPM || null, // This will be the champion name
              false // No longer using showAllMilestones
            );
          }
        }

        console.log(`${viewType} dashboard data received in component:`, data);
        console.log(
          `${viewType} count: ${data.projects ? data.projects.length : 0}`
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
  }, [selectedQuarter, selectedYear, selectedPM, retryCount, showAllItems, activeView]);

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
          
          {/* View Toggle Buttons */}
          <div className="view-toggle-container" style={{ 
            display: 'flex', 
            gap: '10px', 
            margin: '10px 0',
            justifyContent: 'center'
          }}>
            <button
              className={`view-toggle-btn ${activeView === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveView('projects')}
              style={{
                padding: '8px 16px',
                border: '2px solid var(--primary-color)',
                borderRadius: '4px',
                backgroundColor: activeView === 'projects' ? 'var(--primary-color)' : 'transparent',
                color: activeView === 'projects' ? 'white' : 'var(--primary-color)',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              Projects
            </button>
            <button
              className={`view-toggle-btn ${activeView === 'opportunities' ? 'active' : ''}`}
              onClick={() => setActiveView('opportunities')}
              style={{
                padding: '8px 16px',
                border: '2px solid var(--primary-color)',
                borderRadius: '4px',
                backgroundColor: activeView === 'opportunities' ? 'var(--primary-color)' : 'transparent',
                color: activeView === 'opportunities' ? 'white' : 'var(--primary-color)',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              Opportunities
            </button>
          </div>
          
          <PMSelector
            onPMChange={setSelectedPM}
            selectedPM={selectedPM}
            projectManagers={projectManagers}
            showAllItems={showAllItems}
            onToggleAllItems={setShowAllItems}
            activeView={activeView}
          />
          <div className="pm-dashboard">
            <div className="pm-dashboard-title">
              {activeView === "projects" ? "Project Planning Summary" : "Opportunity Planning Summary"}
            </div>

            {/* Debug information - remove in production */}
            {/*
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
              <div>Active View: {activeView}</div>
              <div>Selected {activeView === "projects" ? "PM" : "Champion"}: {selectedPM || (activeView === "projects" ? "All Projects" : "All Opportunities")}</div>
              <div>Show All {activeView === "projects" ? "Projects" : "Opportunities"}: {showAllItems ? "Yes" : "No"}</div>
              <div>
                Data Status: {isLoading ? "Loading" : error ? "Error" : "Ready"}
              </div>
              <div>
                {activeView === "projects" ? "Projects" : "Opportunities"} Count:{" "}
                {dashboardData.projects ? dashboardData.projects.length : 0}
              </div>
            </div>
            */}

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
              // When filtering by a specific PM/Champion, just show their projects/opportunities
              selectedPM ? (
                <div className="pm-groups">
                  {dashboardData.projects.map((project) => (
                    <CollapsibleProject
                      key={project.projectNumber || project.opportunityNumber}
                      project={project}
                      formatNumber={formatNumber}
                      formatCurrency={formatCurrency}
                      formatPercent={formatPercent}
                      selectedQuarter={selectedQuarter}
                      activeView={activeView}
                    />
                  ))}
                </div>
              ) : (
                // When showing all projects/opportunities, group by PM/Champion
                <div className="pm-groups">
                  {Object.entries(groupProjectsByPM(dashboardData.projects, activeView))
                    .sort(([pmA], [pmB]) => pmA.localeCompare(pmB))
                    .map(([pmName, pmData]) => (
                      <CollapsiblePMGroup
                        key={pmName}
                        pmName={pmName}
                        pmData={pmData}
                        formatNumber={formatNumber}
                        formatCurrency={formatCurrency}
                        formatPercent={formatPercent}
                        selectedQuarter={selectedQuarter}
                        activeView={activeView}
                      />
                    ))}
                </div>
              )
            ) : (
              // Show "no items found" message when data array is empty
              <div className="no-data">
                {selectedPM
                  ? `No ${activeView} found for ${selectedPM} in the selected date range.`
                  : `No ${activeView} found for the selected date range.`}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default PMPage;
