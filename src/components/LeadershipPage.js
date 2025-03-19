// import React, { useState, useEffect } from 'react';
// import { StaffService } from '../services/StaffService';
// import WeekPicker from './WeekPicker';
// import UserSelector from './UserSelector';
// import './LeadershipPage.css';
// import { FaChevronDown, FaChevronRight, FaUserClock } from 'react-icons/fa';


// const CollapsibleGroup = ({ manager, managerData, formatter, formatPercent }) => {
//   const [isExpanded, setIsExpanded] = useState(false);
  
//   return (
//     <div className="collapsible-group">
//       <div 
//         className="collapsible-header"
//         onClick={() => setIsExpanded(!isExpanded)}
//       >
//         {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
//         <h3>{manager} Group</h3>
//       </div>
      
//       {isExpanded && (
//         <div className="collapsible-content">
//           {/* Studio Summary Table */}
//           <table className="summary-table">
//             <thead>
//               <tr className="project-metrics">
//                 <th>Studio</th>
//                 <th>Team Members</th>
//                 <th>Scheduled Hours</th>
//                 <th>Direct Hours</th>
//                 <th>PTO/HOL</th>
//                 <th>Indirect Hours</th>
//                 <th>Total Hours</th>
//                 <th>Ratio B</th>
//               </tr>
//             </thead>
//             <tbody>
//               {Object.entries(managerData.studios).map(([studio, studioData], index) => (
//                 <tr key={index}>
//                   <td>{studio}</td>
//                   <td className="number-cell">{studioData.members.length}</td>
//                   <td className="number-cell">{formatter.format(studioData.scheduledHours)}</td>
//                   <td className="number-cell">{formatter.format(studioData.directHours)}</td>
//                   <td className="number-cell">{formatter.format(studioData.ptoHours)}</td>
//                   <td className="number-cell">{formatter.format(studioData.overheadHours)}</td>
//                   <td className="number-cell"><strong>{formatter.format(studioData.totalHours)}</strong></td>
//                   <td className="number-cell"><strong>{formatPercent(studioData.ratioB)}</strong></td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           {/* Studio Details with Collapsible Members */}
//           {Object.entries(managerData.studios).map(([studio, studioData]) => (
//             <CollapsibleStudio 
//               key={studio}
//               studio={studio}
//               studioData={studioData}
//               formatter={formatter}
//               formatPercent={formatPercent}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// const CollapsibleStudio = ({ studio, studioData, formatter, formatPercent }) => {
//   const [isExpanded, setIsExpanded] = useState(false);
  
//   return (
//     <div className="collapsible-studio">
//       <div 
//         className="collapsible-header"
//         onClick={() => setIsExpanded(!isExpanded)}
//       >
//         {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
//         <h4>{studio}</h4>
//       </div>
      
//       {isExpanded && (
//         <table className="summary-table">
//           <thead>
//             <tr className="project-metrics">
//               <th>Team Member</th>
//               <th>Labor Category</th>
//               <th>Scheduled Hours</th>
//               <th>Direct Hours</th>
//               <th>PTO/HOL</th>
//               <th>Indirect Hours</th>
//               <th>Total Hours</th>
//               <th>Ratio B</th>
//               <th>Details</th>
//             </tr>
//           </thead>
//           <tbody>
//             {studioData.members
//               .sort((a, b) => a.name.localeCompare(b.name))
//               .map((member, index) => (
//                 <CollapsibleMember 
//                   key={index}
//                   member={member}
//                   formatter={formatter}
//                   formatPercent={formatPercent}
//                 />
//               ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// };

// const CollapsibleMember = ({ member, formatter, formatPercent }) => {
//   const [isExpanded, setIsExpanded] = useState(false);
  
//   // Sort rows by project number
//   const sortedRows = [...(member.rows || [])].sort((a, b) => 
//     a.projectNumber.localeCompare(b.projectNumber)
//   );
  
//   return (
//     <>
//       <tr>
//         <td>{member.name}</td>
//         <td>{member.laborCategory}</td>
//         <td className="number-cell">{formatter.format(member.scheduledHours)}</td>
//         <td className="number-cell">{formatter.format(member.directHours)}</td>
//         <td className="number-cell">{formatter.format(member.ptoHours)}</td>
//         <td className="number-cell">{formatter.format(member.overheadHours)}</td>
//         <td className={`number-cell ${member.totalHours < member.scheduledHours ? 'hours-warning' : ''}`}>
//           <strong>{formatter.format(member.totalHours)}</strong>
//         </td>
//         <td className="number-cell"><strong>{formatPercent(member.ratioB)}</strong></td>
//         <td>
//           <button 
//             className="expand-details-btn"
//             onClick={(e) => {
//               e.preventDefault();
//               setIsExpanded(!isExpanded);
//             }}
//           >
//             <FaUserClock />
//           </button>
//         </td>
//       </tr>
//       {isExpanded && (
//         <tr className="member-details">
//           <td colSpan="9">
//             <div className="time-entries">
//               <h5>Time Entries</h5>
//               {sortedRows.length === 0 ? (
//                 <div className="no-entries">No time entries found</div>
//               ) : (
//                 sortedRows.map((entry, i) => (
//                   <div key={i} className="time-entry">
//                     <span className="project-number">{entry.projectNumber}</span>
//                     <span className="project-name">{entry.projectName}</span>
//                     <span className="number-cell">{formatter.format(entry.hours)}</span>
//                   </div>
//                 ))
//               )}
//             </div>
//           </td>
//         </tr>
//       )}
//     </>
//   );
// };

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
//               <td className="number-cell">{formatter.format(staff.scheduledHours)}</td>
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


// const LeadershipPage = ({ onNavigate }) => {
//   const [groupData, setGroupData] = useState({});
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedLeader, setSelectedLeader] = useState('');
//   const [staffData, setStaffData] = useState([]);
//   const [viewMode, setViewMode] = useState('hierarchy'); // Add this line near other state declarations

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

//   // Add formatters
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

//   // Update the Ratio B calculation to match main page
//   const calculateRatioB = (directHours, scheduledHours, ptoHours, lwopHours = 0) => {
//     const denominator = scheduledHours - ptoHours - lwopHours;
//     if (denominator <= 0) return 0;
//     return directHours / denominator;
//   };

//   // Update the grouping function to handle the new structure
//   const groupByManager = () => {
//     const managerGroups = {};
    
//     // First group by Group Manager
//     Object.entries(groupData).forEach(([resourceName, resourceData]) => {
//       const staffMember = staffData.find(staff => staff.name === resourceName);
//       if (!staffMember) return;
      
//       const groupManager = staffMember.groupManager || 'Unassigned';
//       const studio = staffMember.studioLeader || 'Unassigned'; // Use Resource_Studio_Leader__c field
      
//       // Get scheduled hours from localStorage
//       const scheduledHoursKey = `resourceAllocationScheduledHours_${resourceName}`;
//       const scheduledHours = parseInt(localStorage.getItem(scheduledHoursKey)) || 40;
      
//       if (!managerGroups[groupManager]) {
//         managerGroups[groupManager] = {
//           studios: {},
//           totalHours: 0,
//           scheduledHours: 0,
//           directHours: 0,
//           ptoHours: 0,
//           overheadHours: 0,
//           memberCount: 0
//         };
//       }

//       if (!managerGroups[groupManager].studios[studio]) {
//         managerGroups[groupManager].studios[studio] = {
//           members: [],
//           totalHours: 0,
//           scheduledHours: 0,
//           directHours: 0,
//           ptoHours: 0,
//           overheadHours: 0
//         };
//       }
      
//       const ptoHours = resourceData.rows
//         .filter(row => 
//           row.projectNumber.startsWith('0000-0000-0PTO') || 
//           row.projectNumber.startsWith('0000-0000-0HOL')
//         )
//         .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);
      
//       const overheadHours = resourceData.rows
//         .filter(row => 
//           row.projectNumber.startsWith('0000-0000') && 
//           !row.projectNumber.startsWith('0000-0000-0PTO') && 
//           !row.projectNumber.startsWith('0000-0000-0HOL')
//         )
//         .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);
      
//       const directHours = resourceData.rows
//         .filter(row => !row.projectNumber.startsWith('0000-0000'))
//         .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);

//       // Add member to studio group with scheduled hours
//       managerGroups[groupManager].studios[studio].members.push({
//         name: resourceName,
//         laborCategory: staffMember.laborCategory,
//         scheduledHours,
//         totalHours: resourceData.totalHours,
//         directHours,
//         ptoHours,
//         overheadHours,
//         ratioB: calculateRatioB(directHours, scheduledHours, ptoHours),
//         rows: resourceData.rows // Add this line to include the rows data
//       });
      
//       // Update studio totals
//       managerGroups[groupManager].studios[studio].totalHours += resourceData.totalHours;
//       managerGroups[groupManager].studios[studio].scheduledHours += scheduledHours;
//       managerGroups[groupManager].studios[studio].directHours += directHours;
//       managerGroups[groupManager].studios[studio].ptoHours += ptoHours;
//       managerGroups[groupManager].studios[studio].overheadHours += overheadHours;
      
//       // Update manager totals
//       managerGroups[groupManager].totalHours += resourceData.totalHours;
//       managerGroups[groupManager].scheduledHours += scheduledHours;
//       managerGroups[groupManager].directHours += directHours;
//       managerGroups[groupManager].ptoHours += ptoHours;
//       managerGroups[groupManager].overheadHours += overheadHours;
//       managerGroups[groupManager].memberCount++;
//     });
    
//     // Calculate ratio B for each studio and manager - updated calculation
//     Object.keys(managerGroups).forEach(manager => {
//       Object.keys(managerGroups[manager].studios).forEach(studio => {
//         const studioData = managerGroups[manager].studios[studio];
//         studioData.ratioB = calculateRatioB(
//           studioData.directHours,
//           studioData.scheduledHours,
//           studioData.ptoHours
//         );

//         // Update member ratioB calculations
//         studioData.members.forEach(member => {
//           member.ratioB = calculateRatioB(
//             member.directHours,
//             member.scheduledHours,
//             member.ptoHours
//           );
//         });
//       });
      
//       managerGroups[manager].ratioB = calculateRatioB(
//         managerGroups[manager].directHours,
//         managerGroups[manager].scheduledHours,
//         managerGroups[manager].ptoHours
//       );
//     });
    
//     return managerGroups;
//   };

//   // Update the filtering function
//   const getFilteredData = () => {
//     const managerGroups = groupByManager();
    
//     // Sort studios within each manager group
//     Object.values(managerGroups).forEach(manager => {
//       manager.studios = Object.fromEntries(
//         Object.entries(manager.studios).sort(([a], [b]) => a.localeCompare(b))
//       );
//     });

//     if (!selectedLeader) {
//       return managerGroups;
//     }
    
//     // Convert selected leader to match data format (Last, First)
//     const parts = selectedLeader.split(' ');
//     const formattedLeader = parts.length > 1 
//       ? `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`
//       : selectedLeader;
    
//     // Return only the selected group manager's data
//     return Object.entries(managerGroups)
//       .filter(([manager]) => manager === formattedLeader)
//       .reduce((acc, [key, value]) => {
//         acc[key] = value;
//         return acc;
//       }, {});
//   };

//   return (
//     <div className="page-layout">
//       {/* <Header onNavigate={onNavigate} /> */}
//       <main className="gl-dashboard">
//         <div className="content-wrapper">
//           <WeekPicker />
//           <UserSelector 
//             onUserChange={setSelectedLeader}
//             label="Group Manager"
//             selectedUser={selectedLeader}
//             filterByRole="Group Manager"
//             placeholder="Search for a group manager..."
//             updateLocalStorage={false}
//           />
//           <div className="view-toggle">
//             <button 
//               className={`toggle-button ${viewMode === 'hierarchy' ? 'active' : ''}`}
//               onClick={() => setViewMode('hierarchy')}
//             >
//               Group By Team
//             </button>
//             <button 
//               className={`toggle-button ${viewMode === 'table' ? 'active' : ''}`}
//               onClick={() => setViewMode('table')}
//             >
//               All Staff
//             </button>
//           </div>
//           {error && <div className="error-banner">{error}</div>}
//           {isLoading ? (
//             <div className="loading">Loading data...</div>
//           ) : (
//             <div className="group-summary">
//               <h2>Resource Allocation by Group</h2>
              
//               {viewMode === 'hierarchy' ? (
//                 <>
//                   {/* Summary table for all managers */}
//                   <div className="project-summary">
//                     <h3>Group Manager Summary</h3>
//                     <table className="summary-table">
//                       <thead>
//                         <tr className="project-metrics">
//                           <th>Group Manager</th>
//                           <th>Team Members</th>
//                           <th>Scheduled Hours</th>
//                           <th>Direct Hours</th>
//                           <th>PTO/HOL</th>
//                           <th>Indirect Hours</th>
//                           <th>Total Hours</th>
//                           <th>Ratio B</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {Object.entries(getFilteredData()).map(([manager, data], index) => (
//                           <tr key={index}>
//                             <td>{manager}</td>
//                             <td className="number-cell">{data.memberCount}</td>
//                             <td className="number-cell">{formatter.format(data.scheduledHours)}</td>
//                             <td className="number-cell">{formatter.format(data.directHours)}</td>
//                             <td className="number-cell">{formatter.format(data.ptoHours)}</td>
//                             <td className="number-cell">{formatter.format(data.overheadHours)}</td>
//                             <td className="number-cell"><strong>{formatter.format(data.totalHours)}</strong></td>
//                             <td className="number-cell"><strong>{formatPercent(data.ratioB)}</strong></td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
                  
//                   {/* Detailed tables for each manager and their studios */}
//                   {Object.entries(getFilteredData()).map(([manager, managerData]) => (
//                     <CollapsibleGroup
//                       key={manager}
//                       manager={manager}
//                       managerData={managerData}
//                       formatter={formatter}
//                       formatPercent={formatPercent}
//                     />
//                   ))}
//                 </>
//               ) : (
//                 <StaffTableView 
//                   data={getFilteredData()}
//                   formatter={formatter}
//                   formatPercent={formatPercent}
//                 />
//               )}
//             </div>
//           )}
//         </div>
//       </main>
//       {/* <Footer /> */}
//     </div>
//   );
// };

// export default LeadershipPage;


// components/LeadershipPage.js
import React, { useState, useEffect } from 'react';
import { UserService } from '../services/UserService';
import { GLService } from '../services/GLService';
import WeekPicker from './WeekPicker';
import './LeadershipPage.css';
import { FaChevronDown, FaChevronRight, FaUserClock } from 'react-icons/fa';
import format from 'date-fns/format';
import { startOfWeek, endOfWeek } from 'date-fns';


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
        <td className="number-cell">{formatter.format(member.scheduledHours)}</td>
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

const StaffTableView = ({ data, formatter, formatPercent }) => {
  // Flatten all staff members from all managers and studios into a single array
  const allStaff = Object.entries(data).flatMap(([manager, managerData]) =>
    Object.entries(managerData.studios).flatMap(([studio, studioData]) =>
      studioData.members.map(member => ({
        ...member,
        studio,
        manager
      }))
    )
  );

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
              <td className="number-cell">{formatter.format(staff.scheduledHours)}</td>
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

const LeadershipPage = ({ navigate }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLeader, setSelectedLeader] = useState('');
  const [teamData, setTeamData] = useState({});
  const [weekStartDate, setWeekStartDate] = useState(null);
  const [weekEndDate, setWeekEndDate] = useState(null);
  const [viewMode, setViewMode] = useState('hierarchy'); // 'hierarchy' or 'table'
  const [currentUser, setCurrentUser] = useState(null);
  
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

  // Load team data
useEffect(() => {
  if (!currentUser || !weekStartDate || !weekEndDate) return;
  
  const loadTeamData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Loading leadership data");
      
      // Get all team members for the current user (who should be a group leader)
      const members = await GLService.getTeamMembers(currentUser.email);
      
      if (members.length === 0) {
        setTeamData({});
        setIsLoading(false);
        return;
      }
      
      // Get all emails
      const emails = members.map(member => member.email);
      
      // Get allocations for all team members
      const allocations = await GLService.getTeamAllocations(
        emails,
        format(weekStartDate, 'yyyy-MM-dd'),
        format(weekEndDate, 'yyyy-MM-dd')
      );
      
      // Structure the data for the component
      const teamDataStructure = {};
      const groupManager = currentUser.name || 'Unassigned'; // Use the logged-in user as the group manager
      
      teamDataStructure[groupManager] = {
        studios: {},
        totalHours: 0,
        scheduledHours: 0,
        directHours: 0,
        ptoHours: 0,
        overheadHours: 0,
        memberCount: members.length
      };
      
      // Group members by studio
      members.forEach(member => {
        // Use GroupName instead of studio_leader for the studio name
        const studio = member.GroupName || 'Unassigned';
        
        if (!teamDataStructure[groupManager].studios[studio]) {
          teamDataStructure[groupManager].studios[studio] = {
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
        const scheduledHours = member.hrs_worked_per_week || 40;
        
        // Add member to studio
        teamDataStructure[groupManager].studios[studio].members.push({
          id: member.contact_id,
          name: member.full_name || member.name,
          email: member.email,
          laborCategory: member.labor_category || '',
          scheduledHours,
          directHours,
          ptoHours, 
          overheadHours,
          totalHours,
          ratioB: calculateRatioB(directHours, scheduledHours, ptoHours),
          rows: memberRows
        });
        
        // Update studio totals
        teamDataStructure[groupManager].studios[studio].totalHours += totalHours;
        teamDataStructure[groupManager].studios[studio].scheduledHours += scheduledHours;
        teamDataStructure[groupManager].studios[studio].directHours += directHours;
        teamDataStructure[groupManager].studios[studio].ptoHours += ptoHours;
        teamDataStructure[groupManager].studios[studio].overheadHours += overheadHours;
        
        // Update manager totals
        teamDataStructure[groupManager].totalHours += totalHours;
        teamDataStructure[groupManager].scheduledHours += scheduledHours;
        teamDataStructure[groupManager].directHours += directHours;
        teamDataStructure[groupManager].ptoHours += ptoHours;
        teamDataStructure[groupManager].overheadHours += overheadHours;
      });
      
      // Calculate ratio B for studios and manager
      Object.keys(teamDataStructure).forEach(manager => {
        Object.keys(teamDataStructure[manager].studios).forEach(studio => {
          const studioData = teamDataStructure[manager].studios[studio];
          studioData.ratioB = calculateRatioB(
            studioData.directHours,
            studioData.scheduledHours,
            studioData.ptoHours
          );
        });
        
        teamDataStructure[manager].ratioB = calculateRatioB(
          teamDataStructure[manager].directHours,
          teamDataStructure[manager].scheduledHours,
          teamDataStructure[manager].ptoHours
        );
      });
      
      setTeamData(teamDataStructure);
      console.log("Team data structured:", teamDataStructure);
    } catch (err) {
      console.error("Error loading team data:", err);
      setError(`Failed to load team data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  loadTeamData();
}, [currentUser, weekStartDate, weekEndDate]);

  // // Load team data
  // useEffect(() => {
  //   if (!currentUser || !weekStartDate || !weekEndDate) return;
    
  //   const loadTeamData = async () => {
  //     setIsLoading(true);
  //     setError(null);
      
  //     try {
  //       console.log("Loading leadership data");
        
  //       // Get all team members for the current user (who should be a group leader)
  //       const members = await GLService.getTeamMembers(currentUser.email);
        
  //       if (members.length === 0) {
  //         setTeamData({});
  //         setIsLoading(false);
  //         return;
  //       }
        
  //       // Get all emails
  //       const emails = members.map(member => member.email);
        
  //       // Get allocations for all team members
  //       const allocations = await GLService.getTeamAllocations(
  //         emails,
  //         format(weekStartDate, 'yyyy-MM-dd'),
  //         format(weekEndDate, 'yyyy-MM-dd')
  //       );
        
  //       // Structure the data for the component
  //       const teamDataStructure = {};
  //       const groupManager = currentUser.name || 'Unassigned'; // Use the logged-in user as the group manager
        
  //       teamDataStructure[groupManager] = {
  //         studios: {},
  //         totalHours: 0,
  //         scheduledHours: 0,
  //         directHours: 0,
  //         ptoHours: 0,
  //         overheadHours: 0,
  //         memberCount: members.length
  //       };
        
  //       // Group members by studio
  //       members.forEach(member => {
  //         const studio = member.studio_leader || 'Unassigned';
          
  //         if (!teamDataStructure[groupManager].studios[studio]) {
  //           teamDataStructure[groupManager].studios[studio] = {
  //             members: [],
  //             totalHours: 0,
  //             scheduledHours: 0,
  //             directHours: 0,
  //             ptoHours: 0,
  //             overheadHours: 0
  //           };
  //         }
          
  //         // Filter allocations for this member
  //         const memberAllocations = allocations.filter(a => a.email === member.email);
          
  //         // Calculate hours by category
  //         const memberRows = memberAllocations.map(allocation => ({
  //           projectNumber: allocation.proj_id || allocation.project_number || '',
  //           projectName: allocation.project_name || '',
  //           milestone: allocation.milestone_name || '',
  //           pm: allocation.project_manager || '',
  //           hours: parseFloat(allocation.ra_hours || allocation.hours || 0),
  //           remarks: allocation.ra_remarks || allocation.remarks || ''
  //         }));
          
  //         const directHours = memberRows
  //           .filter(row => !row.projectNumber.startsWith('0000-0000'))
  //           .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);
            
  //         const ptoHours = memberRows
  //           .filter(row => 
  //             row.projectNumber.startsWith('0000-0000-0PTO') || 
  //             row.projectNumber.startsWith('0000-0000-0HOL')
  //           )
  //           .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);
            
  //         const overheadHours = memberRows
  //           .filter(row => 
  //             row.projectNumber.startsWith('0000-0000') && 
  //             !row.projectNumber.startsWith('0000-0000-0PTO') && 
  //             !row.projectNumber.startsWith('0000-0000-0HOL')
  //           )
  //           .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);
            
  //         const totalHours = directHours + ptoHours + overheadHours;
  //         const scheduledHours = member.scheduled_hours || 40;
          
  //         // Add member to studio
  //         teamDataStructure[groupManager].studios[studio].members.push({
  //           id: member.id,
  //           name: member.name,
  //           email: member.email,
  //           laborCategory: member.labor_category || '',
  //           scheduledHours,
  //           directHours,
  //           ptoHours, 
  //           overheadHours,
  //           totalHours,
  //           ratioB: calculateRatioB(directHours, scheduledHours, ptoHours),
  //           rows: memberRows
  //         });
          
  //         // Update studio totals
  //         teamDataStructure[groupManager].studios[studio].totalHours += totalHours;
  //         teamDataStructure[groupManager].studios[studio].scheduledHours += scheduledHours;
  //         teamDataStructure[groupManager].studios[studio].directHours += directHours;
  //         teamDataStructure[groupManager].studios[studio].ptoHours += ptoHours;
  //         teamDataStructure[groupManager].studios[studio].overheadHours += overheadHours;
          
  //         // Update manager totals
  //         teamDataStructure[groupManager].totalHours += totalHours;
  //         teamDataStructure[groupManager].scheduledHours += scheduledHours;
  //         teamDataStructure[groupManager].directHours += directHours;
  //         teamDataStructure[groupManager].ptoHours += ptoHours;
  //         teamDataStructure[groupManager].overheadHours += overheadHours;
  //       });
        
  //       // Calculate ratio B for studios and manager
  //       Object.keys(teamDataStructure).forEach(manager => {
  //         Object.keys(teamDataStructure[manager].studios).forEach(studio => {
  //           const studioData = teamDataStructure[manager].studios[studio];
  //           studioData.ratioB = calculateRatioB(
  //             studioData.directHours,
  //             studioData.scheduledHours,
  //             studioData.ptoHours
  //           );
  //         });
          
  //         teamDataStructure[manager].ratioB = calculateRatioB(
  //           teamDataStructure[manager].directHours,
  //           teamDataStructure[manager].scheduledHours,
  //           teamDataStructure[manager].ptoHours
  //         );
  //       });
        
  //       setTeamData(teamDataStructure);
  //       console.log("Team data structured:", teamDataStructure);
  //     } catch (err) {
  //       console.error("Error loading team data:", err);
  //       setError(`Failed to load team data: ${err.message}`);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
    
  //   loadTeamData();
  // }, [currentUser, weekStartDate, weekEndDate]);

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
              No team members found. Please verify your Group Leader status.
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
                  data={teamData}
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