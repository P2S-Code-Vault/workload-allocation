import React, { useState, useEffect } from 'react';
import { ProjectDataService } from '../services/ProjectDataService';
import { StaffService } from '../services/StaffService';
import WeekPicker from './WeekPicker';
import UserSelector from './UserSelector';
import headerLogo from '../P2S_Legence_Logo_White.png';

const Header = ({ onNavigate }) => {
  return (
    <header className="header">
      <img src={headerLogo} alt="Logo" className="header-logo" />
      <h1 className="header-title">Studio Leader Dashboard</h1>
      <div className="nav-buttons">
        <button 
          className="nav-button"
          onClick={() => onNavigate('main')}
        >
          Resource View
        </button>
        <button 
          className="nav-button"
          onClick={() => onNavigate('pm')}
        >
          PM View
        </button>
        <button 
          className="nav-button"
          onClick={() => onNavigate('gl')}
        >
          GL View
        </button>
      </div>
    </header>
  );
};

const SLPage = ({ onNavigate }) => {
  const [groupData, setGroupData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [changes, setChanges] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [projectData, setProjectData] = useState([]);
  const [suggestions, setSuggestions] = useState({});
  const [showDropdown, setShowDropdown] = useState({});
  const [selectedSL, setSelectedSL] = useState('');
  const [staffData, setStaffData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load staff data and project data
        const [projectDataResult, staffDataResult] = await Promise.all([
          ProjectDataService.loadProjectData(),
          StaffService.loadStaffData()
        ]);
        
        // Load all user resource allocation data from localStorage
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
        setProjectData(projectDataResult);
        setStaffData(staffDataResult);
      } catch (err) {
        setError('Failed to load data');
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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

  const formatPercent = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatLaborUsed = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };

  const calculateRatioB = (directHours, scheduledHours, ptoHours) => {
    const denominator = scheduledHours - ptoHours;
    if (denominator <= 0) return 0;
    return directHours / denominator;
  };

  const handleHoursChange = (resourceName, projectNumber, newHours) => {
    setGroupData(prevData => ({
      ...prevData,
      [resourceName]: {
        ...prevData[resourceName],
        rows: prevData[resourceName].rows.map(row => {
          if (row.projectNumber === projectNumber) {
            return { ...row, hours: parseFloat(newHours) || 0 };
          }
          return row;
        }),
        totalHours: prevData[resourceName].rows.reduce((sum, row) => {
          if (row.projectNumber === projectNumber) {
            return sum + (parseFloat(newHours) || 0);
          }
          return sum + (parseFloat(row.hours) || 0);
        }, 0)
      }
    }));

    // Track changes for saving
    setChanges(prev => ({
      ...prev,
      [`${resourceName}-${projectNumber}`]: newHours
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Saving changes:', changes);
      setChanges({}); // Clear changes after successful save
      alert('Changes saved successfully');
    } catch (err) {
      setError('Failed to save changes');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const addRowForResource = (resourceName) => {
    setGroupData(prevData => ({
      ...prevData,
      [resourceName]: {
        ...prevData[resourceName],
        rows: [
          ...prevData[resourceName].rows,
          {
            projectNumber: '',
            projectName: '',
            milestone: '',
            pm: '',
            labor: 0,
            pctLaborUsed: 0,
            actualMultiplierRate: 0,
            hours: 0,
            remarks: ''
          }
        ]
      }
    }));
  };

  const createSummaryData = (data) => {
    return Object.entries(data).map(([resourceName, resourceData]) => {
      const ptoHours = resourceData.rows
        .filter(row => 
          row.projectNumber.startsWith('0000-0000-0PTO') || 
          row.projectNumber.startsWith('0000-0000-0HOL')|| 
          row.projectNumber.startsWith('0000-0000-0SIC')
        )
        .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);

      const overheadHours = resourceData.rows
        .filter(row => 
          row.projectNumber.startsWith('0000-0000') && 
          !row.projectNumber.startsWith('0000-0000-0PTO') && 
          !row.projectNumber.startsWith('0000-0000-0HOL') &&
          !row.projectNumber.startsWith('0000-0000-0SIC')

        )
        .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);

      const directHours = resourceData.rows
        .filter(row => !row.projectNumber.startsWith('0000-0000'))
        .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);

      const userScheduledHours = parseInt(localStorage.getItem(`resourceAllocationScheduledHours_${resourceName}`)) || 40;

      return {
        resource: resourceName,
        directHours,
        ptoHours,
        overheadHours,
        scheduledHours: userScheduledHours,
        totalHours: resourceData.totalHours,
        ratioB: calculateRatioB(directHours, userScheduledHours, ptoHours)
      };
    })
    .sort((a, b) => a.resource.localeCompare(b.resource));
  };

  const handleProjectNumberChange = (resourceName, rowIndex, value) => {
    setGroupData(prevData => ({
      ...prevData,
      [resourceName]: {
        ...prevData[resourceName],
        rows: prevData[resourceName].rows.map((row, idx) => 
          idx === rowIndex ? { ...row, projectNumber: value } : row
        )
      }
    }));
  };

  const handleKeyPress = (resourceName, rowIndex, e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch(resourceName, rowIndex, e.target.value);
    }
  };

  const executeSearch = (resourceName, rowIndex, value) => {
    if (value.length >= 3) {
      const matches = ProjectDataService.searchProjects(projectData, value);
      setSuggestions({ ...suggestions, [`${resourceName}-${rowIndex}`]: matches });
      setShowDropdown({ ...showDropdown, [`${resourceName}-${rowIndex}`]: true });
    } else {
      setSuggestions({ ...suggestions, [`${resourceName}-${rowIndex}`]: [] });
      setShowDropdown({ ...showDropdown, [`${resourceName}-${rowIndex}`]: false });
    }
  };

  const handleProjectSelect = async (resourceName, rowIndex, project) => {
    let pctLaborUsed = project['Pct Labor Used'];
    
    // Try to get the latest EAC data from WorkloadPreloadService
    try {
      const { WorkloadPreloadService } = await import('../services/WorkloadPreloadService');
      const currentUserDetails = JSON.parse(localStorage.getItem('userDetails'));
      if (currentUserDetails?.email) {
        const latestEAC = await WorkloadPreloadService.getProjectEAC(currentUserDetails.email, project['Project Number']);
        
        // Use EAC from API if available, otherwise fall back to CSV data
        if (latestEAC > 0) {
          pctLaborUsed = latestEAC;
          console.log(`Updated EAC from API for project ${project['Project Number']}: ${pctLaborUsed}%`);
        }
      }
    } catch (eacError) {
      console.warn("Failed to retrieve latest EAC data for SLPage, using CSV value:", eacError);
    }
    
    setGroupData(prevData => ({
      ...prevData,
      [resourceName]: {
        ...prevData[resourceName],
        rows: prevData[resourceName].rows.map((row, idx) => 
          idx === rowIndex ? {
            ...row,
            projectNumber: project['Project Number'],
            projectName: project['Project Name'],
            labor: project['Labor'],
            pctLaborUsed: pctLaborUsed
          } : row
        )
      }
    }));
    setShowDropdown({ ...showDropdown, [`${resourceName}-${rowIndex}`]: false });
  };

  // Add this helper function to convert formats
  const convertToLastNameFirstName = (fullName) => {
    if (!fullName) return '';
    const [firstName, ...lastNameParts] = fullName.split(' ');
    const lastName = lastNameParts.join(' ');
    return `${lastName}, ${firstName}`;
  };

  // Update the filtering logic
  const filteredGroupData = Object.entries(groupData).reduce((acc, [key, value]) => {
    const staffMember = staffData.find(staff => staff.name === key);
    if (staffMember) { // Only include if user exists in staffData
      if (!selectedSL) {
        acc[key] = value;
      } else {
        const formattedSL = convertToLastNameFirstName(selectedSL);
        if (staffMember.studioLeaderName === formattedSL) {
          acc[key] = value;
        }
      }
    }
    return acc;
  }, {});

  return (
    <div className="page-layout">
      <Header onNavigate={onNavigate} />
      <main className="main-content">
        <div className="content-wrapper">
          <WeekPicker />
          <UserSelector 
            onUserChange={setSelectedSL}
            label="Studio Leader"
            selectedUser={selectedSL}
            filterByRole="Studio Leader"
            placeholder="Search for a studio leader..."
            updateLocalStorage={false}
          />
          <div className="group-summary">
            <h2>Resource Allocation by Team Member</h2>
            {error && <div className="error-banner">{error}</div>}
            {isLoading ? (
              <div className="loading">Loading resource data...</div>
            ) : (
              <>
                <div className="project-summary">
                  <h3>Summary by Resource</h3>
                  <table className="summary-table">
                    <thead>
                      <tr className="project-metrics">
                        <th>Resource</th>
                        <th>Direct Project Hours</th>
                        <th>PTO/HOL</th>
                        <th>Indirect Hours</th>
                        <th>Total Hours</th>
                        <th>Ratio B</th>
                      </tr>
                    </thead>
                    <tbody>
                      {createSummaryData(filteredGroupData).map((row, index) => (
                        <tr key={index}>
                          <td>{row.resource}</td>
                          <td className="number-cell">{formatter.format(row.directHours)}</td>
                          <td className="number-cell">{formatter.format(row.ptoHours)}</td>
                          <td className="number-cell">{formatter.format(row.overheadHours)}</td>
                          <td className="number-cell"><strong>{formatter.format(row.totalHours)}</strong></td>
                          <td className="number-cell"><strong>{formatPercent(row.ratioB)}</strong></td>
                        </tr>
                      ))}
                      {/* Add column totals row */}
                      <tr className="total-row">
                        <td><strong>Total</strong></td>
                        <td className="number-cell">
                          <strong>
                            {formatter.format(
                              createSummaryData(filteredGroupData).reduce((sum, row) => sum + row.directHours, 0)
                            )}
                          </strong>
                        </td>
                        <td className="number-cell">
                          <strong>
                            {formatter.format(
                              createSummaryData(filteredGroupData).reduce((sum, row) => sum + row.ptoHours, 0)
                            )}
                          </strong>
                        </td>
                        <td className="number-cell">
                          <strong>
                            {formatter.format(
                              createSummaryData(filteredGroupData).reduce((sum, row) => sum + row.overheadHours, 0)
                            )}
                          </strong>
                        </td>
                        <td className="number-cell">
                          <strong>
                            {formatter.format(
                              createSummaryData(filteredGroupData).reduce((sum, row) => sum + row.totalHours, 0)
                            )}
                          </strong>
                        </td>
                        <td className="number-cell">
                          <strong>
                            {formatPercent(
                              calculateRatioB(
                                createSummaryData(filteredGroupData).reduce((sum, row) => sum + row.directHours, 0),
                                createSummaryData(filteredGroupData).reduce((sum, row) => sum + row.scheduledHours, 0),
                                createSummaryData(filteredGroupData).reduce((sum, row) => sum + row.ptoHours, 0)
                              )
                            )}
                          </strong>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {Object.entries(filteredGroupData).map(([resourceName, data]) => (
                  <div key={resourceName} className="project-summary">
                    <h3>
                      {resourceName}
                      <button 
                        className="add-row-btn" 
                        onClick={() => addRowForResource(resourceName)}
                      >
                        Add Row
                      </button>
                    </h3>
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
                        {data.rows
                          .sort((a, b) => a.projectNumber.localeCompare(b.projectNumber))
                          .map((row, index) => (
                          <tr key={index}>
                            <td className="project-number-cell">
                              <div className="dropdown-container">
                                <input
                                  type="text"
                                  value={row.projectNumber}
                                  onChange={(e) => handleProjectNumberChange(resourceName, index, e.target.value)}
                                  onKeyPress={(e) => handleKeyPress(resourceName, index, e)}
                                  placeholder={isLoading ? "Loading..." : "Enter project number and press Enter..."}
                                  disabled={isLoading}
                                />
                                {showDropdown[`${resourceName}-${index}`] && suggestions[`${resourceName}-${index}`]?.length > 0 && (
                                  <div className="suggestions-dropdown">
                                    {suggestions[`${resourceName}-${index}`].map((project, i) => (
                                      <div
                                        key={i}
                                        className="suggestion-item"
                                        onClick={() => handleProjectSelect(resourceName, index, project)}
                                      >
                                        {project['Project Number']}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>{row.projectName}</td>
                            <td className="number-cell">
                              {row.projectNumber.startsWith('0000-0000') ? 
                                '-' : 
                                formatCurrency(row.labor)}
                            </td>
                            <td className={`number-cell ${
                              !row.projectNumber.startsWith('0000-0000') && (
                                row.pctLaborUsed >= 100 ? 'warning-cell' : 
                                row.pctLaborUsed >= 90 ? 'caution-cell' : ''
                              )
                            }`}>
                              {row.projectNumber.startsWith('0000-0000') ? 
                                '-' : 
                                formatLaborUsed(row.pctLaborUsed)}
                            </td>
                            <td className="number-cell">
                              <input
                                type="number"
                                value={row.hours}
                                onChange={(e) => handleHoursChange(resourceName, row.projectNumber, e.target.value)}
                                min="0"
                                step="0.1"
                                className="hours-input"
                              />
                              <div className="formatted-hours">{formatter.format(row.hours)}</div>
                            </td>
                          </tr>
                        ))}
                        <tr className="total-row">
                          <td colSpan="4" style={{ textAlign: 'right', paddingRight: 'var(--spacing-lg)' }}>
                            <strong>Total</strong>
                          </td>
                          <td className="number-cell">
                            <strong>{formatter.format(data.totalHours)}</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
                <div className="table-actions">
                  {Object.keys(changes).length > 0 && (
                    <button 
                      onClick={handleSave}
                      className="save-btn"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SLPage;