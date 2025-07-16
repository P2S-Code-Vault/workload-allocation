import React, { useState, useEffect, useRef } from "react";
import { FaTrash } from "react-icons/fa";
import { ProjectSearchService } from "../services/ProjectSearchService";
import { formatCurrency } from "../utils/rateUtils";
import "./TableRow.css";

const OpportunityRow = ({
  row,
  index,
  updateOpportunityRow,
  deleteOpportunityRow,
  isLoading
}) => {  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    ProjectSearchService.initializeOpportunities().catch((err) =>
      console.error("Failed to initialize opportunity search service:", err)
    );
  }, []);

  useEffect(() => {
    if (row.opportunityNumber !== searchTerm) {
      setSearchTerm(row.opportunityNumber || "");
    }
  }, [row.opportunityNumber, searchTerm]);

  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2 || !userInteracted) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    console.log("[OpportunityRow] useEffect running, searchTerm:", searchTerm, "userInteracted:", userInteracted);
    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsSearching(true);
        setHasError(false);
        console.log("[OpportunityRow] Calling ProjectSearchService.searchOpportunities with:", searchTerm);
        const results = await ProjectSearchService.searchOpportunities(searchTerm);
        setSuggestions(results);
        setShowDropdown(results.length > 0 && userInteracted);
        setIsSearching(false);
      } catch (error) {
        setSuggestions([]);
        setShowDropdown(false);
        setIsSearching(false);
        setHasError(true);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, userInteracted]);
  const handleOpportunityNumberChange = (e) => {
    const value = e.target.value;
    console.log("[OpportunityRow] handleOpportunityNumberChange called with value:", value);
    updateOpportunityRow(index, "opportunityNumber", value);
    setSearchTerm(value);
    setUserInteracted(true);
    if (value !== row.opportunityNumber) {
      updateOpportunityRow(index, "opportunityName", "");
      updateOpportunityRow(index, "proposalChampion", "");
    }
  };

  const handleFocus = () => {
    if (searchTerm && searchTerm.length >= 2 && userInteracted) {
      setShowDropdown(suggestions.length > 0);
    }
  };

  const handleKeyPress = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showDropdown && suggestions.length > 0) {
        handleOpportunitySelect(suggestions[0]);
      } else if (searchTerm && searchTerm.length >= 2) {
        // Try to find exact match when Enter is pressed
        triggerOpportunitySearch();
      }
    } else if (
      e.key === "ArrowDown" &&
      showDropdown &&
      suggestions.length > 0
    ) {
      const dropdownItems = dropdownRef.current.querySelectorAll(".suggestion-item");
      if (dropdownItems.length > 0) {
        dropdownItems[0].focus();
      }
    }
  };

  const triggerOpportunitySearch = async () => {
    if (!searchTerm || searchTerm.length < 2) return;

    try {
      setIsSearching(true);
      setHasError(false);

      try {
        // Search for opportunities that match the search term
        const results = await ProjectSearchService.searchOpportunities(searchTerm);

        if (results.length > 0) {
          // If we found results, select the first one
          handleOpportunitySelect(results[0]);
        } else {
          // Try to get exact match by opportunity number as fallback
          try {
            const opportunity = await ProjectSearchService.getOpportunityDetails(searchTerm);
            
            if (opportunity) {
              handleOpportunitySelect(opportunity);
            } else {
              console.error("Failed to find opportunity in search or direct lookup");
              setHasError(true);
            }
          } catch (directSearchError) {
            console.error("Failed to find opportunity in search or direct lookup:", directSearchError);
            setHasError(true);
          }
        }
      } catch (searchError) {
        console.error("Error searching for opportunities:", searchError);
        setHasError(true);
      }

      setIsSearching(false);
    } catch (error) {
      console.error("Failed to search for opportunities:", error);
      setIsSearching(false);
      setHasError(true);
    }
  };
  const handleOpportunitySelect = async (opp) => {
    try {
      console.log("API opportunity data:", opp);
      
      // Get estimated fee from API data (the new format uses 'Estimated Fee')
      let estimatedFee = parseFloat(opp['Estimated Fee']) || 0;
      console.log("Parsed estimatedFee from API:", estimatedFee);

      // Try to get the latest estimated fee data from WorkloadPreloadService for accuracy
      try {
        const { WorkloadPreloadService } = await import('../services/WorkloadPreloadService');
        const currentUserDetails = JSON.parse(localStorage.getItem('userDetails'));
        if (currentUserDetails?.email) {
          const latestEstimatedFee = await WorkloadPreloadService.getOpportunityEstimatedFee(currentUserDetails.email, opp['Opportunity Number']);
          
          // Use estimated fee from API if available and different
          if (latestEstimatedFee > 0) {
            estimatedFee = latestEstimatedFee;
            console.log(`Updated estimated fee from WorkloadPreloadService for opportunity ${opp['Opportunity Number']}: ${estimatedFee}`);
          }
        }
      } catch (feeError) {
        console.warn("Failed to retrieve latest estimated fee data, using cached value:", feeError);
      }

      // Update with the selected opportunity data (using new API format)
      updateOpportunityRow(index, "opportunityNumber", opp['Opportunity Number'] || "");
      updateOpportunityRow(index, "opportunityName", opp['Opportunity Name'] || "");
      updateOpportunityRow(index, "proposalChampion", opp['Proposal Champion'] || "");
      updateOpportunityRow(index, "estimatedFee", estimatedFee);

      // Store the complete opportunity data in the row for use during save
      updateOpportunityRow(index, "_opportunityData", opp);

      setSearchTerm(opp['Opportunity Number'] || "");
      setShowDropdown(false);
      setUserInteracted(false); // Prevent dropdown from reopening immediately
      setHasError(false);
    } catch (error) {
      console.error('Failed to select opportunity:', error);
      setHasError(true);
    }
  };

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    if (!textLower.includes(queryLower)) return text;
    const index = textLower.indexOf(queryLower);
    return (
      <>
        {text.substring(0, index)}
        <span className="highlight">{text.substring(index, index + query.length)}</span>
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
              onChange={handleOpportunityNumberChange}
              onKeyDown={handleKeyPress}
              onFocus={handleFocus}
              onClick={() => setUserInteracted(true)}
              placeholder={isLoading ? "Loading..." : "Search by number, name, or champion..."}
              disabled={isLoading}
              ref={inputRef}
              className={hasError ? "input-error" : "centered-input"}
              autoComplete="off"
              aria-label="Opportunity Number"
            />
          </div>
          {isSearching && <div className="search-indicator">Searching...</div>}
          {hasError && <div className="search-error">Opportunity not found</div>}
          {showDropdown && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((opp, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  onClick={() => handleOpportunitySelect(opp)}
                  tabIndex="0"
                  onKeyDown={(e) => e.key === "Enter" && handleOpportunitySelect(opp)}
                  aria-label={`Select Opportunity ${opp['Opportunity Number']} - ${opp['Opportunity Name']}`}
                >
                  <div className="suggestion-project-name">
                    {highlightMatch(opp['Opportunity Name'], searchTerm)}
                  </div>
                  <div className="suggestion-project-number">
                    {highlightMatch(opp['Opportunity Number'], searchTerm)} - Champion: {highlightMatch(opp['Proposal Champion'], searchTerm)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </td>
      <td>
        <input type="text" value={row.opportunityName || ""} readOnly className="centered-input" />
      </td>
      <td>
        <input type="text" value={row.proposalChampion || ""} readOnly className="centered-input" />
      </td>
      <td>
        <input 
          type="text" 
          value={formatCurrency(row.estimatedFee || 0)} 
          readOnly 
          className="centered-input" 
          title={`Estimated Fee: ${formatCurrency(row.estimatedFee || 0)}`}
        />
      </td>
      <td style={{ width: "110px" }}>
        <input
          type="number"
          value={row.month || ""}
          onChange={(e) => updateOpportunityRow(index, "month", e.target.value)}
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
          onChange={(e) => updateOpportunityRow(index, "month1", e.target.value)}
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
          onChange={(e) => updateOpportunityRow(index, "month2", e.target.value)}
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
          onChange={(e) => updateOpportunityRow(index, "remarks", e.target.value)}
          placeholder="Add remarks..."
        />
      </td>
      <td>
        <button
          onClick={() => deleteOpportunityRow(index)}
          className="delete-btn"
          type="button"
        >
          <FaTrash />
        </button>
      </td>
    </tr>
  );
};

export default OpportunityRow;
