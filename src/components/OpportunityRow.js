import React, { useState, useEffect, useRef } from "react";
import { FaTrash } from "react-icons/fa";
import { ProjectSearchService } from "../services/ProjectSearchService";
import { UserService } from "../services/UserService";
import { getUserRate, calculateProjectedFee, formatCurrency } from "../utils/rateUtils";
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
  const [userRate, setUserRate] = useState(0);
  const [projectedFee, setProjectedFee] = useState(0);
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

  // Get user rate on component mount
  useEffect(() => {
    const fetchUserRate = async () => {
      try {
        const userDetails = UserService.getCurrentUserDetails();
        if (userDetails) {
          const rate = await getUserRate(userDetails);
          setUserRate(rate);
        }
      } catch (error) {
        console.error("Error fetching user rate:", error);
        setUserRate(0);
      }
    };
    fetchUserRate();
  }, []);

  // Calculate projected fee whenever hours or rate changes
  useEffect(() => {
    const totalHours = (parseFloat(row.month) || 0) + 
                      (parseFloat(row.month1) || 0) + 
                      (parseFloat(row.month2) || 0);
    const calculatedFee = calculateProjectedFee(totalHours, userRate);
    setProjectedFee(calculatedFee);
  }, [row.month, row.month1, row.month2, userRate]);

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
      // Don't clear estimatedFee - projected fee calculation will handle it
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
  const handleOpportunitySelect = (opp) => {
    updateOpportunityRow(index, "opportunityNumber", opp.OpportunityNumber || "");
    updateOpportunityRow(index, "opportunityName", opp.Opportunity_Name_from_Lead__c || "");
    updateOpportunityRow(index, "proposalChampion", opp.ProposalChampion || "");
    // Don't update estimatedFee - let projected fee calculation handle it
    setSearchTerm(opp.OpportunityNumber || "");
    setShowDropdown(false);
    setUserInteracted(false); // Prevent dropdown from reopening immediately
    setHasError(false);
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
          {hasError && <div className="search-error">Opportunity not found</div>}          {showDropdown && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((opp, i) => (
                <div
                  key={i}
                  className="suggestion-item"
                  onClick={() => handleOpportunitySelect(opp)}
                  tabIndex="0"
                  onKeyDown={(e) => e.key === "Enter" && handleOpportunitySelect(opp)}
                  aria-label={`Select Opportunity ${opp.OpportunityNumber} - ${opp.Opportunity_Name_from_Lead__c}`}
                >
                  <div className="suggestion-project-number">
                    {highlightMatch(opp.OpportunityNumber, searchTerm)} - {highlightMatch(opp.Opportunity_Name_from_Lead__c, searchTerm)}
                  </div>
                  <div className="suggestion-milestone">
                    Champion: {highlightMatch(opp.ProposalChampion, searchTerm)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </td>
      <td>
        <input type="text" value={row.opportunityName || ""} readOnly className="centered-input" />
      </td>      <td>
        <input type="text" value={row.proposalChampion || ""} readOnly className="centered-input" />
      </td>
      <td>
        <input 
          type="text" 
          value={formatCurrency(projectedFee)} 
          readOnly 
          className="centered-input" 
          title={`Based on ${((parseFloat(row.month) || 0) + (parseFloat(row.month1) || 0) + (parseFloat(row.month2) || 0))} hours × $${userRate}/hour`}
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
