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