import React, { useState, useEffect } from "react";
import ContactsService from "../services/ContactsService";
import "./TeamMemberSelector.css";

const TeamMemberSelector = ({
  currentUser,
  teamMembers,
  isLoading,
  error,
  onSelectTeamMember,
  onReset,
  selectedMember,
  showAllContacts=true 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [allContacts, setAllContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all active contacts when component mounts
  useEffect(() => {
    const fetchAllContacts = async () => {
      if (!showAllContacts) return;
      
      try {
        setLoadingContacts(true);
        setContactsError(null);
        console.log('TeamMemberSelector: Fetching all active contacts...');
        
        const contacts = await ContactsService.getAllActiveContacts();
        console.log('TeamMemberSelector: All active contacts loaded:', contacts);
        setAllContacts(contacts);
        
      } catch (error) {
        console.error('TeamMemberSelector: Error loading all contacts:', error);
        setContactsError(error.message);
        setAllContacts([]);
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchAllContacts();
  }, [showAllContacts]);


  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest(".team-dropdown")) {
        setShowDropdown(false);
        setSearchTerm(""); // Clear search when closing dropdown
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const handleTeamMemberSelect = (member) => {
    console.log(`TeamMemberSelector: Selected team member:`, member);
    setShowDropdown(false);
    setSearchTerm(""); // Clear search when selecting
    onSelectTeamMember(member);
  };

  // Determine which data source to use
  const getDisplayMembers = () => {
    let members = [];
    if (showAllContacts && allContacts && allContacts.length > 0) {
      members = allContacts;
    } else {
      members = teamMembers || [];
    }

    // Filter members based on search term
    if (searchTerm) {
      return members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.title && member.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.GroupName && member.GroupName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return members;
  };

  const getLoadingState = () => {
    if (showAllContacts) {
      return loadingContacts || isLoading;
    }
    return isLoading;
  };

  const getErrorState = () => {
    if (showAllContacts && contactsError) {
      return contactsError;
    }
    return error;
  };

  const displayMembers = getDisplayMembers();
  const isCurrentlyLoading = getLoadingState();
  const currentError = getErrorState();

  // Add debug logging
  console.log("TeamMemberSelector render:", {
    showAllContacts,
    allContactsLength: allContacts?.length,
    teamMembersLength: teamMembers?.length,
    displayMembersLength: displayMembers?.length,
    loadingContacts,
    isLoading,
    isCurrentlyLoading,
    contactsError,
    error: error,
    currentError,
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
            disabled={isCurrentlyLoading}
          >
            {isCurrentlyLoading 
              ? "Loading..." 
              : showAllContacts 
                ? "Select Staff Member" 
                : "Select Team member"
            }
          </button>

          {showDropdown && (
            <div className="team-dropdown-list">
              <input
                type="text"
                placeholder="Search team members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchTerm("");
                    setShowDropdown(false);
                  }
                }}
                className="team-member-search"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
              {displayMembers.length > 0 ? (
                displayMembers.map((member) => (
                  <div
                    key={member.id}
                    className="team-member-option"
                    onClick={() => handleTeamMemberSelect(member)}
                  >
                    <div className="member-name">{member.name}</div>
                    <div className="member-details">
                      {member.title}
                      {member.GroupName && member.GroupName !== 'Unassigned' && (
                        <span> • {member.GroupName}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  {searchTerm ? "No team members found matching your search" : "No team members available"}
                </div>
              )}
            </div>
          )}

          {currentError && <div className="error-message">{currentError}</div>}
        </div>
      ) : (
        <div className="managing-indicator">
          <strong>{selectedMember.name}</strong>
          {selectedMember.title && (
            <span> • {selectedMember.title}</span>
          )}
          <button className="reset-view-btn" onClick={onReset}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
};

export default TeamMemberSelector;
