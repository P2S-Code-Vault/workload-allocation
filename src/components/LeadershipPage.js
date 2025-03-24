import React, { useState, useEffect } from 'react';
import { UserService } from '../services/UserService';
import { GLTeamService } from '../services/GLTeamService';
import WeekPicker from './WeekPicker';
import './LeadershipPage.css';
import { FaChevronDown, FaChevronRight, FaUserClock } from 'react-icons/fa';
import format from 'date-fns/format';
import { startOfWeek, endOfWeek } from 'date-fns';
import API_CONFIG from '../services/apiConfig';



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
                <th>Studio</th>
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
      <h3>All Staff Summary</h3>
      
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
            <th>Group Manager</th>
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
// const StaffTableView = ({ data, formatter, formatPercent }) => {
//   // Flatten all staff members from all managers and studios into a single array
//   const allStaff = Object.entries(data).flatMap(([manager, managerData]) =>
//     Object.entries(managerData.studios).flatMap(([studio, studioData]) =>
//       studioData.members.map(member => ({
//         ...member,
//         studio,
//         manager
//       }))
//     )
//   );

//   // Sort by manager, then studio, then name
//   const sortedStaff = allStaff.sort((a, b) => {
//     const managerCompare = a.manager.localeCompare(b.manager);
//     if (managerCompare !== 0) return managerCompare;
//     const studioCompare = a.studio.localeCompare(b.studio);
//     if (studioCompare !== 0) return studioCompare;
//     return a.name.localeCompare(b.name);
//   });

//   return (
//     <div className="project-summary">
//       <h3>All Staff Summary</h3>
//       <table className="summary-table">
//         <thead>
//           <tr>
//             <th>Group Manager</th>
//             <th>Studio</th>
//             <th>Team Member</th>
//             <th>Labor Category</th>
//             <th>Scheduled Hours</th>
//             <th>Direct Hours</th>
//             <th>PTO/HOL</th>
//             <th>Indirect Hours</th>
//             <th>Total Hours</th>
//             <th>Ratio B</th>
//           </tr>
//         </thead>
//         <tbody>
//           {sortedStaff.map((staff, index) => (
//             <tr key={index} title={`${staff.name} - ${staff.laborCategory}`}>
//               <td title={staff.manager}>{staff.manager}</td>
//               <td title={staff.studio}>{staff.studio}</td>
//               <td title={staff.name}>{staff.name}</td>
//               <td title={staff.laborCategory}>{staff.laborCategory}</td>
//               {/* <td className="number-cell">{formatter.format(staff.scheduledHours)}</td> */}
//               <td className="number-cell">
//                 {console.log(`Rendering ${staff.name} hours: ${staff.scheduledHours} (${typeof staff.scheduledHours})`)}
//                 {formatter.format(Number(staff.scheduledHours || 40))}
//               </td>
//               <td className="number-cell">{formatter.format(staff.directHours)}</td>
//               <td className="number-cell">{formatter.format(staff.ptoHours)}</td>
//               <td className="number-cell">{formatter.format(staff.overheadHours)}</td>
//               <td className={`number-cell ${staff.totalHours < staff.scheduledHours ? 'hours-warning' : ''}`}>
//                 <strong>{formatter.format(staff.totalHours)}</strong>
//               </td>
//               <td className="number-cell">
//                 <strong>{formatPercent(staff.ratioB)}</strong>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

const LeadershipPage = ({ navigate }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLeader, setSelectedLeader] = useState('');
  const [teamData, setTeamData] = useState({});
  const [weekStartDate, setWeekStartDate] = useState(null);
  const [weekEndDate, setWeekEndDate] = useState(null);
  const [viewMode, setViewMode] = useState('hierarchy'); // 'hierarchy' or 'table'
  const [currentUser, setCurrentUser] = useState(null);
  const [leaders, setLeaders] = useState([]);
  
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
        memberCount: members.length
      };
      
      // Process members and group by studio
      members.forEach(member => {
        // Get GroupName with detailed logging
        let studio = 'Unassigned';
        
        if (member.GroupName) {
          console.log(`Found GroupName for ${member.name}: ${member.GroupName}`);
          studio = member.GroupName;
        } else {
          console.log(`No GroupName found for ${member.name}, using 'Unassigned'`);
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
            overheadHours: 0
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
          hours: parseFloat(allocation.ra_hours || allocation.hours || 0),
          remarks: allocation.ra_remarks || allocation.remarks || ''
        }));
        
        const directHours = memberRows
          .filter(row => !row.projectNumber.startsWith('0000-0000'))
          .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);
          
        const ptoHours = memberRows
          .filter(row => 
            row.projectNumber.startsWith('0000-0000-0PTO') || 
            row.projectNumber.startsWith('0000-0000-0HOL')
          )
          .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);
          
        const overheadHours = memberRows
          .filter(row => 
            row.projectNumber.startsWith('0000-0000') && 
            !row.projectNumber.startsWith('0000-0000-0PTO') && 
            !row.projectNumber.startsWith('0000-0000-0HOL')
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
      
      // Log summary of studios that were created
      console.log("Studios created for group manager:", 
        Object.keys(allGroupsData[groupManager].studios)
      );
      
      // Log the total count of team members by studio
      Object.entries(allGroupsData[groupManager].studios).forEach(([studio, data]) => {
        console.log(`Studio: ${studio}, Member count: ${data.members.length}`);
      });
      
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

  // const loadTeamData = async () => {
  //   setIsLoading(true);
  //   setError(null);
    
  //   try {
  //     console.log("Loading leadership data for current user:", currentUser.email);
      
  //     // Use the group manager information stored during login
  //     const userGroupManager = currentUser.groupManager;
      
  //     if (!userGroupManager) {
  //       console.log("User is not assigned to any group");
  //       setTeamData({});
  //       setIsLoading(false);
  //       return;
  //     }
      
  //     console.log(`User belongs to group managed by: ${userGroupManager}`);
      
  //     // Find the group leader's email from the leaders list
  //     const foundLeader = leaders.find(leader => 
  //       leader.name === userGroupManager
  //     );
      
  //     if (!foundLeader) {
  //       console.log(`Cannot find leader details for: ${userGroupManager}`);
  //       setError(`Could not find group leader information for your group: ${userGroupManager}`);
  //       setTeamData({});
  //       setIsLoading(false);
  //       return;
  //     }
      
  //     console.log(`Found leader's email: ${foundLeader.email}`);
      
  //     // Only get team members for this specific group leader
  //     const members = await GLService.getTeamMembers(foundLeader.email);
      
  //     if (members.length === 0) {
  //       console.log("No team members found for this group");
  //       setTeamData({});
  //       setIsLoading(false);
  //       return;
  //     }
      
  //     // Print the full response for debugging
  //     console.log("Full team members response:", members);
      
  //     // Let's log each member's properties to verify GroupName
  //     members.forEach(member => {
  //       console.log(`Member ${member.name} properties:`, {
  //         id: member.id,
  //         email: member.email,
  //         GroupName: member.GroupName, // Check if this exists
  //         scheduledHours: member.scheduled_hours
  //       });
  //     });
      
  //     // Get emails for all team members
  //     const emails = members.map(member => member.email);
      
  //     // Get allocations for this time period
  //     const allocations = await GLService.getTeamAllocations(
  //       emails,
  //       format(weekStartDate, 'yyyy-MM-dd'),
  //       format(weekEndDate, 'yyyy-MM-dd')
  //     );
      
  //     // Structure the data
  //     const allGroupsData = {};
  //     const groupManager = userGroupManager;
      
  //     allGroupsData[groupManager] = {
  //       studios: {},
  //       totalHours: 0,
  //       scheduledHours: 0,
  //       directHours: 0,
  //       ptoHours: 0,
  //       overheadHours: 0,
  //       memberCount: members.length
  //     };
      
  //     // Process members and group by studio
  //     members.forEach(member => {
  //       // First, log the unmodified member data to verify hrs_worked_per_week
  //       console.log(`Raw member data for ${member.name}:`, member);
        
  //       // Get GroupName with detailed logging
  //       let studio = 'Unassigned';
        
  //       if (member.GroupName) {
  //         console.log(`Found GroupName for ${member.name}: ${member.GroupName}`);
  //         studio = member.GroupName;
  //       } else {
  //         console.log(`No GroupName found for ${member.name}, using 'Unassigned'`);
  //       }
        
  //       // Ensure scheduledHours is consistently a number
  //       let scheduledHours = 40.0; // Default value
        
  //       if (member.scheduled_hours !== null && member.scheduled_hours !== undefined) {
  //         // Convert to number if it's not already
  //         scheduledHours = Number(member.scheduled_hours);
          
  //         // Handle NaN case
  //         if (isNaN(scheduledHours)) {
  //           console.warn(`Invalid hours value for ${member.name}: ${member.scheduled_hours}, using default 40`);
  //           scheduledHours = 40.0;
  //         }
  //       }
        
  //       console.log(`Processing member: ${member.name}, Studio: ${studio}, Hours: ${scheduledHours} (type: ${typeof scheduledHours})`);
        
  //       // Initialize studio if needed
  //       if (!allGroupsData[groupManager].studios[studio]) {
  //         allGroupsData[groupManager].studios[studio] = {
  //           members: [],
  //           totalHours: 0,
  //           scheduledHours: 0,
  //           directHours: 0,
  //           ptoHours: 0,
  //           overheadHours: 0
  //         };
  //       }
        
  //       // Filter allocations for this member
  //       const memberAllocations = allocations.filter(a => a.email === member.email);
        
  //       // Calculate hours by category
  //       const memberRows = memberAllocations.map(allocation => ({
  //         projectNumber: allocation.proj_id || allocation.project_number || '',
  //         projectName: allocation.project_name || '',
  //         milestone: allocation.milestone_name || '',
  //         pm: allocation.project_manager || '',
  //         hours: parseFloat(allocation.ra_hours || allocation.hours || 0),
  //         remarks: allocation.ra_remarks || allocation.remarks || ''
  //       }));
        
  //       const directHours = memberRows
  //         .filter(row => !row.projectNumber.startsWith('0000-0000'))
  //         .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);
          
  //       const ptoHours = memberRows
  //         .filter(row => 
  //           row.projectNumber.startsWith('0000-0000-0PTO') || 
  //           row.projectNumber.startsWith('0000-0000-0HOL')
  //         )
  //         .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);
          
  //       const overheadHours = memberRows
  //         .filter(row => 
  //           row.projectNumber.startsWith('0000-0000') && 
  //           !row.projectNumber.startsWith('0000-0000-0PTO') && 
  //           !row.projectNumber.startsWith('0000-0000-0HOL')
  //         )
  //         .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);
          
  //       const totalHours = directHours + ptoHours + overheadHours;
        
  //       // Add member to studio
  //       allGroupsData[groupManager].studios[studio].members.push({
  //         id: member.id,
  //         name: member.name,
  //         email: member.email,
  //         laborCategory: member.labor_category || '',
  //         scheduledHours: scheduledHours,  // Consistently a number
  //         directHours,
  //         ptoHours, 
  //         overheadHours,
  //         totalHours,
  //         ratioB: calculateRatioB(directHours, scheduledHours, ptoHours),
  //         rows: memberRows
  //       });
        
  //       // Update studio totals
  //       console.log(`Adding to studio ${studio}: Current=${allGroupsData[groupManager].studios[studio].scheduledHours}, Adding=${scheduledHours}`);
  //       allGroupsData[groupManager].studios[studio].totalHours += totalHours;
  //       allGroupsData[groupManager].studios[studio].scheduledHours += scheduledHours; // Now a number
  //       allGroupsData[groupManager].studios[studio].directHours += directHours;
  //       allGroupsData[groupManager].studios[studio].ptoHours += ptoHours;
  //       allGroupsData[groupManager].studios[studio].overheadHours += overheadHours;
        
  //       // Update manager totals
  //       allGroupsData[groupManager].totalHours += totalHours;
  //       allGroupsData[groupManager].scheduledHours += scheduledHours; // Now a number
  //       allGroupsData[groupManager].directHours += directHours;
  //       allGroupsData[groupManager].ptoHours += ptoHours;
  //       allGroupsData[groupManager].overheadHours += overheadHours;
  //     });
      
  //     // Calculate ratio B for studios and manager
  //     Object.keys(allGroupsData[groupManager].studios).forEach(studio => {
  //       const studioData = allGroupsData[groupManager].studios[studio];
  //       studioData.ratioB = calculateRatioB(
  //         studioData.directHours,
  //         studioData.scheduledHours,
  //         studioData.ptoHours
  //       );
  //     });
      
  //     allGroupsData[groupManager].ratioB = calculateRatioB(
  //       allGroupsData[groupManager].directHours,
  //       allGroupsData[groupManager].scheduledHours,
  //       allGroupsData[groupManager].ptoHours
  //     );
      
  //     // Log summary of studios that were created
  //     console.log("Studios created for group manager:", 
  //       Object.keys(allGroupsData[groupManager].studios)
  //     );
      
  //     // Log the total count of team members by studio
  //     Object.entries(allGroupsData[groupManager].studios).forEach(([studio, data]) => {
  //       console.log(`Studio: ${studio}, Member count: ${data.members.length}`);
  //     });
      
  //     console.log("FINAL DATA STRUCTURE:", JSON.stringify(allGroupsData, null, 2));
  //     setTeamData(allGroupsData);
  //   } catch (err) {
  //     console.error("Error loading team data:", err);
  //     setError(`Failed to load team data: ${err.message}`);
  //     setTeamData({});
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

// Also make sure your useEffect looks like this:
useEffect(() => {
  if (!currentUser || !weekStartDate || !weekEndDate || leaders.length === 0) {
    return;
  }
  
  loadTeamData();
}, [currentUser, weekStartDate, weekEndDate, leaders]);

  // Calculate RatioB
  const calculateRatioB = (directHours, scheduledHours, ptoHours, lwopHours = 0) => {
    const denominator = scheduledHours - ptoHours - lwopHours;
    if (denominator <= 0) return 0;
    return directHours / denominator;
  };

  // Format numbers
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  });
  
  const formatPercent = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };

  return (
    <div className="page-layout">
      <main className="gl-dashboard">
        <div className="content-wrapper">
          <WeekPicker onWeekChange={handleWeekChange} />
          <div className="view-toggle">
            <button 
              className={`toggle-button ${viewMode === 'hierarchy' ? 'active' : ''}`}
              onClick={() => setViewMode('hierarchy')}
            >
              Group By Team
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
              <h2>Resource Allocation by Group</h2>
              
              {viewMode === 'hierarchy' ? (
                <>
                  {/* Summary table for all managers */}
                  <div className="project-summary">
                    <h3>Group Manager Summary</h3>
                    <table className="summary-table">
                      <thead>
                        <tr className="project-metrics">
                          <th>Group Manager</th>
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
              ) : (
                <StaffTableView 
                  // data={teamData}
                  weekStartDate={weekStartDate}
                  weekEndDate={weekEndDate}
                  formatter={formatter}
                  formatPercent={formatPercent}
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