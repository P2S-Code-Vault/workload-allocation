import React, { useState, useEffect } from "react";
import "./TeamMemberSelector.css";

const TeamMemberSelector = ({
  currentUser,
  teamMembers,
  isLoading,
  error,
  onSelectTeamMember,
  onReset,
  selectedMember,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest(".team-dropdown")) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleTeamMemberSelect = (member) => {
    console.log(`TeamMemberSelector: Selected team member:`, member);
    setShowDropdown(false);
    onSelectTeamMember(member);
  };

  // Add debug logging
  console.log("TeamMemberSelector render:", {
    teamMembers,
    teamMembersLength: teamMembers?.length,
    isLoading,
    error,
    selectedMember,
    showDropdown
  });

  return (
    <div className="team-selector-container">
      {!selectedMember ? (
        <div className="team-dropdown">
          <button
            className="team-dropdown-btn"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Select Team member"}
          </button>

          {showDropdown && teamMembers.length > 0 && (
            <div className="team-dropdown-list">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="team-member-option"
                  onClick={() => handleTeamMemberSelect(member)}
                >
                  <div className="member-name">{member.name}</div>
                  <div className="member-details">{member.title}</div>
                </div>
              ))}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>
      ) : (
        <div className="managing-indicator">
          <strong>{selectedMember.name}</strong>
          <button className="reset-view-btn" onClick={onReset}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
};

export default TeamMemberSelector;
