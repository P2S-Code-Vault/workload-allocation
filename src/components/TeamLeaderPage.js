import React, { useState, useEffect } from 'react';
import { StaffService } from '../services/StaffService';
import WeekPicker from './WeekPicker';
import UserSelector from './UserSelector';
import headerLogo from '../P2S_Legence_Logo_White.png';

const Header = ({ onNavigate, selectedRole }) => {
  return (
    <header className="header">
      <img src={headerLogo} alt="Logo" className="header-logo" />
      <h1 className="header-title">{selectedRole === 'gl' ? 'Group Leader' : 'Studio Leader'} Dashboard</h1>
      <div className="nav-buttons">
        <button className="nav-button" onClick={() => onNavigate('main')}>
          Resource View
        </button>
        <button className="nav-button" onClick={() => onNavigate('pm')}>
          PM View
        </button>
      </div>
    </header>
  );
};

const PMView = ({ data, formatCurrency, formatLaborUsed, formatter }) => {
  const allRows = Object.entries(data).flatMap(([resource, resourceData]) =>
    resourceData.rows
      .filter(row => !row.projectNumber.startsWith('0000-0000'))
      .map(row => ({
        ...row,
        resource
      }))
  );

  const pmGroups = allRows.reduce((groups, row) => {
    const pm = row.pm || 'Unassigned';
    if (!groups[pm]) {
      groups[pm] = {
        rows: new Map(),
        totalHours: 0
      };
    }
    
    if (!groups[pm].rows.has(row.projectNumber)) {
      groups[pm].rows.set(row.projectNumber, {
        ...row,
        totalHours: parseFloat(row.hours) || 0
      });
    } else {
      const existingProject = groups[pm].rows.get(row.projectNumber);
      existingProject.totalHours += parseFloat(row.hours) || 0;
    }
    
    groups[pm].totalHours += parseFloat(row.hours) || 0;
    return groups;
  }, {});

  return (
    <div className="pm-summary">
      <h2>Resource Allocation by Project Manager</h2>
      {Object.entries(pmGroups).sort(([a], [b]) => a.localeCompare(b)).map(([pm, group]) => (
        <div key={pm} className="project-summary">
          <h3>{pm}</h3>
          <table className="summary-table">
            <thead>
              <tr className="project-metrics">
                <th>Project Number</th>
                <th>Project Name</th>
                <th>Contract Total Labor</th>
                <th>% EAC Labor Used</th>
                <th>Planned Hours</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(group.rows.values()).map((row, index) => (
                <tr key={index}>
                  <td>{row.projectNumber}</td>
                  <td>{row.projectName}</td>
                  <td className="number-cell">{formatCurrency(row.labor)}</td>
                  <td className={`number-cell ${
                    row.pctLaborUsed >= 100 ? 'warning-cell' : 
                    row.pctLaborUsed >= 90 ? 'caution-cell' : ''
                  }`}>
                    {formatLaborUsed(row.pctLaborUsed)}
                  </td>
                  <td className="number-cell">{formatter.format(row.totalHours)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan="4" style={{ textAlign: 'right', paddingRight: 'var(--spacing-lg)' }}>
                  <strong>Total</strong>
                </td>
                <td className="number-cell">
                  <strong>{formatter.format(group.totalHours)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

const TeamLeaderPage = ({ onNavigate }) => {
  const [currentRole, setCurrentRole] = useState('gl'); // 'gl' or 'sl'
  const [groupData, setGroupData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('resource');
  const [selectedLeader, setSelectedLeader] = useState('');
  const [staffData, setStaffData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load staff data
        const staffDataResult = await StaffService.loadStaffData();
        setStaffData(staffDataResult);

        // Load user data from localStorage
        const allGroupData = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('resourceAllocationRows_')) {
            const userName = key.replace('resourceAllocationRows_', '');
            const userData = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(userData) && userData.length > 0) {
              allGroupData[userName] = {
                rows: userData,
                totalHours: userData.reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0)
              };
            }
          }
        }
        
        setGroupData(allGroupData);
      } catch (err) {
        setError('Failed to load data');
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Add formatters
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  const formatCurrency = (value) => {
    const numValue = parseFloat(value) || 0;
    // If the amount is less than 0.50, display as $0 to avoid rounding to $1
    if (numValue < 0.50) {
      return '$0';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  const formatLaborUsed = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  const calculateRatioB = (directHours, ptoHours, totalHours) => {
    const denominator = totalHours - ptoHours;
    if (denominator <= 0) return 0;
    return directHours / denominator;
  };

  // Add the name format conversion function
  const convertToLastNameFirstName = (fullName) => {
    if (!fullName) return '';
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ');
    return `${lastName}, ${firstName}`;
  };

  // Modify getFilteredData to handle both GL and SL roles
  const getFilteredData = () => {
    return Object.entries(groupData).reduce((acc, [key, value]) => {
      const staffMember = staffData.find(staff => staff.name === key);
      if (staffMember) {
        if (!selectedLeader) {
          acc[key] = {
            ...value,
            studioLeaderName: staffMember.studioLeaderName || 'Unassigned'
          };
        } else {
          const formattedLeader = convertToLastNameFirstName(selectedLeader);
          const matchesRole = currentRole === 'gl' 
            ? staffMember.groupManager === formattedLeader
            : staffMember.studioLeaderName === formattedLeader;
          
          if (matchesRole) {
            acc[key] = {
              ...value,
              studioLeaderName: staffMember.studioLeaderName || 'Unassigned'
            };
          }
        }
      }
      return acc;
    }, {});
  };

  return (
    <div className="page-layout">
      <Header onNavigate={onNavigate} selectedRole={currentRole} />
      <main className="gl-dashboard">
        <div className="content-wrapper">
          <WeekPicker />
          <div className="role-toggle">
            <button 
              className={`toggle-button ${currentRole === 'gl' ? 'active' : ''}`}
              onClick={() => setCurrentRole('gl')}
            >
              Group Leader View
            </button>
            <button 
              className={`toggle-button ${currentRole === 'sl' ? 'active' : ''}`}
              onClick={() => setCurrentRole('sl')}
            >
              Studio Leader View
            </button>
          </div>
          <div className="view-toggle">
            <button 
              className={`toggle-button ${currentView === 'resource' ? 'active' : ''}`}
              onClick={() => setCurrentView('resource')}
            >
              Resource View
            </button>
            <button 
              className={`toggle-button ${currentView === 'pm' ? 'active' : ''}`}
              onClick={() => setCurrentView('pm')}
            >
              PM View
            </button>
          </div>
          <UserSelector 
            onUserChange={setSelectedLeader}
            label={currentRole === 'gl' ? "Group Leader" : "Studio Leader"}
            selectedUser={selectedLeader}
            filterByRole={currentRole === 'gl' ? "Group Manager" : "Studio Leader"}
            placeholder={`Search for a ${currentRole === 'gl' ? 'group' : 'studio'} leader...`}
            updateLocalStorage={false}
          />
          {error && <div className="error-banner">{error}</div>}
          {isLoading ? (
            <div className="loading">Loading data...</div>
          ) : currentView === 'resource' ? (
            // Resource view content
            <div className="group-summary">
              {/* Display content here */}
            </div>
          ) : (
            // PM view content
            <PMView 
              data={getFilteredData()} 
              formatCurrency={formatCurrency}
              formatLaborUsed={formatLaborUsed}
              formatter={formatter}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default TeamLeaderPage;
