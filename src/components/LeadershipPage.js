import React, { useState, useEffect, useRef } from 'react';
import { UserService } from '../services/UserService';
import { GLTeamService } from '../services/GLTeamService';
import WeekPicker from './WeekPicker';
import './LeadershipPage.css';
import { FaChevronDown, FaChevronRight, FaUserClock } from 'react-icons/fa';
import format from 'date-fns/format';
import { startOfWeek, endOfWeek } from 'date-fns';
import API_CONFIG from '../services/apiConfig';

const GroupSelector = ({ onGroupChange, selectedGroup, groups = [] }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Log available groups for debugging
  useEffect(() => {
    if (groups && groups.length > 0) {
      console.log('Available Groups:', groups);
    }
    
    if (selectedGroup) {
      console.log('Currently selected Group:', selectedGroup);
    }
  }, [groups, selectedGroup]);

  const filteredGroups = searchTerm 
    ? groups.filter(group => 
        group.toLowerCase().includes(searchTerm.toLowerCase()))
    : groups;

  const handleGroupSelection = (group) => {
    // Always trim the group name to ensure consistent API requests
    const trimmedGroup = group.trim();
    console.log(`Group selected: "${group}"`);
    console.log(`Trimmed Group name: "${trimmedGroup}"`);
    
    // Use the trimmed group name
    onGroupChange(trimmedGroup);
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    console.log("Clearing Group selection");
    onGroupChange('');
    setShowDropdown(false);
  };

  return (
    <div className="user-selector group-selector">
      <div className="user-selector-container" ref={dropdownRef}>
        <div className="user-info-container">
          <span className="user-label">Filter by Studio:</span>
          <strong className="user-label">{selectedGroup || 'All Studios'}</strong>
          <button 
            className="team-dropdown-btn"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            Change Group
          </button>
        </div>
        
        {showDropdown && (
          <div className="user-dropdown">
            <input
              type="text"
              placeholder="Search group..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="user-search"
              autoFocus
            />
            
            <ul className="user-list">
              <li 
                onClick={handleClearSelection}
                className="user-list-item"
              >
                <div className="user-name">Show All Studios</div>
              </li>
              {filteredGroups.map((group, index) => (
                <li 
                  key={index}
                  onClick={() => handleGroupSelection(group)}
                  className={`user-list-item ${selectedGroup === group ? 'selected' : ''}`}
                >
                  <div className="user-name">{group}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const CollapsibleGroup = ({ manager, managerData, formatter, formatPercent }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="collapsible-group">
      <div 
        className="collapsible-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
        <h3>{manager} Group</h3>
      </div>
      
      {isExpanded && (
        <div className="collapsible-content">
          {/* Studio Summary Table */}
          <table className="summary-table">
            <thead>
              <tr className="project-metrics">
                <th>Studio Leader</th>
                <th>Team Members</th>
                <th>Scheduled Hours</th>
                <th>Direct Hours</th>
                <th>PTO/HOL</th>
                <th>Indirect Hours</th>
                <th>Total Hours</th>
                <th>Ratio B</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(managerData.studios).map(([studio, studioData], index) => (
                <tr key={index}>
                  <td>{studio}</td>
                  <td className="number-cell">{studioData.members.length}</td>
                  <td className="number-cell">{formatter.format(studioData.scheduledHours)}</td>
                  <td className="number-cell">{formatter.format(studioData.directHours)}</td>
                  <td className="number-cell">{formatter.format(studioData.ptoHours)}</td>
                  <td className="number-cell">{formatter.format(studioData.overheadHours)}</td>
                  <td className="number-cell"><strong>{formatter.format(studioData.totalHours)}</strong></td>
                  <td className="number-cell"><strong>{formatPercent(studioData.ratioB)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Studio Details with Collapsible Members */}
          {Object.entries(managerData.studios).map(([studio, studioData]) => (
            <CollapsibleStudio 
              key={studio}
              studio={studio}
              studioData={studioData}
              formatter={formatter}
              formatPercent={formatPercent}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CollapsibleStudio = ({ studio, studioData, formatter, formatPercent }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="collapsible-studio">
      <div 
        className="collapsible-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
        <h4>{studio}</h4>
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
              <th>Total Hours</th>
              <th>Ratio B</th>
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
                />
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const CollapsibleMember = ({ member, formatter, formatPercent }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Sort rows by project number
  const sortedRows = [...(member.rows || [])].sort((a, b) => 
    a.projectNumber.localeCompare(b.projectNumber)
  );
  
  return (
    <>
      <tr>
        <td>{member.name}</td>
        <td>{member.laborCategory}</td>
        <td className="number-cell">
          {formatter.format(Number(member.scheduledHours) || 40)}
        </td>
        <td className="number-cell">{formatter.format(member.directHours)}</td>
        <td className="number-cell">{formatter.format(member.ptoHours)}</td>
        <td className="number-cell">{formatter.format(member.overheadHours)}</td>
        <td className={`number-cell ${member.totalHours < member.scheduledHours ? 'hours-warning' : ''}`}>
          <strong>{formatter.format(member.totalHours)}</strong>
        </td>
        <td className="number-cell"><strong>{formatPercent(member.ratioB)}</strong></td>
        <td>
          <button 
            className="expand-details-btn"
            onClick={(e) => {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }}
          >
            <FaUserClock />
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="member-details">
          <td colSpan="9">
            <div className="time-entries">
              <h5>Time Entries</h5>
              {sortedRows.length === 0 ? (
                <div className="no-entries">No time entries found</div>
              ) : (
                sortedRows.map((entry, i) => (
                  <div key={i} className="time-entry">
                    <span className="project-number">{entry.projectNumber}</span>
                    <span className="project-name">{entry.projectName}</span>
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

// StaffTableView component - Updated to fetch and display all company staff
const StaffTableView = ({ weekStartDate, weekEndDate, formatter, formatPercent }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allStaffData, setAllStaffData] = useState({});
  
  // Load all staff data when component mounts
  useEffect(() => {
    if (!weekStartDate || !weekEndDate) return;
    
    const fetchAllStaffData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Make API call to get all staff data
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_ALL_STAFF}?start_date=${format(weekStartDate, 'yyyy-MM-dd')}&end_date=${format(weekEndDate, 'yyyy-MM-dd')}`;
        console.log(`Fetching all staff data from: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch all staff data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Received all staff data:", data);
        
        setAllStaffData(data);
      } catch (err) {
        console.error("Error fetching all staff data:", err);
        setError(`Failed to fetch all staff data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllStaffData();
  }, [weekStartDate, weekEndDate]);
  
  // If loading or error, show appropriate message
  if (isLoading) {
    return <div className="loading-indicator">Loading all staff data...</div>;
  }
  
  if (error) {
    return <div className="error-banner">{error}</div>;
  }
  
  // If no data, show empty message
  if (!allStaffData || !allStaffData.managers || Object.keys(allStaffData.managers).length === 0) {
    return <div className="no-data-message">No staff data available.</div>;
  }
  
  // Flatten all staff members from managers and studios
  const allStaff = [];
  
  // Process data from API response format
  Object.entries(allStaffData.managers).forEach(([managerName, managerData]) => {
    Object.entries(managerData.studios).forEach(([studioName, studioData]) => {
      studioData.members.forEach(member => {
        allStaff.push({
          ...member,
          studio: studioName,
          manager: managerName
        });
      });
    });
  });
  
  // Sort by manager, then studio, then name
  const sortedStaff = allStaff.sort((a, b) => {
    const managerCompare = a.manager.localeCompare(b.manager);
    if (managerCompare !== 0) return managerCompare;
    
    const studioCompare = a.studio.localeCompare(b.studio);
    if (studioCompare !== 0) return studioCompare;
    
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="project-summary">
      <div className='pm-dashboard-title'>All Staff Summary</div>
      
      {/* Company-wide stats */}
      {allStaffData.companyTotals && (
        <div className="company-stats">
          <div className="stat-item">
            <span className="stat-label">Total Team Members:</span>
            <span className="stat-value">{allStaffData.companyTotals.memberCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Scheduled Hours:</span>
            <span className="stat-value">{formatter.format(allStaffData.companyTotals.scheduledHours)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Direct Hours:</span>
            <span className="stat-value">{formatter.format(allStaffData.companyTotals.directHours)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Company Ratio B:</span>
            <span className="stat-value">{formatPercent(allStaffData.companyTotals.ratioB)}</span>
          </div>
        </div>
      )}
      
      <table className="summary-table">
        <thead>
          <tr>
            <th>Group Leader</th>
            <th>Studio</th>
            <th>Team Member</th>
            <th>Labor Category</th>
            <th>Scheduled Hours</th>
            <th>Direct Hours</th>
            <th>PTO/HOL</th>
            <th>Indirect Hours</th>
            <th>Total Hours</th>
            <th>Ratio B</th>
          </tr>
        </thead>
        <tbody>
          {sortedStaff.map((staff, index) => (
            <tr key={index} title={`${staff.name} - ${staff.laborCategory}`}>
              <td title={staff.manager}>{staff.manager}</td>
              <td title={staff.studio}>{staff.studio}</td>
              <td title={staff.name}>{staff.name}</td>
              <td title={staff.laborCategory}>{staff.laborCategory}</td>
              <td className="number-cell">
                {formatter.format(Number(staff.scheduledHours || 40))}
              </td>
              <td className="number-cell">{formatter.format(staff.directHours)}</td>
              <td className="number-cell">{formatter.format(staff.ptoHours)}</td>
              <td className="number-cell">{formatter.format(staff.overheadHours)}</td>
              <td className={`number-cell ${staff.totalHours < staff.scheduledHours ? 'hours-warning' : ''}`}>
                <strong>{formatter.format(staff.totalHours)}</strong>
              </td>
              <td className="number-cell">
                <strong>{formatPercent(staff.ratioB)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// New ProjectsTableView component to display all projects for the team
const ProjectsTableView = ({ teamData, formatter }) => {
  const [projectsData, setProjectsData] = useState([]);
  
  useEffect(() => {
    // Process team data to extract all projects
    const projects = [];
    
    Object.entries(teamData).forEach(([manager, managerData]) => {
      Object.entries(managerData.studios).forEach(([studio, studioData]) => {
        studioData.members.forEach(member => {
          // Process each member's rows to extract project data
          if (member.rows && member.rows.length > 0) {
            member.rows.forEach(row => {
              // Skip non-project rows (overhead, PTO, etc.)
              if (!row.projectNumber.startsWith('0000-0000')) {
                // Check if this project already exists in our projects array
                const existingProject = projects.find(p => p.projectNumber === row.projectNumber);
                
                if (existingProject) {
                  // Project exists, update hours and add team member if not already included
                  existingProject.totalHours += parseFloat(row.hours) || 0;
                  if (!existingProject.teamMembers.some(tm => tm.id === member.id)) {
                    existingProject.teamMembers.push({
                      id: member.id,
                      name: member.name,
                      hours: parseFloat(row.hours) || 0,
                      studio: studio,
                      remarks: row.remarks || ""
                    });
                  } else {
                    // Update existing team member's hours
                    const teamMember = existingProject.teamMembers.find(tm => tm.id === member.id);
                    teamMember.hours += parseFloat(row.hours) || 0;
                    // Update remarks if not already set
                    if (!teamMember.remarks && row.remarks) {
                      teamMember.remarks = row.remarks;
                    }
                  }
                } else {
                  projects.push({
                    projectNumber: row.projectNumber,
                    projectName: row.projectName,
                    pm: row.pm || 'Unassigned',
                    // Fix these incorrect lines that have syntax errors
                    labor: parseFloat(row.labor || row.contractLabor || 0),
                    pctLaborUsed: parseFloat(row.pctLaborUsed || row.percentLaborUsed || 0),
                    totalHours: parseFloat(row.hours) || 0,
                    teamMembers: [{
                      id: member.id,
                      name: member.name,
                      hours: parseFloat(row.hours) || 0,
                      studio: studio,
                      remarks: row.remarks || ""
                    }]
                  });
                }
              }
            });
          }
        });
      });
    });
    
    // Sort projects by project number
    const sortedProjects = projects.sort((a, b) => a.projectNumber.localeCompare(b.projectNumber));
    setProjectsData(sortedProjects);
  }, [teamData]);
  
  // Format currency for labor
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage for labor used
  const formatLaborUsed = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };
  
  // If no projects, show empty message
  if (projectsData.length === 0) {
    return <div className="no-data-message">No project data available.</div>;
  }
  
  return (
    <div className="project-summary">
      <div className='pm-dashboard-title'>Project Summary</div>
      
      <table className="summary-table projects-view-table">
        <thead>
          <tr>
            {/* <th>Project Number</th> */}
            <th>Project Name</th>
            <th>Project Manager</th>
            <th>Contract Total Labor</th>
            <th>Reported % Complete</th>
            <th>Total Hours</th>
            <th>Team Members</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {projectsData.map((project, index) => (
            <tr key={index}>
              {/* <td>{project.projectNumber}</td> */}
              <td>{project.projectName}</td>
              <td>{project.pm}</td>
              <td className="number-cell">{formatCurrency(project.labor)}</td>
              <td className={`number-cell ${
                project.pctLaborUsed >= 100 ? 'warning-cell' : 
                project.pctLaborUsed >= 90 ? 'caution-cell' : ''
              }`}>
                {formatLaborUsed(project.pctLaborUsed)}
              </td>
              <td className="number-cell">{formatter.format(project.totalHours)}</td>
              <td>
                {project.teamMembers.map((member, idx) => (
                  <div key={idx} className="project-team-member">
                    {member.name} ({formatter.format(member.hours)})
                  </div>
                ))}
              </td>
              <td>
                {project.teamMembers.map((member, idx) => (
                  member.remarks ? (
                    <div key={idx} className="project-team-member">
                      <strong>{member.name}:</strong> {member.remarks}
                    </div>
                  ) : null
                )).filter(Boolean)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const LeadershipPage = ({ navigate }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLeader, setSelectedLeader] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(''); // New state for group filter
  const [teamData, setTeamData] = useState({});
  const [weekStartDate, setWeekStartDate] = useState(null);
  const [weekEndDate, setWeekEndDate] = useState(null);
  const [viewMode, setViewMode] = useState('hierarchy'); // 'hierarchy', 'table', or 'projects'
  const [currentUser, setCurrentUser] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [groupList, setGroupList] = useState([]); // New state for list of groups
  
  // Initialize user and date range
  useEffect(() => {
    const userDetails = UserService.getCurrentUserDetails();
    if (userDetails) {
      setCurrentUser(userDetails);
    }
    
    // Set default week to current week
    const today = new Date();
    const startDate = startOfWeek(today, { weekStartsOn: 1 }); //chg
    const endDate = endOfWeek(today, { weekStartsOn: 1 });
    setWeekStartDate(startDate);
    setWeekEndDate(endDate);
    
    // Fetch all group leaders at initialization
    const fetchAllLeaders = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LEADERSHIP_LEADERS}?type=gl`);
        if (!response.ok) {
          throw new Error(`Failed to fetch group leaders: ${response.status}`);
        }
        const leadersData = await response.json();
        setLeaders(leadersData);
        console.log("Got all group leaders:", leadersData);
      } catch (err) {
        console.error("Error fetching group leaders:", err);
      }
    };
    
    fetchAllLeaders();
  }, []);
  
  // Handle week change from WeekPicker
  const handleWeekChange = (startDate, endDate) => {
    console.log("Week changed:", {
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd')
    });
    setWeekStartDate(startDate);
    setWeekEndDate(endDate);
  };
  
  // New function to extract all unique group names
  const extractGroupNames = (teamData) => {
    const groups = new Set();
    
    Object.entries(teamData).forEach(([manager, managerData]) => {
      Object.keys(managerData.studios).forEach(studio => {
        if (studio !== 'Unassigned') {
          groups.add(studio);
        }
      });
    });
    
    return Array.from(groups).sort();
  };

  // Add group filter to loadTeamData function
  const loadTeamData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Loading leadership data for current user:", currentUser.email);
      
      // Use the group manager information stored during login
      const userGroupManager = currentUser.groupManager;
      
      if (!userGroupManager) {
        console.log("User is not assigned to any group");
        setTeamData({});
        setIsLoading(false);
        return;
      }
      
      console.log(`User belongs to group managed by: ${userGroupManager}`);
      
      // Use the new service to get team members with multiple fallback approaches
      const members = await GLTeamService.getTeamMembersForUser(
        currentUser.email, 
        userGroupManager
      );
      
      if (!members || members.length === 0) {
        console.log("No team members found for this group");
        setError("No team members found for your group. You might not be assigned to a group yet.");
        setTeamData({});
        setIsLoading(false);
        return;
      }
      
      console.log(`Found ${members.length} team members for group manager: ${userGroupManager}`);
      
      // Get emails for all team members
      const emails = members.map(member => member.email);
      
      // Get allocations for this time period
      const allocations = await GLTeamService.getTeamAllocations(
        emails,
        format(weekStartDate, 'yyyy-MM-dd'),
        format(weekEndDate, 'yyyy-MM-dd')
      );
      
      // Structure the data
      const allGroupsData = {};
      const groupManager = userGroupManager;
      
      allGroupsData[groupManager] = {
        studios: {},
        totalHours: 0,
        scheduledHours: 0,
        directHours: 0,
        ptoHours: 0,
        overheadHours: 0,
        memberCount: members.length,
      };
      
      // Process members and group by studio
      members.forEach(member => {
        // Get GroupName with detailed logging
        let studio = 'Unassigned';
        
        if (member.GroupName) {
          console.log(`Found GroupName for ${member.name}: ${member.GroupName}`);
          studio = member.GroupName;
        } else {
          console.log(`No GroupName found for ${member.name}, using 'Unassigned'}`);
        }
        
        // Skip if a group filter is applied and doesn't match
        if (selectedGroup && studio !== selectedGroup) {
          console.log(`Filtering out member ${member.name} because group "${studio}" doesn't match selected group "${selectedGroup}"`);
          return;
        }
        
        // Ensure scheduledHours is consistently a number
        let scheduledHours = 40.0; // Default value
        
        if (member.scheduled_hours !== null && member.scheduled_hours !== undefined) {
          // Convert to number if it's not already
          scheduledHours = Number(member.scheduled_hours);
          
          // Handle NaN case
          if (isNaN(scheduledHours)) {
            console.warn(`Invalid hours value for ${member.name}: ${member.scheduled_hours}, using default 40`);
            scheduledHours = 40.0;
          }
        }
        
        console.log(`Processing member: ${member.name}, Studio: ${studio}, Hours: ${scheduledHours} (type: ${typeof scheduledHours})`);
        
        // Initialize studio if needed
        if (!allGroupsData[groupManager].studios[studio]) {
          allGroupsData[groupManager].studios[studio] = {
            members: [],
            totalHours: 0,
            scheduledHours: 0,
            directHours: 0,
            ptoHours: 0,
            overheadHours: 0,
          };
        }
        
        // Filter allocations for this member
        const memberAllocations = allocations.filter(a => a.email === member.email);
        
        // Calculate hours by category
        const memberRows = memberAllocations.map(allocation => ({
          projectNumber: allocation.proj_id || allocation.project_number || '',
          projectName: allocation.project_name || '',
          milestone: allocation.milestone_name || '',
          pm: allocation.project_manager || '',
          // Ensure we properly extract labor and percentage values
          labor: parseFloat(allocation.contract_labor || allocation.labor || 0),
          pctLaborUsed: parseFloat(allocation.forecast_pm_labor || allocation.percentLaborUsed || 0) * 100,
          hours: parseFloat(allocation.ra_hours || allocation.hours || 0),
          remarks: allocation.ra_remarks || allocation.remarks || ''
        }));

        const directHours = memberRows
          .filter(row => !row.projectNumber.startsWith('0000-0000'))
          .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);

        const ptoHours = memberRows
          .filter(row => 
            row.projectNumber.startsWith('0000-0000-0PTO') || 
            row.projectNumber.startsWith('0000-0000-0HOL') ||
            row.projectNumber.startsWith('0000-0000-0SIC') ||
            row.projectNumber.startsWith('0000-0000-LWOP') ||
            row.projectNumber.startsWith('0000-0000-JURY')
          )
          .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);
          
        const overheadHours = memberRows
          .filter(row => 
            row.projectNumber.startsWith('0000-0000') && 
            !row.projectNumber.startsWith('0000-0000-0PTO') && 
            !row.projectNumber.startsWith('0000-0000-0HOL') &&
            !row.projectNumber.startsWith('0000-0000-0SIC') &&
            !row.projectNumber.startsWith('0000-0000-LWOP') &&
            !row.projectNumber.startsWith('0000-0000-JURY')
          )
          .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);
          
        const totalHours = directHours + ptoHours + overheadHours; 
        
        // Add member to studio
        allGroupsData[groupManager].studios[studio].members.push({
          id: member.id,
          name: member.name,
          email: member.email,
          laborCategory: member.labor_category || '',
          scheduledHours: scheduledHours,  // Consistently a number
          directHours,
          ptoHours, 
          overheadHours,
          totalHours,
          ratioB: calculateRatioB(directHours, scheduledHours, ptoHours),
          rows: memberRows
        });
        
        // Update studio totals
        console.log(`Adding to studio ${studio}: Current=${allGroupsData[groupManager].studios[studio].scheduledHours}, Adding=${scheduledHours}`);
        allGroupsData[groupManager].studios[studio].totalHours += totalHours;
        allGroupsData[groupManager].studios[studio].scheduledHours += scheduledHours; // Now a number
        allGroupsData[groupManager].studios[studio].directHours += directHours;
        allGroupsData[groupManager].studios[studio].ptoHours += ptoHours;
        allGroupsData[groupManager].studios[studio].overheadHours += overheadHours;
        
        // Update manager totals
        allGroupsData[groupManager].totalHours += totalHours;
        allGroupsData[groupManager].scheduledHours += scheduledHours; // Now a number
        allGroupsData[groupManager].directHours += directHours;
        allGroupsData[groupManager].ptoHours += ptoHours;
        allGroupsData[groupManager].overheadHours += overheadHours;
      });
      
      // Calculate ratio B for studios and manager
      Object.keys(allGroupsData[groupManager].studios).forEach(studio => {
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
      
      // Extract unique group names and update state
      const groups = extractGroupNames(allGroupsData);
      setGroupList(groups);
      console.log("Available groups:", groups);
      
      console.log("FINAL DATA STRUCTURE:", JSON.stringify(allGroupsData, null, 2));
      setTeamData(allGroupsData);
    } catch (err) {
      console.error("Error loading team data:", err);
      setError(`Failed to load team data: ${err.message}`);
      setTeamData({});
    } finally {
      setIsLoading(false);
    }
  };

  // Update useEffect hook to include selectedGroup in dependencies
  useEffect(() => {
    if (!currentUser || !weekStartDate || !weekEndDate || leaders.length === 0) {
      return;
    }
    
    loadTeamData();
  }, [currentUser, weekStartDate, weekEndDate, leaders, selectedGroup]); // Add selectedGroup here

  // Calculate RatioB
  const calculateRatioB = (directHours, scheduledHours, ptoHours) => {
    const denominator = scheduledHours - ptoHours;
    if (denominator <= 0) return 0;
    return directHours / denominator;
  };

  // Format numbers
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  });
  
  const formatPercent = (value) => {
    // const divisor = value > 1000 ? 10000 : 100;
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="page-layout">
      <main className="gl-dashboard">
        <div className="content-wrapper">
          <WeekPicker onWeekChange={handleWeekChange} />
          
          {/* Add GroupSelector component */}
          {groupList.length > 0 && (
            <GroupSelector 
              onGroupChange={setSelectedGroup}
              selectedGroup={selectedGroup}
              groups={groupList}
            />
          )}
          
          <div className="view-toggle">
            <button 
              className={`toggle-button ${viewMode === 'hierarchy' ? 'active' : ''}`}
              onClick={() => setViewMode('hierarchy')}
            >
              Group by Team
            </button>
            <button 
              className={`toggle-button ${viewMode === 'projects' ? 'active' : ''}`}
              onClick={() => setViewMode('projects')}
            >
              Group by Projects
            </button>
            <button 
              className={`toggle-button ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              All Staff
            </button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          {isLoading ? (
            <div className="loading-indicator">Loading team data...</div>
          ) : Object.keys(teamData).length === 0 ? (
            <div className="no-data-message">
              No data found for your group. You might not be assigned to a group yet.
            </div>
          ) : (
            <div className="group-summary">
              {/* <div className='pm-dashboard-title'>Resource Allocation by Group</div> */}
              
              {viewMode === 'hierarchy' ? (
                <>
                  {/* Summary table for all managers */}
                  <div className="project-summary">
                    <div className='pm-dashboard-title'>Group Summary</div>
                    <table className="summary-table">
                      <thead>
                        <tr className="project-metrics">
                          <th>Group Leader</th>
                          <th>Team Members</th>
                          <th>Scheduled Hours</th>
                          <th>Direct Hours</th>
                          <th>PTO/HOL</th>
                          <th>Indirect Hours</th>
                          <th>Total Hours</th>
                          <th>Ratio B</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(teamData).map(([manager, data], index) => (
                          <tr key={index}>
                            <td>{manager}</td>
                            <td className="number-cell">{data.memberCount}</td>
                            <td className="number-cell">{formatter.format(data.scheduledHours)}</td>
                            <td className="number-cell">{formatter.format(data.directHours)}</td>
                            <td className="number-cell">{formatter.format(data.ptoHours)}</td>
                            <td className="number-cell">{formatter.format(data.overheadHours)}</td>
                            <td className="number-cell"><strong>{formatter.format(data.totalHours)}</strong></td>
                            <td className="number-cell"><strong>{formatPercent(data.ratioB)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Detailed tables for each manager and their studios */}
                  {Object.entries(teamData).map(([manager, managerData]) => (
                    <CollapsibleGroup
                      key={manager}
                      manager={manager}
                      managerData={managerData}
                      formatter={formatter}
                      formatPercent={formatPercent}
                    />
                  ))}
                </>
              ) : viewMode === 'table' ? (
                <StaffTableView 
                  // data={teamData}
                  weekStartDate={weekStartDate}
                  weekEndDate={weekEndDate}
                  formatter={formatter}
                  formatPercent={formatPercent}
                />
              ) : (
                <ProjectsTableView 
                  teamData={teamData}
                  formatter={formatter}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LeadershipPage;