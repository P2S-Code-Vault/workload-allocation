import React, { useState, useEffect, useRef } from "react";
import { FaTrash } from "react-icons/fa";
import { ProjectDataService } from "../services/ProjectDataService";
import { ProjectSearchService } from "../services/ProjectSearchService";

const TableRow = ({
  row,
  index,
  updateRow,
  deleteRow,
  isLoading,
  currentUser,
  monthCol,
  month1Col,
  month2Col,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const dropdownRef = useRef(null);
  const projectInputRef = useRef(null);

  // Initialize the project search service
  useEffect(() => {
    ProjectSearchService.initialize().catch((err) =>
      console.error("Failed to initialize project search service:", err)
    );
  }, []);

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // Sync row.projectNumber to searchTerm when it changes externally
  useEffect(() => {
    if (row.projectNumber !== searchTerm) {
      setSearchTerm(row.projectNumber || "");
    }
  }, [row.projectNumber, searchTerm]);

  // Perform search when searchTerm changes (with debounce)
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2 || !userInteracted) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsSearching(true);
        setHasError(false);

        // Use the CSV-based search service
        const results = await ProjectSearchService.searchProjects(searchTerm);

        setSuggestions(results);
        // Only show dropdown if user has explicitly interacted with the field
        setShowDropdown(results.length > 0 && userInteracted);
        setIsSearching(false);
      } catch (error) {
        console.error("Search failed:", error);
        setSuggestions([]);
        setShowDropdown(false);
        setIsSearching(false);
        setHasError(true);
      }
    }, 300); // 300ms debounce for better responsiveness

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, userInteracted]);

  const handleProjectNumberChange = (e) => {
    const value = e.target.value;
    updateRow(index, "projectNumber", value);
    setSearchTerm(value);
    setUserInteracted(true);

    // Clear related fields when project number changes
    if (value !== row.projectNumber) {
      updateRow(index, "projectName", "");
      updateRow(index, "pm", "");
      updateRow(index, "labor", "");
      updateRow(index, "pctLaborUsed", "");
    }
  };

  // Modified to ensure dropdown only shows after explicit interaction
  const handleFocus = () => {
    if (searchTerm && searchTerm.length >= 2 && userInteracted) {
      setShowDropdown(suggestions.length > 0);
    }
  };

  const handleKeyPress = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (showDropdown && suggestions.length > 0) {
        // If dropdown is open and has suggestions, select the first one
        handleProjectSelect(suggestions[0]);
      } else if (searchTerm && searchTerm.length >= 2) {
        // Otherwise try to search for the term
        triggerSearch();
      }
    } else if (
      e.key === "ArrowDown" &&
      showDropdown &&
      suggestions.length > 0
    ) {
      // Navigate to the dropdown with arrow keys
      const dropdownItems =
        dropdownRef.current.querySelectorAll(".suggestion-item");
      if (dropdownItems.length > 0) {
        dropdownItems[0].focus();
      }
    }
  };

  const triggerSearch = async () => {
    if (!searchTerm || searchTerm.length < 2) return;

    try {
      setIsSearching(true);
      setHasError(false);

      try {
        // Search for projects that match the search term
        const results = await ProjectSearchService.searchProjects(searchTerm);

        if (results.length > 0) {
          // If we found results, select the first one
          handleProjectSelect(results[0]);        } else {
          // Try the API as backup if no results in CSV
          try {
            const project = await ProjectDataService.getProjectDetails(
              searchTerm
            );

            let pctLaborUsed = 0; // Default value

            // Try to get the latest EAC data from WorkloadPreloadService
            try {
              const { WorkloadPreloadService } = await import('../services/WorkloadPreloadService');
              const latestEAC = await WorkloadPreloadService.getProjectEAC(currentUser, project.project_number);
              
              // Use EAC from API if available
              if (latestEAC > 0) {
                pctLaborUsed = latestEAC;
                console.log(`Retrieved EAC from API for project ${project.project_number}: ${pctLaborUsed}%`);
              }
            } catch (eacError) {
              console.warn("Failed to retrieve latest EAC data for API project:", eacError);
            }

            updateRow(index, "projectNumber", project.project_number);
            updateRow(index, "projectName", project.project_name);
            updateRow(index, "pm", project.project_manager);
            updateRow(index, "labor", project.project_contract_labor);
            updateRow(index, "pctLaborUsed", pctLaborUsed); // Use the retrieved EAC or 0 if not found
          } catch (apiError) {
            console.error("Failed to find project in CSV or API:", apiError);
            setHasError(true);
          }
        }
      } catch (searchError) {
        console.error("Error searching for projects:", searchError);
        setHasError(true);
      }

      setIsSearching(false);
    } catch (error) {
      console.error("Failed to search for projects:", error);
      setIsSearching(false);
      setHasError(true);
    }
  };

  const handleProjectSelect = async (project) => {
    try {
      // Log the raw values for debugging
      console.log("CSV project data:", project);
      console.log("Raw Pct Labor Used:", project["Pct Labor Used"]);

      let pctLaborUsed = parseFloat(project["Pct Labor Used"]) || 0;
      console.log("Parsed pctLaborUsed from CSV:", pctLaborUsed);

      // Try to get the latest EAC data from WorkloadPreloadService
      try {
        const { WorkloadPreloadService } = await import('../services/WorkloadPreloadService');
        const latestEAC = await WorkloadPreloadService.getProjectEAC(currentUser, project["Project Number"]);
        
        // Use EAC from API if available, otherwise fall back to CSV data
        if (latestEAC > 0) {
          pctLaborUsed = latestEAC;
          console.log(`Updated EAC from API for project ${project["Project Number"]}: ${pctLaborUsed}%`);
        }
      } catch (eacError) {
        console.warn("Failed to retrieve latest EAC data, using CSV value:", eacError);
      }

      // Update with the selected project data
      updateRow(index, "projectNumber", project["Project Number"]);
      updateRow(index, "projectName", project["Project Name"]);
      updateRow(index, "pm", project["PM"]);
      updateRow(index, "labor", project["Labor"]);
      updateRow(index, "pctLaborUsed", pctLaborUsed); // Use the updated value

      // Store the complete project data in the row for use during save
      updateRow(index, "_projectData", project);

      setShowDropdown(false);
      setHasError(false);
    } catch (error) {
      console.error("Failed to select project:", error);
      setHasError(true);
    }
  };

  // const handleProjectSelect = async (project) => {
  //   try {
  //     // Log the raw values
  //     console.log("CSV project data:", project);
  //     console.log("Raw Pct Labor Used:", project['Pct Labor Used']);

  //     // Parse the percentage value properly
  //     const pctLaborUsed = parseFloat(project['Pct Labor Used']) || 0;
  //     console.log("Parsed pctLaborUsed:", pctLaborUsed);

  //     // Update with the selected project data
  //     updateRow(index, 'projectNumber', project['Project Number']);
  //     updateRow(index, 'projectName', project['Project Name']);
  //     updateRow(index, 'milestone', project['Milestone']);
  //     updateRow(index, 'pm', project['PM']);
  //     updateRow(index, 'labor', project['Labor']);
  //     updateRow(index, 'pctLaborUsed', pctLaborUsed); // Use the parsed value

  //     // Store the complete project data in the row for use during save
  //     updateRow(index, '_projectData', project);

  //     setShowDropdown(false);
  //     setHasError(false);
  //   } catch (error) {
  //     console.error('Failed to select project:', error);
  //     setHasError(true);
  //   }
  // };

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // const percentFormatter = (value) => {
  //   // Add debugging
  //   console.log("Formatting percentage value:", value, "Type:", typeof value);

  //   // Convert to number and handle invalid values
  //   const numValue = parseFloat(value) || 0;

  //   if (numValue >= 100 && numValue % 100 === 0) {
  //     // Assuming these are stored as 1000 for 10%
  //     return new Intl.NumberFormat('en-US', {
  //       style: 'percent',
  //       minimumFractionDigits: 1,
  //       maximumFractionDigits: 1,
  //     }).format(numValue / 10000); // Divide by 10000 to get to decimal form (0.1)
  //   } else {
  //     // Normal case for smaller values
  //     return new Intl.NumberFormat('en-US', {
  //       style: 'percent',
  //       minimumFractionDigits: 1,
  //       maximumFractionDigits: 1,
  //     }).format(numValue / 100);
  //   }
  // };
  const percentFormatter = (value) => {
    // Add debugging
    // console.log("Formatting percentage value:", value, "Type:", typeof value);

    // Convert to number and handle invalid values
    const numValue = parseFloat(value) || 0;
    // console.log("Parsed percentage value:", numValue);

    // Case 1: Values like 9639 (should be 96.39%)
    if (numValue > 100 && numValue % 1 === 0) {
      return new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numValue / 10000);
    }
    // Case 2: Values like 78 (should be 78.00%)
    else if (numValue >= 1 && numValue <= 100) {
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

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;

    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();

    // If this text doesn't contain the query, don't highlight anything
    if (!textLower.includes(queryLower)) return text;

    const index = textLower.indexOf(queryLower);

    return (
      <>
        {text.substring(0, index)}
        <span className="highlight">
          {text.substring(index, index + query.length)}
        </span>
        {text.substring(index + query.length)}
      </>
    );
  };

  return (
    <tr className={hasError ? "row-error" : ""}>
      <td className="project-number-cell">
        <div className="dropdown-container" ref={dropdownRef}>
          <div className="search-input-container">
            <input
              type="text"
              value={searchTerm}
              onChange={handleProjectNumberChange}
              onKeyDown={handleKeyPress}
              onFocus={handleFocus}
              onClick={() => setUserInteracted(true)}
              placeholder={
                isLoading
                  ? "Loading..."
                  : "Search by project number or name..."
              }
              disabled={isLoading}
              ref={projectInputRef}
              className={hasError ? "input-error" : ""}
              autoComplete="off"
            />
          </div>
          {isSearching && <div className="search-indicator">Searching...</div>}
          {hasError && <div className="search-error">Project not found</div>}
          {showDropdown && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((project, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  onClick={() => handleProjectSelect(project)}
                  tabIndex="0"
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleProjectSelect(project)
                  }
                >
                  <div className="suggestion-project-name">
                    {highlightMatch(project["Project Name"], searchTerm)}
                  </div>
                  <div className="suggestion-project-number">
                    {highlightMatch(project["Project Number"], searchTerm)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </td>
      <td>
        <input
          type="text"
          value={
            row.projectNumber?.startsWith("0000-0000")
              ? row.projectName || ""
              : row.projectNumber
              ? `${row.projectNumber} - ${row.projectName || ""}`
              : ""
          }
          readOnly
        />      </td>
      <td>
        <input
          type="text"
          value={
            row.projectNumber?.startsWith("0000-0000")
              ? (row.pm ? row.pm : "-")
              : row.pm || ""
          }
          readOnly
          className="centered-input"
        />
      </td>
      <td>
        <input
          type="text"
          value={
            row.projectNumber?.startsWith("0000-0000")
              ? (row.labor && row.labor > 0 ? formatter.format(row.labor) : "-")
              : row.labor && row.labor > 0
              ? formatter.format(row.labor)
              : "$0"
          }
          readOnly
          className="centered-input"
        />
      </td>
      <td>
        <input
          type="text"
          value={
            row.projectNumber?.startsWith("0000-0000")
              ? (row.pctLaborUsed ? percentFormatter(row.pctLaborUsed) : "-")
              : row.pctLaborUsed
              ? percentFormatter(row.pctLaborUsed)
              : "0%"
          }
          readOnly
          className="centered-input"
        />
      </td>
      {/* Month columns for hours */}
      <td style={{ width: "110px" }}>
        <input
          type="number"
          value={row.month || ""}
          onChange={(e) => updateRow(index, "month", e.target.value)}
          min="0"
          step="0.5"
          placeholder="0"
          disabled={isLoading}
        />
      </td>
      <td style={{ width: "110px" }}>
        <input
          type="number"
          value={row.month1 || ""}
          onChange={(e) => updateRow(index, "month1", e.target.value)}
          min="0"
          step="0.5"
          placeholder="0"
          disabled={isLoading}
        />
      </td>
      <td style={{ width: "110px" }}>
        <input
          type="number"
          value={row.month2 || ""}
          onChange={(e) => updateRow(index, "month2", e.target.value)}
          min="0"
          step="0.5"
          placeholder="0"
          disabled={isLoading}
        />
      </td>
      <td>
        <input
          type="text"
          value={row.remarks || ""}
          onChange={(e) => updateRow(index, "remarks", e.target.value)}
          placeholder="Add remarks..."
        />
      </td>
      <td>
        <button
          onClick={() => deleteRow(index)}
          className="delete-btn"
          type="button"
        >
          <FaTrash />
        </button>
      </td>
    </tr>
  );
};

export default TableRow;
