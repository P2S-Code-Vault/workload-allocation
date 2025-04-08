// import React, { useState, useEffect } from 'react';
// import { GLDataService } from '../services/GLDataService';
// import { StaffService } from '../services/StaffService';
// import WeekPicker from './WeekPicker';
// import UserSelector from './UserSelector';
// import headerLogo from '../P2S_Legence_Logo_White.png';

// const Header = ({ onNavigate }) => {
//   return (
//     <header className="header">
//       <img src={headerLogo} alt="Logo" className="header-logo" />
//       <h1 className="header-title">Group Leader Dashboard</h1>
//       <div className="nav-buttons">
//         <button 
//           className="nav-button"
//           onClick={() => onNavigate('main')}
//         >
//           Resource View
//         </button>
//         <button 
//           className="nav-button"
//           onClick={() => onNavigate('sl')}
//         >
//           SL View
//         </button>
//         <button 
//           className="nav-button"
//           onClick={() => onNavigate('pm')}
//         >
//           PM View
//         </button>
//       </div>
//     </header>
//   );
// };

// const GLPage = ({ onNavigate }) => {
//   const [groupData, setGroupData] = useState({});
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [currentView, setCurrentView] = useState('resource');
//   const [selectedGL, setSelectedGL] = useState('');
//   const [staffData, setStaffData] = useState([]);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         setIsLoading(true);
//         setError(null);
        
//         // Load staff data
//         const staffDataResult = await StaffService.loadStaffData();
//         setStaffData(staffDataResult);

//         // Load user data from localStorage
//         const allGroupData = {};
//         for (let i = 0; i < localStorage.length; i++) {
//           const key = localStorage.key(i);
//           if (key.startsWith('resourceAllocationRows_')) {
//             const userName = key.replace('resourceAllocationRows_', '');
//             const userData = JSON.parse(localStorage.getItem(key));
//             if (Array.isArray(userData) && userData.length > 0) {
//               allGroupData[userName] = {
//                 rows: userData,
//                 totalHours: userData.reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0)
//               };
//             }
//           }
//         }
        
//         setGroupData(allGroupData);
//       } catch (err) {
//         setError('Failed to load data');
//         console.error('Error:', err);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadData();
//   }, []);

//   const formatter = new Intl.NumberFormat('en-US', {
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 2
//   });

//   const formatCurrency = (value) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(value);
//   };

//   const formatPercent = (value) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'percent',
//       minimumFractionDigits: 1,
//       maximumFractionDigits: 1,
//     }).format(value);
//   };

//   const formatLaborUsed = (value) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'percent',
//       minimumFractionDigits: 1,
//       maximumFractionDigits: 1,
//     }).format(value / 100);
//   };

//   const calculateRatioB = (directHours, scheduledHours, ptoHours, lwopHours = 0) => {
//     const denominator = scheduledHours - ptoHours - lwopHours;
//     if (denominator <= 0) return 0;
//     return directHours / denominator;
//   };

//   const createSummaryData = (data) => {
//     const studioGroups = {};
    
//     // Group by Studio Leader first
//     Object.entries(data).forEach(([resourceName, resourceData]) => {
//       const staffMember = staffData.find(staff => staff.name === resourceName);
//       // Use studioLeaderName directly from staff data
//       const studioLeader = staffMember?.studioLeaderName || 'Unassigned';
      
//       if (!studioGroups[studioLeader]) {
//         studioGroups[studioLeader] = {
//           totalHours: 0,
//           projects: {}
//         };
//       }
      
//       resourceData.rows.forEach(row => {
//         if (!studioGroups[studioLeader].projects[row.projectNumber]) {
//           studioGroups[studioLeader].projects[row.projectNumber] = {
//             ...row,
//             hours: parseFloat(row.hours) || 0
//           };
//         } else {
//           studioGroups[studioLeader].projects[row.projectNumber].hours += parseFloat(row.hours) || 0;
//         }
//         studioGroups[studioLeader].totalHours += parseFloat(row.hours) || 0;
//       });
//     });

//     return Object.entries(studioGroups).map(([studioLeader, studioData]) => {
//       const projects = Object.values(studioData.projects);
      
//       const directHours = projects
//         .filter(proj => !proj.projectNumber.startsWith('0000-0000'))
//         .reduce((sum, proj) => sum + proj.hours, 0);

//       const ptoHours = projects
//         .filter(proj => 
//           proj.projectNumber.startsWith('0000-0000-0PTO') || 
//           proj.projectNumber.startsWith('0000-0000-0HOL')
//         )
//         .reduce((sum, proj) => sum + proj.hours, 0);

//       const overheadHours = projects
//         .filter(proj => 
//           proj.projectNumber.startsWith('0000-0000') && 
//           !proj.projectNumber.startsWith('0000-0000-0PTO') && 
//           !proj.projectNumber.startsWith('0000-0000-0HOL')
//         )
//         .reduce((sum, proj) => sum + proj.hours, 0);

//       return {
//         studio: studioLeader,
//         directHours,
//         ptoHours,
//         overheadHours,
//         scheduledHours: projects.length * 40, // Default to 40 per resource
//         totalHours: studioData.totalHours,
//         ratioB: calculateRatioB(directHours, projects.length * 40, ptoHours)
//       };
//     })
//     .sort((a, b) => a.studio.localeCompare(b.studio));
//   };

//   const PMView = ({ data }) => {
//     const allRows = Object.entries(data).flatMap(([resource, resourceData]) =>
//       resourceData.rows
//         .filter(row => !row.projectNumber.startsWith('0000-0000'))
//         .map(row => ({
//           ...row,
//           resource
//         }))
//     );

//     const pmGroups = allRows.reduce((groups, row) => {
//       const pm = row.pm || 'Unassigned';
//       if (!groups[pm]) {
//         groups[pm] = {
//           rows: new Map(),
//           totalHours: 0
//         };
//       }
      
//       if (!groups[pm].rows.has(row.projectNumber)) {
//         groups[pm].rows.set(row.projectNumber, {
//           ...row,
//           totalHours: parseFloat(row.hours) || 0
//         });
//       } else {
//         const existingProject = groups[pm].rows.get(row.projectNumber);
//         existingProject.totalHours += parseFloat(row.hours) || 0;
//       }
      
//       groups[pm].totalHours += parseFloat(row.hours) || 0;
//       return groups;
//     }, {});

//     return (
//       <div className="pm-summary">
//         <h2>Resource Allocation by Project Manager</h2>
//         {Object.entries(pmGroups).sort(([a], [b]) => a.localeCompare(b)).map(([pm, group]) => (
//           <div key={pm} className="project-summary">
//             <h3>{pm}</h3>
//             <table className="summary-table">
//               <thead>
//                 <tr className="project-metrics">
//                   <th>Project Number</th>
//                   <th>Project Name</th>
//                   <th>Contract Total Labor</th>
//                   <th>% EAC Labor Used</th>
//                   <th>Planned Hours</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {Array.from(group.rows.values()).map((row, index) => (
//                   <tr key={index}>
//                     <td>{row.projectNumber}</td>
//                     <td>{row.projectName}</td>
//                     <td className="number-cell">{formatCurrency(row.labor)}</td>
//                     <td className={`number-cell ${
//                       row.pctLaborUsed >= 100 ? 'warning-cell' : 
//                       row.pctLaborUsed >= 90 ? 'caution-cell' : ''
//                     }`}>
//                       {formatLaborUsed(row.pctLaborUsed)}
//                     </td>
//                     <td className="number-cell">{formatter.format(row.totalHours)}</td>
//                   </tr>
//                 ))}
//                 <tr className="total-row">
//                   <td colSpan="4" style={{ textAlign: 'right', paddingRight: 'var(--spacing-lg)' }}>
//                     <strong>Total</strong>
//                   </td>
//                   <td className="number-cell">
//                     <strong>{formatter.format(group.totalHours)}</strong>
//                   </td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>
//         ))}
//       </div>
//     );
//   };

//   const convertToLastNameFirstName = (fullName) => {
//     if (!fullName) return '';
//     const [firstName, ...lastNameParts] = fullName.split(' ');
//     const lastName = lastNameParts.join(' ');
//     return `${lastName}, ${firstName}`;
//   };

//   const getFilteredData = () => {
//     // Only include users that exist in staffData and add their studioLeaderName
//     const filteredData = Object.entries(groupData).reduce((acc, [key, value]) => {
//       const staffMember = staffData.find(staff => staff.name === key);
//       if (staffMember) { // Only include if user exists in staffData
//         if (!selectedGL) {
//           acc[key] = {
//             ...value,
//             studioLeaderName: staffMember.studioLeaderName || 'Unassigned'
//           };
//         } else {
//           const formattedGL = convertToLastNameFirstName(selectedGL);
//           if (staffMember.groupManager === formattedGL) {
//             acc[key] = {
//               ...value,
//               studioLeaderName: staffMember.studioLeaderName || 'Unassigned'
//             };
//           }
//         }
//       }
//       return acc;
//     }, {});

//     return filteredData;
//   };

//   return (
//     <div className="page-layout">
//       <Header onNavigate={onNavigate} />
//       <main className="gl-dashboard">
//         <div className="content-wrapper">
//           <WeekPicker />
//           <div className="view-toggle">
//             <button 
//               className={`toggle-button ${currentView === 'resource' ? 'active' : ''}`}
//               onClick={() => setCurrentView('resource')}
//             >
//               Studio
//             </button>
//             <button 
//               className={`toggle-button ${currentView === 'pm' ? 'active' : ''}`}
//               onClick={() => setCurrentView('pm')}
//             >
//               Project Manager
//             </button>
//           </div>
//           <UserSelector 
//             onUserChange={setSelectedGL}
//             label="Group Leader"
//             selectedUser={selectedGL}
//             filterByRole="Group Manager" // This will now use isGroupManager flag from Staff.csv
//             placeholder="Search for a group manager..."
//             updateLocalStorage={false}
//           />
//           {error && <div className="error-banner">{error}</div>}
//           {isLoading ? (
//             <div className="loading">Loading data...</div>
//           ) : (
//             currentView === 'resource' ? (
//               <div className="group-summary">
//                 <h2>Resource Allocation by Studio</h2>
//                 <div className="project-summary">
//                   <h3>Summary by Studio</h3>
//                   <table className="summary-table">
//                     <thead>
//                       <tr className="project-metrics">
//                         <th>Studio Leader</th>
//                         <th>Direct Project Hours</th>
//                         <th>PTO/HOL</th>
//                         <th>Indirect Hours</th>
//                         <th>Total Hours</th>
//                         <th>Ratio B</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {createSummaryData(getFilteredData()).map((row, index) => (
//                         <tr key={index}>
//                           <td>{row.studio}</td>
//                           <td className="number-cell">{formatter.format(row.directHours)}</td>
//                           <td className="number-cell">{formatter.format(row.ptoHours)}</td>
//                           <td className="number-cell">{formatter.format(row.overheadHours)}</td>
//                           <td className="number-cell"><strong>{formatter.format(row.totalHours)}</strong></td>
//                           <td className="number-cell"><strong>{formatPercent(row.ratioB)}</strong></td>
//                         </tr>
//                       ))}
//                       <tr className="total-row">
//                         <td><strong>Total</strong></td>
//                         <td className="number-cell">
//                           <strong>
//                             {formatter.format(
//                               createSummaryData(getFilteredData()).reduce((sum, row) => sum + row.directHours, 0)
//                             )}
//                           </strong>
//                         </td>
//                         <td className="number-cell">
//                           <strong>
//                             {formatter.format(
//                               createSummaryData(getFilteredData()).reduce((sum, row) => sum + row.ptoHours, 0)
//                             )}
//                           </strong>
//                         </td>
//                         <td className="number-cell">
//                           <strong>
//                             {formatter.format(
//                               createSummaryData(getFilteredData()).reduce((sum, row) => sum + row.overheadHours, 0)
//                             )}
//                           </strong>
//                         </td>
//                         <td className="number-cell">
//                           <strong>
//                             {formatter.format(
//                               createSummaryData(getFilteredData()).reduce((sum, row) => sum + row.totalHours, 0)
//                             )}
//                           </strong>
//                         </td>
//                         <td className="number-cell">
//                           <strong>
//                             {formatPercent(
//                               calculateRatioB(
//                                 createSummaryData(getFilteredData()).reduce((sum, row) => sum + row.directHours, 0),
//                                 createSummaryData(getFilteredData()).reduce((sum, row) => sum + row.totalHours, 0),
//                                 createSummaryData(getFilteredData()).reduce((sum, row) => sum + row.ptoHours, 0)
//                               )
//                             )}
//                           </strong>
//                         </td>
//                       </tr>
//                     </tbody>
//                   </table>
//                 </div>

//                 {Object.entries(GLDataService.groupProjectsByStudio(getFilteredData())).map(([studio, studioData]) => (
//                   <div key={studio} className="project-summary">
//                     <h3>{studio}</h3>
//                     <table className="summary-table">
//                       <thead>
//                         <tr className="project-metrics">
//                           <th>Project Number</th>
//                           <th>Project Name</th>
//                           <th>Contract Total Labor</th>
//                           <th>% EAC Labor Used</th>
//                           <th>Planned Hours</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {Object.values(studioData.projects)
//                           .sort((a, b) => a.projectNumber.localeCompare(b.projectNumber))
//                           .map((project, index) => (
//                           <tr key={index}>
//                             <td>{project.projectNumber}</td>
//                             <td>{project.projectName}</td>
//                             <td className="number-cell">
//                               {project.projectNumber.startsWith('0000-0000') ? 
//                                 '-' : 
//                                 formatCurrency(project.labor)}
//                             </td>
//                             <td className={`number-cell ${
//                               !project.projectNumber.startsWith('0000-0000') && (
//                                 project.pctLaborUsed >= 100 ? 'warning-cell' : 
//                                 project.pctLaborUsed >= 90 ? 'caution-cell' : ''
//                               )
//                             }`}>
//                               {project.projectNumber.startsWith('0000-0000') ? 
//                                 '-' : 
//                                 formatLaborUsed(project.pctLaborUsed)}
//                             </td>
//                             <td className="number-cell">{formatter.format(project.hours)}</td>
//                           </tr>
//                         ))}
//                         <tr className="total-row">
//                           <td colSpan="4" style={{ textAlign: 'right', paddingRight: 'var(--spacing-lg)' }}>
//                             <strong>Total</strong>
//                           </td>
//                           <td className="number-cell">
//                             <strong>{formatter.format(studioData.totalHours)}</strong>
//                           </td>
//                         </tr>
//                       </tbody>
//                     </table>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <PMView data={getFilteredData()} />
//             )
//           )}
//         </div>
//       </main>
//     </div>
//   );
// };

// export default GLPage;

import React, { useState, useEffect } from 'react';
import { UserService } from '../services/UserService';
import { GLService } from '../services/GLService';
import WeekPicker from './WeekPicker';
import UserSelector from './UserSelector';
import TeamMemberPanel from './TeamMemberPanel';
import headerLogo from '../P2S_Legence_Logo_White.png';
import format from 'date-fns/format';
import { startOfWeek, endOfWeek } from 'date-fns';
import './GLView.css';

const Header = ({ onNavigate }) => {
  return (
    <header className="header">
      <img src={headerLogo} alt="Logo" className="header-logo" />
      <h1 className="header-title">Group Leader Dashboard</h1>
      <div className="nav-buttons">
        <button 
          className="nav-button"
          onClick={() => onNavigate('resource')}
        >
          Main Views
        </button>
        <button 
          className="nav-button"
          onClick={() => onNavigate('pm')}
        >
          PM View
        </button>
        <button 
          className="nav-button"
          onClick={() => onNavigate('leadership')}
        >
          Leadership View
        </button>
      </div>
    </header>
  );
};

// Main GL View component
const GLView = ({ onNavigate }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamAllocations, setTeamAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weekStartDate, setWeekStartDate] = useState(null);
  const [weekEndDate, setWeekEndDate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ success: false, message: '' });
  const [showSaveStatus, setShowSaveStatus] = useState(false);
  const [viewMode, setViewMode] = useState('team'); // 'team' or 'project'
  const [studioGroups, setStudioGroups] = useState({});
  
  // Initialize user and date range
  useEffect(() => {
    const userDetails = UserService.getCurrentUserDetails();
    if (userDetails) {
      setCurrentUser(userDetails);
    }
    
    // Set default week to current week
    const today = new Date();
    const startDate = startOfWeek(today, { weekStartsOn: 0 });
    const endDate = endOfWeek(today, { weekStartsOn: 0 });
    setWeekStartDate(startDate);
    setWeekEndDate(endDate);
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
  
  // Load team members and allocations
  useEffect(() => {
    if (!currentUser || !weekStartDate || !weekEndDate) return;
    
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Loading GL data for user:", currentUser.email);
        
        // Get team members
        const members = await GLService.getTeamMembers(currentUser.email);
        setTeamMembers(members);
        
        if (members.length > 0) {
          // Get allocations for all team members
          const emails = members.map(member => member.email);
          const allocations = await GLService.getTeamAllocations(
            emails,
            format(weekStartDate, 'yyyy-MM-dd'),
            format(weekEndDate, 'yyyy-MM-dd')
          );
          
          setTeamAllocations(allocations);
          
          // Group members by studio leader
          const studios = {};
          members.forEach(member => {
            const studioLeader = member.studioLeader || 'Unassigned';
            if (!studios[studioLeader]) {
              studios[studioLeader] = [];
            }
            studios[studioLeader].push(member);
          });
          
          setStudioGroups(studios);
        }
      } catch (err) {
        console.error("Error loading GL data:", err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [currentUser, weekStartDate, weekEndDate]);
  
  // Handle updates to allocations
  const handleAllocationUpdate = async (updates) => {
    if (!updates || updates.length === 0) return;
    
    setIsSaving(true);
    setSaveStatus({ success: false, message: '' });
    
    try {
      const result = await GLService.batchUpdateAllocations(updates);
      
      // Show success message
      setSaveStatus({ 
        success: true, 
        message: `Successfully updated ${updates.length} allocations` 
      });
      
      // Refresh allocations data
      if (teamMembers.length > 0) {
        const emails = teamMembers.map(member => member.email);
        const allocations = await GLService.getTeamAllocations(
          emails,
          format(weekStartDate, 'yyyy-MM-dd'),
          format(weekEndDate, 'yyyy-MM-dd')
        );
        
        setTeamAllocations(allocations);
      }
    } catch (err) {
      setSaveStatus({ 
        success: false, 
        message: `Failed to update allocations: ${err.message}` 
      });
    } finally {
      setIsSaving(false);
      
      // Show status message for 3 seconds
      setShowSaveStatus(true);
      setTimeout(() => {
        setShowSaveStatus(false);
      }, 3000);
    }
  };
  
  // Calculate summary statistics
  const calculateSummary = () => {
    const summary = {
      totalMembers: teamMembers.length,
      totalHours: 0,
      directHours: 0,
      ptoHours: 0,
      overheadHours: 0
    };
    
    teamAllocations.forEach(allocation => {
      const hours = parseFloat(allocation.hours || allocation.ra_hours) || 0;
      const projectNumber = allocation.project_number || allocation.proj_id || '';
      
      summary.totalHours += hours;
      
      if (projectNumber.startsWith('0000-0000-0PTO') || 
          projectNumber.startsWith('0000-0000-0HOL')) {
        summary.ptoHours += hours;
      } else if (projectNumber.startsWith('0000-0000')) {
        summary.overheadHours += hours;
      } else {
        summary.directHours += hours;
      }
    });
    
    // Calculate ratio B
    const denominator = summary.totalHours - summary.ptoHours;
    summary.ratioB = denominator > 0 ? summary.directHours / denominator : 0;
    
    return summary;
  };
  
  const summary = calculateSummary();
  
  // Format numbers
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };
  
  const formatPercent = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };

  return (
    <div className="page-layout">
      <Header onNavigate={onNavigate} />
      <main className="gl-dashboard">
        <div className="content-wrapper">
          <div className="dashboard-controls">
            <WeekPicker onWeekChange={handleWeekChange} />
            
            <div className="view-toggle">
              <button 
                className={`toggle-button ${viewMode === 'team' ? 'active' : ''}`}
                onClick={() => setViewMode('team')}
              >
                Team View
              </button>
              <button 
                className={`toggle-button ${viewMode === 'project' ? 'active' : ''}`}
                onClick={() => setViewMode('project')}
              >
                Project View
              </button>
            </div>
          </div>
          
          {showSaveStatus && (
            <div className={`status-message ${saveStatus.success ? 'success' : 'error'}`}>
              {saveStatus.message}
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="dashboard-summary">
            <div className="summary-card">
              <div className="summary-title">Team Members</div>
              <div className="summary-value">{summary.totalMembers}</div>
            </div>
            <div className="summary-card">
              <div className="summary-title">Total Hours</div>
              <div className="summary-value">{formatNumber(summary.totalHours)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-title">Direct Hours</div>
              <div className="summary-value">{formatNumber(summary.directHours)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-title">PTO/Holiday</div>
              <div className="summary-value">{formatNumber(summary.ptoHours)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-title">Ratio B</div>
              <div className="summary-value">{formatPercent(summary.ratioB)}</div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="loading-indicator">Loading team data...</div>
          ) : viewMode === 'team' ? (
            <div className="team-view">
              {Object.entries(studioGroups).length === 0 ? (
                <div className="no-data-message">
                  No team members found. Please verify your Group Leader status.
                </div>
              ) : (
                Object.entries(studioGroups).map(([studioLeader, members]) => (
                  <div key={studioLeader} className="studio-section">
                    <h3 className="studio-header">{studioLeader}</h3>
                    <div className="team-members-list">
                      {members.map(member => (
                        <TeamMemberPanel
                          key={member.id}
                          member={member}
                          allocations={teamAllocations.filter(a => a.email === member.email)}
                          onUpdate={handleAllocationUpdate}
                          disabled={isSaving}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="project-view">
              <h2>Project View Coming Soon</h2>
              <p>This view will allow you to see allocations grouped by project.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GLView;