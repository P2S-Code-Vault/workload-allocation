import React, { useState, useEffect, useRef } from 'react';
import WeekPicker from './WeekPicker';
import { format } from 'date-fns';
import PMDashboardService from '../services/PMDashboardService';

// PMSelector Component
const PMSelector = ({ onPMChange, selectedPM, projectManagers = [] }) => {
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

  const filteredPMs = searchTerm 
    ? projectManagers.filter(pm => 
        pm.toLowerCase().includes(searchTerm.toLowerCase()))
    : projectManagers;

  return (
    <div className="user-selector">
      <div className="user-selector-container" ref={dropdownRef}>
        <div className="current-user">
          <span>Filter by PM:</span>
          <strong>{selectedPM || 'All Projects'}</strong>
          <button 
            className="change-user-btn"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            Change PM
          </button>
        </div>
        
        {showDropdown && (
          <div className="user-dropdown">
            <input
              type="text"
              placeholder="Search project manager..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="user-search"
              autoFocus
            />
            
            <ul className="user-list">
              <li 
                onClick={() => {
                  onPMChange('');
                  setShowDropdown(false);
                }}
                className="user-list-item"
              >
                <div className="user-name">Show All Projects</div>
              </li>
              {filteredPMs.map((pm, index) => (
                <li 
                  key={index}
                  onClick={() => {
                    onPMChange(pm);
                    setShowDropdown(false);
                  }}
                  className="user-list-item"
                >
                  <div className="user-name">{pm}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Main PM Page Component
const PMPage = ({ navigate }) => {
  const [dashboardData, setDashboardData] = useState({ projects: [], summary: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPM, setSelectedPM] = useState('');
  const [projectManagers, setProjectManagers] = useState([]);
  const [weekStartDate, setWeekStartDate] = useState(null);
  const [weekEndDate, setWeekEndDate] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Format functions
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value) => {
    // If the value is over 1000, assume it's been multiplied by 100 twice
    const divisor = value > 1000 ? 10000 : 100;
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / divisor);
  };

  // const formatPercent = (value) => {
  //   return new Intl.NumberFormat('en-US', {
  //     style: 'percent',
  //     minimumFractionDigits: 1,
  //     maximumFractionDigits: 1,
  //   }).format(value / 100);
  // };

  // Load project managers on component mount
  useEffect(() => {
    const loadProjectManagers = async () => {
      try {
        const managers = await PMDashboardService.getAllProjectManagers();
        setProjectManagers(managers);
      } catch (err) {
        console.error('Error loading project managers:', err);
        setError('Failed to load project managers. Please try refreshing the page.');
      }
    };
    
    loadProjectManagers();
  }, []);

  // Handle week change
  const handleWeekChange = (startDate, endDate) => {
    console.log("PM dashboard week changed:", {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });
    setWeekStartDate(startDate);
    setWeekEndDate(endDate);
    setRetryCount(0); // Reset retry counter when dates change
  };
  
  // Handle retry button click
  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setRetryCount(retryCount + 1);
  };

  // Load dashboard data when week dates or selected PM changes
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!weekStartDate || !weekEndDate) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await PMDashboardService.getPMDashboardData(
          format(weekStartDate, 'yyyy-MM-dd'),
          format(weekEndDate, 'yyyy-MM-dd'),
          selectedPM || null
        );
        
        setDashboardData(data);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Failed to load project data. ' + (err.message || 'Please try again later.'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, [weekStartDate, weekEndDate, selectedPM, retryCount]);

  return (
    <div className="content-wrapper">
      <div className="table-container">
        <WeekPicker onWeekChange={handleWeekChange} />
        <PMSelector 
          onPMChange={setSelectedPM}
          selectedPM={selectedPM}
          projectManagers={projectManagers.map(pm => pm.name || '')}
        />
        <div className="pm-dashboard">
          <h2>Project Planning Summary</h2>
          
          {/* Error display with retry button */}
          {error && (
            <div className="error-banner">
              <p>{error}</p>
              <button className="retry-button" onClick={handleRetry}>
                Retry
              </button>
            </div>
          )}
          
          {isLoading ? (
            <div className="loading">Loading summary data...</div>
          ) : dashboardData.projects.length === 0 ? (
            <div className="no-data">
              {selectedPM 
                ? `No projects found for ${selectedPM} in the selected date range.`
                : 'No projects found for the selected date range.'}
            </div>
          ) : (
            dashboardData.projects.map((project) => (
              <div key={project.projectNumber} className="project-summary">
                <h3>
                  {project.projectNumber} - {project.name}
                </h3>
                <table className="summary-table">
                  <thead>
                    <tr className="project-metrics">
                      <th>Project Manager</th>
                      <th>Contract Total Labor</th>
                      <th>% EAC Labor Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="project-metrics">
                      <td className="number-cell">{project.pm || 'N/A'}</td>
                      <td className="number-cell">{formatCurrency(project.labor)}</td>
                      <td className={`number-cell ${
                        project.laborUsed >= 100 ? 'warning-cell' : 
                        project.laborUsed >= 90 ? 'caution-cell' : ''
                      }`}>
                        {formatPercent(project.laborUsed)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <table className="summary-table resource-details">
                  <thead>
                    <tr>
                      <th>Resource</th>
                      <th>Labor Grade</th>
                      <th>Planned Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.resources.map((resource, index) => (
                      <tr key={index}>
                        <td>{resource.name}</td>
                        <td>{resource.laborCategory}</td>
                        <td className="number-cell">{formatNumber(resource.hours)}</td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td colSpan="2"><strong style={{ textAlign: 'right', display: 'block' }}>Total Hours</strong></td>
                      <td className="number-cell">
                        <strong>{formatNumber(project.totalHours)}</strong>
                      </td>
                    </tr>
                    <tr className="total-row">
                      <td colSpan="2"><strong style={{ textAlign: 'right', display: 'block' }}>Projected Cost</strong></td>
                      <td className="number-cell">
                        <strong>{formatCurrency(project.totalCost)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PMPage;

