import React, { useState, useEffect, useRef } from 'react';
import { StaffService } from '../services/StaffService';
import { UserService } from '../services/UserService';
import '../styles/UserSelector.css';

const UserSelector = ({ 
  onUserChange, 
  label = "Current User",
  selectedUser: externalSelectedUser,
  filterByRole,
  placeholder = "Search by name or email...",
  updateLocalStorage = true
}) => {
  const [staffData, setStaffData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const dropdownRef = useRef(null);

  // Sync with external selectedUser prop
  useEffect(() => {
    if (externalSelectedUser !== undefined) {
      setSelectedUser(externalSelectedUser);
    }
  }, [externalSelectedUser]);

  useEffect(() => {
    const loadStaffData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('UserSelector: Beginning staff data loading');
        const data = await StaffService.loadStaffData();
        console.log('UserSelector: Staff data loading complete');
        
        if (Array.isArray(data) && data.length > 0) {
          console.log('UserSelector: Setting staff data with', data.length, 'records');
          // Filter staff data if filterByRole is specified
          const filteredData = filterByRole === 'Studio Leader' 
            ? data.filter(staff => staff.isGroupManager)
            : data;
          
          setStaffData(filteredData);
        } else {
          console.warn('UserSelector: No staff data available or empty array received');
          setStaffData([]);
        }
        
        // Only set current user if we're updating localStorage
        if (updateLocalStorage) {
          const currentUser = await UserService.getCurrentUser();
          if (currentUser && currentUser !== 'Unknown User') {
            console.log('UserSelector: Setting previously selected user:', currentUser);
            setSelectedUser(currentUser);
          } else {
            console.log('UserSelector: No previous user found or unknown user');
          }
        }
      } catch (err) {
        console.error('UserSelector: Failed to load staff data:', err);
        setError('Error loading user data');
        setStaffData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStaffData();
  }, [filterByRole, updateLocalStorage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleUserSelect = (userName) => {
    // Clean any potential HTML
    const cleanedName = String(userName).replace(/<[^>]*>?/gm, '');
    setSelectedUser(cleanedName);
    setShowDropdown(false);
    setSearchTerm('');
    
    // Only update localStorage if specified
    if (updateLocalStorage) {
      UserService.setCurrentUser(cleanedName);
    }
    
    if (onUserChange) {
      onUserChange(cleanedName);
    }
  };

  const filteredStaff = searchTerm 
    ? staffData.filter(staff => {
        // Make sure we're dealing with strings and remove any HTML
        const staffName = String(staff.name || '').toLowerCase();
        const staffEmail = String(staff.email || '').toLowerCase();
        const searchTermLower = searchTerm.toLowerCase();
        
        return staffName.includes(searchTermLower) || 
              staffEmail.includes(searchTermLower);
      })
    : [];

  return (
    <div className="user-selector">
      <div className="user-selector-container" ref={dropdownRef}>
        <div className="current-user">
          <span>{label}:</span>
          <strong>{selectedUser || 'Select a user'}</strong>
          <button 
            className="change-user-btn"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            Change {filterByRole || 'User'}
          </button>
        </div>
        
        {showDropdown && (
          <div className="user-dropdown">
            <input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={handleSearch}
              className="user-search"
              autoFocus
            />
            
            {isLoading ? (
              <div className="loading-message">Loading staff data...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : staffData.length === 0 ? (
              <div className="no-results">No staff data available</div>
            ) : filteredStaff.length > 0 ? (
              <ul className="user-list">
                {filteredStaff.map((staff, index) => (
                  <li 
                    key={index}
                    onClick={() => handleUserSelect(staff.name)}
                    className="user-list-item"
                  >
                    <div className="user-name">{staff.name}</div>
                    <div className="user-email">{staff.email}</div>
                    <div className="user-role">{staff.laborCategory}</div>
                  </li>
                ))}
              </ul>
            ) : searchTerm ? (
              <div className="no-results">No results found</div>
            ) : (
              <div className="no-results">Start typing to search users</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSelector;
