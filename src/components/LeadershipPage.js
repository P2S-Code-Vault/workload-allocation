import React, { useState, useEffect, useRef } from 'react';
import { UserService } from '../services/UserService';
import { GLTeamService } from '../services/GLTeamService';
import { ProjectDataService } from '../services/ProjectDataService';
import WeekPicker from './WeekPicker';
import './LeadershipPage.css';
import { FaChevronDown, FaChevronRight, FaUserClock } from 'react-icons/fa';
import format from 'date-fns/format';
import { startOfWeek, endOfWeek, addWeeks } from 'date-fns';
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
    const trimmedGroup = group.trim();
    console.log(`Group selected: "${group}"`);
    console.log(`Trimmed Group name: "${trimmedGroup}"`);
    
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
        {/* <div className="user-info-container"> */}
          <span className="user-label">Filter by Studio:</span>
          <strong className="user-label">{selectedGroup || 'All Studios'}</strong>
          <button 
            className="team-dropdown-btn"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            Change
          </button>
        {/* </div> */}
        
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
  const [isExpanded, setIsExpanded] = useState(true);
  
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
  const [isExpanded, setIsExpanded] = useState(true);
  
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

const StaffTableView = ({ weekStartDate, weekEndDate, formatter, formatPercent }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allStaffData, setAllStaffData] = useState({});
  
  useEffect(() => {
    if (!weekStartDate || !weekEndDate) return;
    
    const fetchAllStaffData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
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
  
  if (isLoading) {
    return <div className="loading-indicator">Loading all staff data...</div>;
  }
  
  if (error) {
    return <div className="error-banner">{error}</div>;
  }
  
  if (!allStaffData || !allStaffData.managers || Object.keys(allStaffData.managers).length === 0) {
    return <div className="no-data-message">No staff data available.</div>;
  }
  
  const allStaff = [];
  
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

const ProjectsTableView = ({ teamData, formatter }) => {
  const [projectsData, setProjectsData] = useState([]);
  
  useEffect(() => {
    const projects = [];
    
    Object.entries(teamData).forEach(([manager, managerData]) => {
      Object.entries(managerData.studios).forEach(([studio, studioData]) => {
        studioData.members.forEach(member => {
          if (member.rows && member.rows.length > 0) {
            member.rows.forEach(row => {
              if (!row.projectNumber.startsWith('0000-0000')) {
                const existingProject = projects.find(p => p.projectNumber === row.projectNumber);
                
                if (existingProject) {
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
                    const teamMember = existingProject.teamMembers.find(tm => tm.id === member.id);
                    teamMember.hours += parseFloat(row.hours) || 0;
                    if (!teamMember.remarks && row.remarks) {
                      teamMember.remarks = row.remarks;
                    }
                  }
                } else {
                  projects.push({
                    projectNumber: row.projectNumber,
                    projectName: row.projectName,
                    pm: row.pm || 'Unassigned',
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
    
    const sortedProjects = projects.sort((a, b) => a.projectNumber.localeCompare(b.projectNumber));
    setProjectsData(sortedProjects);
  }, [teamData]);
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

const formatLaborUsed = (value) => {
  const numValue = parseFloat(value) || 0;
  
  if (numValue >= 100 && numValue % 100 === 0) {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(numValue / 10000);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(numValue / 100);
  }
};
  
  if (projectsData.length === 0) {
    return <div className="no-data-message">No project data available.</div>;
  }
  
  return (
    <div className="project-summary">
      <div className='pm-dashboard-title'>Project Summary</div>
      
      <table className="summary-table projects-view-table">
        <thead>
          <tr>
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
              <td>{project.projectName}</td>
              <td>{project.pm}</td>
              <td className="number-cell">{formatCurrency(project.labor)}</td>
              <td className="number-cell">{formatLaborUsed(project.pctLaborUsed)}</td>
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
  const [selectedGroup, setSelectedGroup] = useState('');
  const [teamData, setTeamData] = useState({});
  const [weekStartDate, setWeekStartDate] = useState(null);
  const [weekEndDate, setWeekEndDate] = useState(null);
  const [viewMode, setViewMode] = useState('hierarchy');
  const [currentUser, setCurrentUser] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [groupList, setGroupList] = useState([]);
  const [showAllGroups, setShowAllGroups] = useState(false);
  
  useEffect(() => {
    const userDetails = UserService.getCurrentUserDetails();
    if (userDetails) {
      setCurrentUser(userDetails);
    }
    
    // Initialize with next week's dates instead of current week
    const today = addWeeks(new Date(), 1);
    const startDate = startOfWeek(today, { weekStartsOn: 1 });
    const endDate = endOfWeek(today, { weekStartsOn: 1 });
    
    console.log("Leadership Page - Initializing with next week:", {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });
    
    setWeekStartDate(startDate);
    setWeekEndDate(endDate);
    
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
  
  const handleWeekChange = (startDate, endDate) => {
    console.log("Week changed in LeadershipPage:", {
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd')
    });
    
    // Clear any cached data to ensure fresh load
    try {
      const cachePattern = 'all_staff_';
      console.log(`Clearing cached items matching pattern: ${cachePattern}`);
      // Check if ProjectDataService has the method
      if (typeof ProjectDataService?.clearCacheWithPattern === 'function') {
        ProjectDataService.clearCacheWithPattern(cachePattern);
      }
    } catch (e) {
      console.warn("Failed to clear Leadership page cache:", e);
    }
    
    setWeekStartDate(startDate);
    setWeekEndDate(endDate);
  };

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

  const loadTeamData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Loading leadership data for current user:", currentUser.email);
      
      const userGroupManager = currentUser.groupManager;
      
      if (!userGroupManager && !showAllGroups) {
        console.log("User is not assigned to any group");
        setTeamData({});
        setIsLoading(false);
        return;
      }
      
      if (showAllGroups) {
        console.log("Fetching data for all groups");
        
        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_ALL_STAFF}?start_date=${format(weekStartDate, 'yyyy-MM-dd')}&end_date=${format(weekEndDate, 'yyyy-MM-dd')}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch all groups data: ${response.status}`);
          }
          
          const allData = await response.json();
          console.log("Received all groups data:", allData);
          
          if (allData && allData.managers) {
            setTeamData(allData.managers);
            
            const groups = new Set();
            Object.entries(allData.managers).forEach(([manager, managerData]) => {
              Object.keys(managerData.studios).forEach(studio => {
                if (studio !== 'Unassigned') {
                  groups.add(studio);
                }
              });
            });
            setGroupList(Array.from(groups).sort());
          } else {
            setError("Failed to load data for all groups");
            setTeamData({});
          }
          setIsLoading(false);
          return;
        } catch (err) {
          console.error("Error loading all groups data:", err);
          setError(`Failed to load all groups data: ${err.message}`);
          setTeamData({});
          setIsLoading(false);
          return;
        }
      }
      
      console.log(`User belongs to group managed by: ${userGroupManager}`);
      
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
      
      const emails = members.map(member => member.email);
      
      const allocations = await GLTeamService.getTeamAllocations(
        emails,
        format(weekStartDate, 'yyyy-MM-dd'),
        format(weekEndDate, 'yyyy-MM-dd')
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
        memberCount: members.length,
      };
      
      members.forEach(member => {
        let studio = 'Unassigned';
        
        if (member.GroupName) {
          console.log(`Found GroupName for ${member.name}: ${member.GroupName}`);
          studio = member.GroupName;
        } else {
          console.log(`No GroupName found for ${member.name}, using 'Unassigned'}`);
        }
        
        if (selectedGroup && studio !== selectedGroup) {
          console.log(`Filtering out member ${member.name} because group "${studio}" doesn't match selected group "${selectedGroup}"`);
          return;
        }
        
        let scheduledHours = 40.0;
        
        if (member.scheduled_hours !== null && member.scheduled_hours !== undefined) {
          scheduledHours = Number(member.scheduled_hours);
          
          if (isNaN(scheduledHours)) {
            console.warn(`Invalid hours value for ${member.name}: ${member.scheduled_hours}, using default 40`);
            scheduledHours = 40.0;
          }
        }
        
        console.log(`Processing member: ${member.name}, Studio: ${studio}, Hours: ${scheduledHours} (type: ${typeof scheduledHours})`);
        
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
        
        const memberAllocations = allocations.filter(a => a.email === member.email);
        
        const memberRows = memberAllocations.map(allocation => ({
          projectNumber: allocation.proj_id || allocation.project_number || '',
          projectName: allocation.project_name || '',
          milestone: allocation.milestone_name || '',
          pm: allocation.project_manager || '',
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
        
        allGroupsData[groupManager].studios[studio].members.push({
          id: member.id,
          name: member.name,
          email: member.email,
          laborCategory: member.labor_category || '',
          scheduledHours: scheduledHours,
          directHours,
          ptoHours, 
          overheadHours,
          totalHours,
          ratioB: calculateRatioB(directHours, scheduledHours, ptoHours),
          rows: memberRows
        });
        
        allGroupsData[groupManager].studios[studio].totalHours += totalHours;
        allGroupsData[groupManager].studios[studio].scheduledHours += scheduledHours;
        allGroupsData[groupManager].studios[studio].directHours += directHours;
        allGroupsData[groupManager].studios[studio].ptoHours += ptoHours;
        allGroupsData[groupManager].studios[studio].overheadHours += overheadHours;
        
        allGroupsData[groupManager].totalHours += totalHours;
        allGroupsData[groupManager].scheduledHours += scheduledHours;
        allGroupsData[groupManager].directHours += directHours;
        allGroupsData[groupManager].ptoHours += ptoHours;
        allGroupsData[groupManager].overheadHours += overheadHours;
      });
      
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

  useEffect(() => {
    if (!currentUser || !weekStartDate || !weekEndDate || leaders.length === 0) {
      return;
    }
    
    loadTeamData();
  }, [currentUser, weekStartDate, weekEndDate, leaders, selectedGroup, showAllGroups]);

  const calculateRatioB = (directHours, scheduledHours, ptoHours) => {
    const denominator = scheduledHours - ptoHours;
    if (denominator <= 0) return 0;
    return directHours / denominator;
  };

  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  });
  const formatPercent = (value) => {
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
          
          <div className="user-info-container">
            {groupList.length > 0 && (
              <GroupSelector 
                onGroupChange={setSelectedGroup}
                selectedGroup={selectedGroup}
                groups={groupList}
              />
            )}
            
            <div className="view-controls-container">
              {/* <button 
                className={`view-control-btn ${showAllGroups ? 'active' : ''}`}
                onClick={() => {
                  if (!showAllGroups) {
                    setSelectedGroup('');
                  }
                  setShowAllGroups(!showAllGroups);
                }}
              >
                {showAllGroups ? 'My Group Only' : 'All Groups'}
              </button> */}
              
              <button 
                className={`view-control-btn ${viewMode === 'hierarchy' ? 'active' : ''}`}
                onClick={() => setViewMode('hierarchy')}
              >
                Group By Team
              </button>
              
              <button 
                className={`view-control-btn ${viewMode === 'projects' ? 'active' : ''} ${showAllGroups ? 'disabled' : ''}`}
                onClick={() => !showAllGroups && setViewMode('projects')}
                disabled={showAllGroups}
                title={showAllGroups ? "Projects view not available when viewing all groups" : ""}
              >
                Group By Projects
              </button>
              
              <button 
                className={`view-control-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                All Staff
              </button>
            </div>
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
              {viewMode === 'hierarchy' ? (
                <>
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