import React, { useState, useEffect } from "react";
import { UserService } from "../services/UserService";
import { GLService } from "../services/GLService";
import QuarterPicker from "./QuarterPicker";
import UserSelector from "./UserSelector";
import TeamMemberPanel from "./TeamMemberPanel";
import headerLogo from "../P2S_Legence_Logo_White.png";
import format from "date-fns/format";
import "./GLView.css";

const Header = ({ onNavigate }) => {
  return (
    <header className="header">
      <img src={headerLogo} alt="Logo" className="header-logo" />
      <h1 className="header-title">Group Leader Dashboard</h1>
      <div className="nav-buttons">
        <button className="nav-button" onClick={() => onNavigate("resource")}>
          Main Views
        </button>
        <button className="nav-button" onClick={() => onNavigate("pm")}>
          PM View
        </button>
        <button className="nav-button" onClick={() => onNavigate("leadership")}>
          Leadership View
        </button>
      </div>
    </header>
  );
};

const defaultQuarterMonths = {
  1: [0, 1, 2],
  2: [3, 4, 5],
  3: [6, 7, 8],
  4: [9, 10, 11],
};
const getQuarterMonths = (quarter) => {
  return defaultQuarterMonths[quarter] || [0, 1, 2];
};

// Main GL View component
const GLView = ({ onNavigate }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamAllocations, setTeamAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ success: false, message: "" });
  const [showSaveStatus, setShowSaveStatus] = useState(false);
  const [viewMode, setViewMode] = useState("team");
  const [studioGroups, setStudioGroups] = useState({});

  // Initialize user
  useEffect(() => {
    const userDetails = UserService.getCurrentUserDetails();
    if (userDetails) {
      setCurrentUser(userDetails);
    }
  }, []);

  // Load team members and allocations for the selected quarter/year
  useEffect(() => {
    if (!currentUser || !selectedQuarter || !selectedYear) return;
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const members = await GLService.getTeamMembers(currentUser.email);
        setTeamMembers(members);
        if (members.length > 0) {
          const emails = members.map((member) => member.email);
          const allocations = await GLService.getTeamAllocationsByQuarter(
            emails,
            selectedQuarter,
            selectedYear
          );
          setTeamAllocations(allocations);
          // Group members by studio leader
          const studios = {};
          members.forEach((member) => {
            const studioLeader = member.studioLeader || "Unassigned";
            if (!studios[studioLeader]) {
              studios[studioLeader] = [];
            }
            studios[studioLeader].push(member);
          });
          setStudioGroups(studios);
        }
      } catch (err) {
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [currentUser, selectedQuarter, selectedYear]);

  // Month column headers
  const getMonthNames = () => {
    if (!selectedQuarter || !selectedYear) return ["", "", ""];
    const months = getQuarterMonths(selectedQuarter);
    return months.map((m) =>
      format(new Date(selectedYear, m, 1), "MMMM yyyy")
    );
  };
  const [monthCol, month1Col, month2Col] = getMonthNames();

  // Handle updates to allocations
  const handleAllocationUpdate = async (updates) => {
    if (!updates || updates.length === 0) return;

    setIsSaving(true);
    setSaveStatus({ success: false, message: "" });

    try {
      const result = await GLService.batchUpdateAllocations(updates);

      // Show success message
      setSaveStatus({
        success: true,
        message: `Successfully updated ${updates.length} allocations`,
      });

      // Refresh allocations data
      if (teamMembers.length > 0) {
        const emails = teamMembers.map((member) => member.email);
        const allocations = await GLService.getTeamAllocations(
          emails,
          format(weekStartDate, "yyyy-MM-dd"),
          format(weekEndDate, "yyyy-MM-dd")
        );

        setTeamAllocations(allocations);
      }
    } catch (err) {
      setSaveStatus({
        success: false,
        message: `Failed to update allocations: ${err.message}`,
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
      overheadHours: 0,
    };

    teamAllocations.forEach((allocation) => {
      const hours = parseFloat(allocation.hours || allocation.ra_hours) || 0;
      const projectNumber =
        allocation.project_number || allocation.proj_id || "";

      summary.totalHours += hours;

      if (
        projectNumber.startsWith("0000-0000-0PTO") ||
        projectNumber.startsWith("0000-0000-0HOL")
      ) {
        summary.ptoHours += hours;
      } else if (projectNumber.startsWith("0000-0000")) {
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
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatPercent = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="page-layout">
      <Header onNavigate={onNavigate} />
      <main className="gl-dashboard">
        <div className="content-wrapper">
          <div className="dashboard-controls">
            <QuarterPicker
              onQuarterChange={(q, y) => {
                setSelectedQuarter(q);
                setSelectedYear(y);
              }}
              initialYear={selectedYear}
              initialQuarter={selectedQuarter}
            />

            <div className="view-toggle">
              <button
                className={`toggle-button ${
                  viewMode === "team" ? "active" : ""
                }`}
                onClick={() => setViewMode("team")}
              >
                Team View
              </button>
              <button
                className={`toggle-button ${
                  viewMode === "project" ? "active" : ""
                }`}
                onClick={() => setViewMode("project")}
              >
                Project View
              </button>
            </div>
          </div>

          {showSaveStatus && (
            <div
              className={`status-message ${
                saveStatus.success ? "success" : "error"
              }`}
            >
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
              <div className="summary-value">
                {formatNumber(summary.totalHours)}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-title">Direct Hours</div>
              <div className="summary-value">
                {formatNumber(summary.directHours)}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-title">PTO/Holiday</div>
              <div className="summary-value">
                {formatNumber(summary.ptoHours)}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-title">Ratio B</div>
              <div className="summary-value">
                {formatPercent(summary.ratioB)}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-indicator">Loading team data...</div>
          ) : viewMode === "team" ? (
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
                      {members.map((member) => (
                        <TeamMemberPanel
                          key={member.id}
                          member={member}
                          allocations={teamAllocations.filter(
                            (a) => a.email === member.email
                          )}
                          onUpdate={handleAllocationUpdate}
                          disabled={isSaving}
                        />
                      ))}
                    </div>
                  </div>
                ))
              }
            </div>
          ) : (
            <div className="project-view">
              <h2>Project View Coming Soon</h2>
              <p>
                This view will allow you to see allocations grouped by project.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GLView;
