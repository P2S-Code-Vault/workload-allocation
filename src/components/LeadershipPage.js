import React, { useState, useEffect, useCallback } from "react";
import { UserService } from "../services/UserService";
import { GLTeamService } from "../services/GLTeamService";
import { ScheduledHoursService } from "../services/ScheduledHoursService";
import QuarterPicker from "./QuarterPicker";
import "./LeadershipPage.css";
import API_CONFIG from "../services/apiConfig";
import { getCurrentQuarterString, getCurrentYear } from "../utils/dateUtils";
import { 
  normalizeMonthlyWorkloadData,
  groupStaffByManager, 
  calculateGroupSummary, 
  validateMonthlyData 
} from "../utils/monthlyPayloadUtils";

const LeadershipPage = ({ navigate }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [teamData, setTeamData] = useState({});
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarterString());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [viewMode, setViewMode] = useState("hierarchy");
  const [currentUser, setCurrentUser] = useState(null);
  const [groupList, setGroupList] = useState([]);
  const [showAllGroups, setShowAllGroups] = useState(false);

  // Add month selection state for quarterly data
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = month1, 1 = month2, 2 = month3

  // Add separate loading state for all groups to show faster feedback
  const [allGroupsLoading, setAllGroupsLoading] = useState(false);

  const [allStaffMonthlyData, setAllStaffMonthlyData] = useState(null);

  // const [scheduledHoursData, setScheduledHoursData] = useState({});
  // const [scheduledHoursLoading, setScheduledHoursLoading] = useState(false);
  // const [scheduledHoursError, setScheduledHoursError] = useState(null);  // const [scheduledHoursData, setScheduledHoursData] = useState({});
  const [quarterlyScheduledHoursData, setQuarterlyScheduledHoursData] = useState({}); // NEW: Cache quarterly data
  const [scheduledHoursLoading, setScheduledHoursLoading] = useState(false);
  const [scheduledHoursError, setScheduledHoursError] = useState(null);

  useEffect(() => {
    const userDetails = UserService.getCurrentUserDetails();
    if (userDetails) {
      setCurrentUser(userDetails);
    }
  }, []);

  useEffect(() => {
    // Check if the page has already been refreshed or if a refresh is requested
    const urlParams = new URLSearchParams(window.location.search);
    const refresh = urlParams.get("refresh");
    const hasRefreshed = sessionStorage.getItem("leadershipPageRefreshed");

    if (refresh === "true" && !hasRefreshed) {
      console.log("Refreshing LeadershipPage after save in TeamEdit...");
      sessionStorage.setItem("leadershipPageRefreshed", "true");
      urlParams.delete("refresh"); // Remove the parameter to avoid repeated refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.reload();
    }
  }, []);

  // Helper to fetch group manager email from backend contacts API
  async function fetchGroupManagerEmailFromBackend(name) {
    if (!name || name.includes("@")) return name;
    try {
      // Use /contacts?search=<name> (not /contacts/search)
      const params = new URLSearchParams({ search: name });
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTACTS}?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].email) {
        return data[0].email;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

    const getScheduledHoursForMember = useCallback((member) => {
      return ScheduledHoursService.getScheduledHoursForMemberOptimized(
        member, 
        quarterlyScheduledHoursData, 
        selectedMonth, // Use selected month instead of hardcoded 0
        40.0
      );
    }, [quarterlyScheduledHoursData, selectedMonth]);

  
  /**
 * Calculate total scheduled hours for a studio
 * @param {Object} studioData - Studio data with members array
 * @returns {number} Total scheduled hours for the studio
 */
const calculateStudioScheduledHours = useCallback((studioData) => {
  if (!studioData.members || studioData.members.length === 0) {
    return 0;
  }
  
  return studioData.members.reduce((total, member) => {
    return total + getScheduledHoursForMember(member);
  }, 0);
}, [getScheduledHoursForMember]);

  const getScheduledHoursSummary = useCallback((members) => {
  let totalScheduledHours = 0;
  let apiDataCount = 0;
  let fallbackDataCount = 0;
  let errorCount = 0;
  
  members.forEach(member => {
    const memberKey = member.contact_id || member.contactId || member.id || member.email;
    const quarterlyScheduledHoursInfo = quarterlyScheduledHoursData[memberKey];
    
    if (quarterlyScheduledHoursInfo && quarterlyScheduledHoursInfo.success) {
      apiDataCount++;
      const monthlyHours = ScheduledHoursService.extractMonthlyFromQuarterly(
        quarterlyScheduledHoursInfo.quarterlyScheduledHoursData, 
        selectedMonth, // Use selected month instead of hardcoded 0
        40.0
      );
      totalScheduledHours += monthlyHours;
    } else if (quarterlyScheduledHoursInfo && !quarterlyScheduledHoursInfo.success) {
      errorCount++;
      totalScheduledHours += getScheduledHoursForMember(member); // Use fallback
    } else {
      fallbackDataCount++;
      totalScheduledHours += getScheduledHoursForMember(member); // Use fallback
    }
  });
  
  return {
    totalScheduledHours,
    apiDataCount,
    fallbackDataCount,
    errorCount,
    totalMembers: members.length
  };
}, [quarterlyScheduledHoursData, getScheduledHoursForMember, selectedMonth]);

 
  const fetchQuarterlyScheduledHoursForMembers = useCallback(async (members, year, quarter) => {
  if (!members || members.length === 0) {
    console.log('[LeadershipPage] No members to fetch quarterly scheduled hours for');
    return {};
  }
  
  setScheduledHoursLoading(true);
  setScheduledHoursError(null);
  
  try {
    console.log(`[LeadershipPage] Fetching QUARTERLY scheduled hours for ${members.length} members, ${year}-${quarter}`);
    
    const quarterlyScheduledHoursMap = await ScheduledHoursService.batchFetchQuarterlyScheduledHours(
      members, 
      year, 
      quarter
    );
    
    // Log results summary
    const successCount = Object.values(quarterlyScheduledHoursMap).filter(r => r.success).length;
    const errorCount = Object.values(quarterlyScheduledHoursMap).filter(r => !r.success).length;
    
    console.log(`[LeadershipPage] Quarterly scheduled hours fetch completed. Success: ${successCount}, Errors: ${errorCount}`);
    
    if (errorCount > 0) {
      console.warn(`[LeadershipPage] ${errorCount} quarterly scheduled hours requests failed`);
      setScheduledHoursError(`Failed to fetch scheduled hours for ${errorCount} out of ${members.length} members`);
    }
    
    return quarterlyScheduledHoursMap;
    
  } catch (error) {
    console.error('[LeadershipPage] Error fetching quarterly scheduled hours:', error);
    setScheduledHoursError(`Failed to fetch scheduled hours: ${error.message}`);
    return {};
  } finally {
    setScheduledHoursLoading(false);
  }
}, []);

    const clearScheduledHoursData = useCallback(() => {
      // setScheduledHoursData({});
      setQuarterlyScheduledHoursData({}); // Clear quarterly cache too
      setScheduledHoursError(null);
      ScheduledHoursService.clearCache();
      console.log('[LeadershipPage] Cleared scheduled hours data and quarterly cache');
    }, []);

  /**
   * Effect: Clear scheduled hours data when quarter/year changes
   */
  useEffect(() => {
    clearScheduledHoursData();
  }, [selectedQuarter, selectedYear, clearScheduledHoursData]);

  /**
   * Effect: Clear scheduled hours data when switching between views
   */
  useEffect(() => {
    clearScheduledHoursData();
  }, [showAllGroups, clearScheduledHoursData]);


  const loadTeamData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setScheduledHoursError(null);

    try {
      console.log(
        "Loading leadership data for current user:",
        currentUser.email
      );

      const userGroupManager = currentUser.groupManager;

      // Fix: Only declare quarterString once
      const quarterString = typeof selectedQuarter === 'number' ? `Q${selectedQuarter}` : selectedQuarter;      if (!userGroupManager && !showAllGroups) {
        console.log("User is not assigned to any group");
        setTeamData({});
        // setScheduledHoursData({});
        setIsLoading(false);
        return;
      }
      
      if (showAllGroups) {
        // Set separate loading state for all groups
        setAllGroupsLoading(true);
        console.log('Fetching all staff quarterly workload for all groups...');
        
        try {
          const allStaffData = await GLTeamService.getAllStaffQuarterlyWorkload(
            selectedYear,
            quarterString
          );
          console.log('All staff quarterly workload data received:', allStaffData);
        
        // Add detailed structure inspection
        if (allStaffData && allStaffData.managers) {
          console.log('Managers structure found:');
          Object.entries(allStaffData.managers).forEach(([managerName, managerData]) => {
            console.log(`Manager: ${managerName}`, {
              hasStudios: !!managerData.studios,
              studiosCount: managerData.studios ? Object.keys(managerData.studios).length : 0,
              groupNo: managerData.groupNo,
              memberCount: managerData.memberCount,
              hasMonthlyTotals: !!managerData.monthlyTotals
            });
            
            if (managerData.studios) {
              Object.entries(managerData.studios).forEach(([studioName, studioData]) => {
                console.log(`  Studio: ${studioName}`, {
                  membersCount: studioData.members ? studioData.members.length : 0,
                  hasMembers: !!studioData.members,
                  sampleMember: studioData.members && studioData.members[0] ? {
                    name: studioData.members[0].name,
                    hasScheduledHours: !!studioData.members[0].scheduled_hours,
                    hasDirectHours: !!studioData.members[0].direct_hours
                  } : null
                });
              });
            }
          });
        }
        
        // Validate the data structure
        const validation = validateMonthlyData(allStaffData);
        console.log('Data validation result:', validation);
        
        if (!validation.isValid) {
          console.error('Invalid data structure:', validation.errors);
          setError('Invalid data received from server: ' + validation.errors.join(', '));
          setIsLoading(false);
          return;
        }
        
        if (validation.warnings.length > 0) {
          console.warn('Data structure warnings:', validation.warnings);
        }

       
        if (allStaffData && allStaffData.managers) {
            const allMembers = [];
            Object.values(allStaffData.managers).forEach(managerData => {
              if (managerData.studios) {
                Object.values(managerData.studios).forEach(studioData => {
                  if (studioData.members) {
                    allMembers.push(...studioData.members);
                  }
                });
              }
            });

            if (allMembers.length > 0) {
              console.log(`[LoadTeamData] Fetching QUARTERLY scheduled hours for ${allMembers.length} members for ${quarterString}`);
              const quarterlyScheduledHoursMap = await fetchQuarterlyScheduledHoursForMembers(allMembers, selectedYear, quarterString);
              setQuarterlyScheduledHoursData(quarterlyScheduledHoursMap);
            }
          }
        
        setAllStaffMonthlyData(allStaffData);

        // Set quarterly data
        if (allStaffData) {
          console.log('Quarterly data loaded successfully');
        }
        console.log('Sample member from allStaffData:', 
  allStaffData.managers[Object.keys(allStaffData.managers)[0]]?.studios[Object.keys(allStaffData.managers[Object.keys(allStaffData.managers)[0]]?.studios || {})[0]]?.members[0]
);
        setTeamData({}); // Clear teamData for all groups view
        setIsLoading(false);
        return;
        
        } catch (err) {
          console.error("Error loading all groups data:", err);
          setError(`Failed to load all groups data: ${err.message}`);
          setAllStaffMonthlyData(null);
        } finally {
          setAllGroupsLoading(false);
        }
      }

      console.log(`User belongs to group managed by: ${userGroupManager}`);      // Always refresh and get the group manager's email, don't use localStorage
      let groupManagerEmail = userGroupManager;
      if (groupManagerEmail && !groupManagerEmail.includes('@')) {
        try {
          // First try to find from mockStaffData
          const staffList = window.mockStaffData || [];
          const gm = staffList.find(
            (s) => s.name === groupManagerEmail || s.groupManager === groupManagerEmail
          );
          if (gm && gm.email) {
            groupManagerEmail = gm.email;
          } else {
            // Always fetch from backend, don't use cached value
            const backendEmail = await fetchGroupManagerEmailFromBackend(groupManagerEmail);
            if (backendEmail) {
              groupManagerEmail = backendEmail;
              // Optionally store for this session, but always refresh on page load
              localStorage.setItem('userGroupManagerEmail', backendEmail);
            }
          }
        } catch (e) {
          console.warn('Failed to fetch group manager email:', e);
          // fallback: leave as is
        }
      }
      // Use new GLTeamService signature: only groupManagerEmail
      const members = await GLTeamService.getTeamMembers(groupManagerEmail);

      if (!members || members.length === 0) {
        console.log("No team members found for this group");
        setError(
          "No team members found for your group. You might not be assigned to a group yet."
        );        setTeamData({});
        // setScheduledHoursData({});
        setIsLoading(false);
        return;
      }

      console.log(
        `Found ${members.length} team members for group manager: ${userGroupManager}`
      );

       // ===== OPTIMIZED: Fetch quarterly scheduled hours for team members =====
        console.log(`[LoadTeamData] Fetching QUARTERLY scheduled hours for ${members.length} team members for ${quarterString}`);

        const quarterlyScheduledHoursMap = await fetchQuarterlyScheduledHoursForMembers(members, selectedYear, quarterString);
        setQuarterlyScheduledHoursData(quarterlyScheduledHoursMap);      // Fetch production projects (replacing milestones for production work)
      const projectData = await GLTeamService.getTeamMonthlyProjectAllocationsWithDetails(
        groupManagerEmail,
        selectedYear,
        quarterString
      );
      
      // Keep milestones for non-production work (PTO, holidays, overhead)
      const milestoneData = await GLTeamService.getTeamMonthlyAllocationsWithDetails(
        groupManagerEmail,
        selectedYear,
        quarterString
      );

      // Also fetch monthly opportunities
      const opportunitiesData = await GLTeamService.getMonthlyOpportunities(
        groupManagerEmail,
        selectedYear,
        quarterString
      );      console.log('[LeadershipPage] Raw project data:', projectData);
      console.log('[LeadershipPage] Raw milestone data (for PTO/overhead):', milestoneData);
      console.log('[LeadershipPage] Raw opportunities data:', opportunitiesData);

      // Combine project and milestone data for processing
      const combinedData = {
        expected_months: projectData.expected_months || milestoneData.expected_months || [1, 2, 3],
        monthly_data: {}
      };

      // Merge project data and milestone data (milestones for PTO/overhead only)
      const monthKeys = ['month1', 'month2', 'month3'];
      monthKeys.forEach(monthKey => {
        const projectAllocations = (projectData.monthly_data && projectData.monthly_data[monthKey]) || [];
        const milestoneAllocations = (milestoneData.monthly_data && milestoneData.monthly_data[monthKey]) || [];
        
        // Filter milestones to only include non-production items (PTO, holidays, overhead)  
        const nonProductionMilestones = milestoneAllocations.filter(allocation => {
          const projectNumber = allocation.project_number || '';
          return projectNumber.startsWith('0000-0000') || 
                 projectNumber.includes('PTO') || 
                 projectNumber.includes('HOL') || 
                 projectNumber.includes('SIC') || 
                 projectNumber.includes('LWOP') || 
                 projectNumber.includes('JURY') ||
                 projectNumber.includes('OVERHEAD') ||
                 projectNumber.includes('INDIRECT');
        });
        
        // Combine projects (production) with filtered milestones (non-production)
        combinedData.monthly_data[monthKey] = [...projectAllocations, ...nonProductionMilestones];
      });

      console.log('[LeadershipPage] Combined data:', combinedData);
      console.log('[LeadershipPage] Project sample:', projectData?.monthly_data ? Object.values(projectData.monthly_data)[0]?.slice(0, 2) : 'No project data');
      console.log('[LeadershipPage] Opportunities sample:', opportunitiesData?.monthly_opportunities?.monthly_data ? Object.values(opportunitiesData.monthly_opportunities.monthly_data)[0]?.slice(0, 2) : 'No opportunities data');

      // Use selected month for quarterly data
      const monthKey = monthKeys[selectedMonth]; // Use selected month
      const monthAllocations = combinedData.monthly_data[monthKey] || [];
      const monthOpportunities = (opportunitiesData.monthly_opportunities && opportunitiesData.monthly_opportunities.monthly_data && opportunitiesData.monthly_opportunities.monthly_data[monthKey]) || [];

      const allGroupsData = {};
      const groupManager = userGroupManager;

      allGroupsData[groupManager] = {
        studios: {},
        totalHours: 0,
        scheduledHours: 0,
        directHours: 0,
        ptoHours: 0,
        overheadHours: 0,
        availableHours: 0, //new
        memberCount: members.length,
      };

      members.forEach((member) => {
        let studio = "Unassigned";

        if (member.GroupName) {
          console.log(
            `Found GroupName for ${member.name}: ${member.GroupName}`
          );
          studio = member.GroupName;
        } else {
          console.log(
            `No GroupName found for ${member.name}, using 'Unassigned'}`
          );
        }

        if (selectedGroup && studio !== selectedGroup) {
          console.log(
            `Filtering out member ${member.name} because group "${studio}" doesn't match selected group "${selectedGroup}"`
          );
          return;
        }

        //let scheduledHours = 40.0;
         // ===== UPDATED: Get scheduled hours from API data instead of hardcoded 40 =====
        const scheduledHours = getScheduledHoursForMember(member);
        // console.log(`Processing member: ${member.name}, Studio: ${studio}, Scheduled Hours: ${scheduledHours} (from API: ${!!scheduledHoursMap[member.contact_id || member.email]?.success})`);
        console.log(`Processing member: ${member.name}, Studio: ${studio}, Scheduled Hours: ${scheduledHours} (from API: ${!!quarterlyScheduledHoursData[member.contact_id || member.email]?.success})`);
        
        if (!allGroupsData[groupManager].studios[studio]) {
          allGroupsData[groupManager].studios[studio] = {
            members: [],
            totalHours: 0,
            scheduledHours: 0,
            directHours: 0,
            ptoHours: 0,
            overheadHours: 0,
            availableHours: 0,
            // ADD THESE LINES:
            studioLeader: member.studio_leader || 'Unassigned',
            discipline: member.discipline || ''
          };
        } else {
          // UPDATE existing studio data if this member has better info
          if (member.studio_leader && !allGroupsData[groupManager].studios[studio].studioLeader) {
            allGroupsData[groupManager].studios[studio].studioLeader = member.studio_leader;
          }
          if (member.discipline && !allGroupsData[groupManager].studios[studio].discipline) {
            allGroupsData[groupManager].studios[studio].discipline = member.discipline;
          }
        }        // FIX: Use contact_id for matching allocations
        const memberAllocations = monthAllocations.filter(
          (a) => a.contact_id === member.contact_id
        );        const memberRows = memberAllocations.map((allocation) => ({
              // Core identifiers
                        ra_id: allocation.ra_id,
                        // Handle both project_id (from projects) and milestone_id (from milestones)
                        project_id: allocation.project_id,
                        milestone_id: allocation.milestone_id,
                        contact_id: allocation.contact_id,
                        
                        // Project/Milestone Information (now with detailed data)
                        projectNumber: allocation.project_number || allocation.proj_id || "",
                        projectName: allocation.project_name || "",
                        milestone: allocation.milestone_name || allocation.project_name || "",
                        pm: allocation.project_manager || "",
                        
                        // Financial Information
                        labor: parseFloat(allocation.contract_labor || allocation.project_contract_labor || allocation.labor || 0),
                        pctLaborUsed: parseFloat(allocation.forecast_pm_labor || allocation.percentLaborUsed || 0) * 100,
                        
                        // Hours Information
                        hours: parseFloat(allocation.ra_hours || allocation.hours || 0),
                        month_hours: parseFloat(allocation.month_hours || 0),
                        month_hours1: parseFloat(allocation.month_hours1 || 0),
                        month_hours2: parseFloat(allocation.month_hours2 || 0),
                        
                        // Classification flags
                        directHours: !!allocation.direct_hours,
                        ptoHolidayHours: !!allocation.pto_holiday_hours,
                        lwopHours: !!allocation.lwop_hours,
                        indirectHours: !!allocation.indirect_hours,
                        availableHours: !!allocation.available_hours,
                        
                        // Additional Information
                        remarks: allocation.ra_remarks || allocation.remarks || "",
                        quarter: allocation.quarter,
                        year: allocation.year,
                        month: allocation.month,
                        
                        // Project/Milestone status and billing info
                        milestone_status: allocation.milestone_status || allocation.status,
                        is_billable: allocation.is_billable,
                        act_mult_rate: allocation.act_mult_rate,
                        
                        // Dates and metadata
                        ra_date: allocation.ra_date,
                        modified_by: allocation.modified_by,
                        type: allocation.project_id ? 'project' : 'milestone' // Distinguish between projects and milestones
                      }));// Process opportunities for this member
        const memberOpportunities = monthOpportunities.filter(
          (o) => o.contact_id === member.contact_id
        );

        console.log(`[LeadershipPage] Member ${member.name} opportunities:`, memberOpportunities);
        if (memberOpportunities.length > 0) {
          console.log(`[LeadershipPage] First opportunity fields:`, Object.keys(memberOpportunities[0]));
          console.log(`[LeadershipPage] First opportunity data:`, memberOpportunities[0]);
        }        const memberOpportunityRows = memberOpportunities.map((opportunity) => ({
          // Core identifiers
          ra_id: opportunity.ra_id,
          opportunity_id: opportunity.opportunity_id,
          contact_id: opportunity.contact_id,
          
          // Project/Opportunity Information - try different possible field names
          projectNumber: opportunity.opportunity_number || opportunity.opp_number || opportunity.number || `OPP-${opportunity.opportunity_id}`,
          projectName: opportunity.opportunity_name || opportunity.opp_name || opportunity.name || `Opportunity ${opportunity.opportunity_id}`,
          milestone: opportunity.opportunity_name || opportunity.opp_name || opportunity.name || `Opportunity ${opportunity.opportunity_id}`, // Same as projectName for consistency with milestones
          pm: opportunity.proposal_champion || opportunity.champion || '', // Use proposal champion as PM equivalent
          
          // Hours Information
          hours: parseFloat(opportunity.hours || 0),
          
          // Classification - opportunities are considered direct hours
          directHours: true,
          ptoHolidayHours: false,
          lwopHours: false,
          indirectHours: false,
          availableHours: false,
          
          // Additional Information
          remarks: opportunity.ra_remarks || "",
          quarter: opportunity.quarter,
          year: opportunity.year,
          month: opportunity.month,
          
          // Metadata
          type: 'opportunity' // Add type to distinguish from milestones
        }));
          // Combine milestone and opportunity rows
        const allMemberRows = [...memberRows, ...memberOpportunityRows];
        
        const directHours = allMemberRows
          .filter((row) => {
            // Include opportunities (they are direct hours) and project/milestone rows that don't start with "0000-0000"
            return row.type === 'opportunity' || !row.projectNumber.startsWith("0000-0000");
          })
          .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);

        const ptoHours = allMemberRows
          .filter(
            (row) =>
              row.projectNumber.startsWith("0000-0000-0PTO") ||
              row.projectNumber.startsWith("0000-0000-0HOL") ||
              row.projectNumber.startsWith("0000-0000-0SIC") ||
              row.projectNumber.startsWith("0000-0000-LWOP") ||
              row.projectNumber.startsWith("0000-0000-JURY")
          )
          .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);

        //new
        const availableHours = allMemberRows
          .filter(
            (row) =>
              row.availableHours ||
              row.projectNumber.startsWith("0000-0000-AVAIL_HOURS")
          )
          .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);

        const overheadHours = allMemberRows
          .filter(
            (row) =>
              row.projectNumber.startsWith("0000-0000") &&
              !row.projectNumber.startsWith("0000-0000-0PTO") &&
              !row.projectNumber.startsWith("0000-0000-0HOL") &&
              !row.projectNumber.startsWith("0000-0000-0SIC") &&
              !row.projectNumber.startsWith("0000-0000-LWOP") &&
              !row.projectNumber.startsWith("0000-0000-JURY") &&
              !row.availableHours && // new
              !row.projectNumber.startsWith("0000-0000-AVAIL_HOURS") //new
          )
          .reduce((sum, row) => sum + (parseFloat(row.hours) || 0), 0);//check with team
        const totalHours =
          directHours + ptoHours + overheadHours;        
          
          allGroupsData[groupManager].studios[studio].members.push({
          id: member.id,
          name: member.name,
          email: member.email,
          laborCategory: member.labor_category || "",
          scheduledHours: scheduledHours, //uses API now
          directHours,
          ptoHours,
          overheadHours,          availableHours, //new
          totalHours,
          ratioB: calculateRatioB(directHours, scheduledHours, ptoHours), //uses API for scd hrs.
          rows: allMemberRows, // Use combined rows instead of just memberRows
          milestoneRows: memberRows, // Keep separate for detailed view (includes both projects and milestones)
          opportunityRows: memberOpportunityRows, // Keep separate for detailed view
          studioLeader: member.studio_leader || 'Unassigned',
          discipline: member.discipline || '',
          // scheduledHoursApiData: scheduledHoursMap[member.contact_id || member.email]?.scheduledHoursData,
          // scheduledHoursSource: scheduledHoursMap[member.contact_id || member.email]?.success ? 'API' : 'fallback'
          scheduledHoursInfo: quarterlyScheduledHoursData[member.contact_id || member.email]?.quarterlyScheduledHoursData,
          scheduledHoursSource: quarterlyScheduledHoursData[member.contact_id || member.email]?.success ? 'API' : 'fallback'
        });

        allGroupsData[groupManager].studios[studio].totalHours += totalHours;
        allGroupsData[groupManager].studios[studio].scheduledHours +=
          scheduledHours;
        allGroupsData[groupManager].studios[studio].directHours += directHours;
        allGroupsData[groupManager].studios[studio].ptoHours += ptoHours;
        allGroupsData[groupManager].studios[studio].overheadHours +=
          overheadHours;
        allGroupsData[groupManager].studios[studio].availableHours +=
          availableHours; //new

        allGroupsData[groupManager].totalHours += totalHours;
        allGroupsData[groupManager].scheduledHours += scheduledHours;
        allGroupsData[groupManager].directHours += directHours;
        allGroupsData[groupManager].ptoHours += ptoHours;
        allGroupsData[groupManager].overheadHours += overheadHours;
        allGroupsData[groupManager].availableHours += availableHours; //new
      });

      Object.keys(allGroupsData[groupManager].studios).forEach((studio) => {
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

      console.log(
        "FINAL DATA STRUCTURE:",
        JSON.stringify(allGroupsData, null, 2)
      );
      // ===== NEW: Log scheduled hours summary =====
      const scheduledHoursSummary = getScheduledHoursSummary(members);
      console.log("Scheduled Hours Summary:", scheduledHoursSummary);

      setTeamData(allGroupsData);
    } catch (err) {
      console.error("Error loading team data:", err);
      setError(`Failed to load team data: ${err.message}`);
      setTeamData({});
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, selectedGroup, showAllGroups, selectedQuarter, selectedYear, selectedMonth, fetchQuarterlyScheduledHoursForMembers, getScheduledHoursForMember, getScheduledHoursSummary, quarterlyScheduledHoursData]);  useEffect(() => {
    if (!currentUser) {
      return;
    }
    loadTeamData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, selectedGroup, showAllGroups, selectedQuarter, selectedYear, selectedMonth]);


  const handleQuarterChange = useCallback((quarter, year) => {
    console.log("Quarter changed in LeadershipPage:", {
      quarter,
      year,
    });

    setSelectedQuarter(quarter);
    setSelectedYear(year);
    // Quarterly data doesn't need month updates
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  const extractGroupNames = (teamData) => {
    const groups = new Set();

    Object.entries(teamData).forEach(([manager, managerData]) => {
      Object.keys(managerData.studios).forEach((studio) => {
        if (studio !== "Unassigned") {
          groups.add(studio);
        }
      });
    });

    return Array.from(groups).sort();
  };

  const calculateRatioB = (directHours, scheduledHours, ptoHours) => {
    const denominator = scheduledHours - ptoHours;
    if (denominator <= 0) return 0;
    return directHours / denominator;
  };

  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
  const formatPercent = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  // Helper function to get month names for the selected quarter
  const getQuarterMonthNames = () => {
    const quarterNum = parseInt(selectedQuarter.replace('Q', ''));
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startMonth = (quarterNum - 1) * 3;
    return [
      monthNames[startMonth],
      monthNames[startMonth + 1], 
      monthNames[startMonth + 2]
    ];
  };

  const monthNames = getQuarterMonthNames();

  // Helper function to render month selector
  const renderMonthSelector = () => {
    if (!monthNames || monthNames.length === 0) {
      return null;
    }
    
    return (
      <div className="month-selector">
        {monthNames.map((monthName, index) => (
          <button
            key={index}
            className={`view-control-btn ${selectedMonth === index ? 'active' : ''}`}
            onClick={() => setSelectedMonth(index)}
          >
            {monthName}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="page-layout">
      <main className="gl-dashboard">
        <div className="content-wrapper">
          <QuarterPicker
            onQuarterChange={handleQuarterChange}
            initialYear={selectedYear}
            initialQuarter={selectedQuarter}
          />

          <div className="user-info-container">
            {groupList.length > 0 && (
              <div className="view-controls-container">
                <button
                  className={`view-control-btn ${showAllGroups ? "active" : ""}`}
                  onClick={() => {
                    if (!showAllGroups) {
                      setSelectedGroup("");
                    }
                    setShowAllGroups(!showAllGroups);
                  }}
                >
                  {showAllGroups ? "My Group Only" : "All Groups"}
                </button>

                <button
                  className={`view-control-btn ${
                    viewMode === "hierarchy" ? "active" : ""
                  }`}
                  onClick={() => setViewMode("hierarchy")}
                >
                  Group By Team
                </button>

               </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {isLoading ? (
              <div className="loading-indicator">Loading team data...</div>
            ) : showAllGroups ? (
              allGroupsLoading ? (
                <div className="loading-indicator">Loading all groups data... This may take a moment.</div>
              ) : allStaffMonthlyData ? (                  <div className="group-summary">
                    <div className="project-summary">
                      <div className="pm-dashboard-title">
                        All Groups Summary ({selectedQuarter} {selectedYear})
                        {renderMonthSelector()}
                      </div>
                    
                    {/* Group-by-group summary table for All Groups view */}
                    {(() => {
                      console.log('Processing all staff data for summary table...');
                      console.log('AllStaffMonthlyData structure:', allStaffMonthlyData);
                      
                      // Use utility functions to normalize monthly data with selected month
                      const normalizedStaffMembers = normalizeMonthlyWorkloadData(allStaffMonthlyData, selectedMonth);
                      console.log('Normalized staff members:', normalizedStaffMembers);
                      
                      if (normalizedStaffMembers.length === 0) {
                        return (
                          <div className="no-data-message">
                            <p>No data found for this quarter.</p>
                            <p>Debug info: dataStructure = {Object.keys(allStaffMonthlyData).join(', ')}</p>
                          </div>
                        );
                      }

                      // Group staff by manager using utility function
                      const groupedByManager = groupStaffByManager(normalizedStaffMembers);
                      console.log('Staff grouped by manager:', groupedByManager);                      
                      // Calculate summary for each group using utility function
                      const groupSummaries = Object.entries(groupedByManager).map(([manager, members]) => {

                        let totalScheduledHours = 0;
                        let apiScheduledCount = 0;
                        let fallbackScheduledCount = 0;

                        // members.forEach(member => {
                        //   const memberKey = member.contactId || member.contact_id || member.id || member.email;
                        //   const scheduledHoursInfo = scheduledHoursData[memberKey];
                          
                        //   if (scheduledHoursInfo && scheduledHoursInfo.success && scheduledHoursInfo.scheduledHoursData) {
                        //     // Use API data
                        //     const apiHours = ScheduledHoursService.extractScheduledHours(scheduledHoursInfo.scheduledHoursData, 40.0);
                        //     totalScheduledHours += apiHours;
                        //     apiScheduledCount++;
                        //     console.log(`[Summary] Using API scheduled hours for ${member.name}: ${apiHours}`);
                        //   } else {
                        //     // Use fallback (member data or default)
                        //     const fallbackHours = member.scheduled_hours || member.weeklyScheduledHours || 40.0;
                        //     totalScheduledHours += fallbackHours;
                        //     fallbackScheduledCount++;
                        //     console.log(`[Summary] Using fallback scheduled hours for ${member.name}: ${fallbackHours}`);
                        //   }
                        // });
                        members.forEach(member => {
                          const memberKey = member.contactId || member.contact_id || member.id || member.email;
                          
                          // FIXED: Use the quarterly data and extraction logic
                          const memberHours = ScheduledHoursService.getScheduledHoursForMemberOptimized(
                            member, 
                            quarterlyScheduledHoursData, 
                            0, // Default to first month for quarterly data
                            40.0
                          );
                          
                          // Check if this came from API or fallback
                          const quarterlyScheduledHoursInfo = quarterlyScheduledHoursData[memberKey];
                          if (quarterlyScheduledHoursInfo && quarterlyScheduledHoursInfo.success) {
                            apiScheduledCount++;
                            console.log(`[Summary] Using quarterly API scheduled hours for ${member.name}: ${memberHours}`);
                          } else {
                            fallbackScheduledCount++;
                            console.log(`[Summary] Using fallback scheduled hours for ${member.name}: ${memberHours}`);
                          }
                          
                          totalScheduledHours += memberHours;
                        });

                        const summary = calculateGroupSummary(members);
                        summary.manager = manager;

                        summary.scheduled_hours = totalScheduledHours; // ===== UPDATED: Use API scheduled hours =====
                        summary.apiScheduledCount = apiScheduledCount;
                        summary.fallbackScheduledCount = fallbackScheduledCount;

                        // Try to get group number from the original allStaffMonthlyData
                        if (allStaffMonthlyData.managers && allStaffMonthlyData.managers[manager]) {
                          summary.groupNo = allStaffMonthlyData.managers[manager].groupNo;
                        }
                        return summary;
                      });return (
                        <table className="summary-table">
                          <thead>
                            <tr className="project-metrics">
                              {showAllGroups && <th>Group</th>}
                              <th>Group Leader</th>
                              <th>Team Members</th>

                              <th>
                                Scheduled Hours
                                {/* ===== NEW: Add tooltip showing API vs fallback data ===== */}
                                {scheduledHoursLoading && <span className="loading-indicator"> ⏳</span>}
                                {scheduledHoursError && <span className="error-indicator" title={scheduledHoursError}> ⚠️</span>}
                              </th>

                              <th>Direct Hours</th>
                              <th>PTO/HOL</th>
                              <th>Indirect Hours</th>
                              <th>Available Hours</th>
                              <th>Total Hours</th>
                              <th>Utilization Ratio</th>
                            </tr>
                          </thead>                          
                          <tbody>                            
                          {groupSummaries
                              .sort((a, b) => {
                                if (showAllGroups && a.groupNo && b.groupNo) {
                                  // Sort by group number when showing all groups
                                  const groupA = parseInt(a.groupNo);
                                  const groupB = parseInt(b.groupNo);
                                  if (!isNaN(groupA) && !isNaN(groupB)) {
                                    return groupA - groupB;
                                  }
                                }
                                // Fallback to manager name sorting
                                return a.manager.localeCompare(b.manager);
                              })
                              .map((summary, index) => (
                                <tr key={index}>
                                  {showAllGroups && <td>{summary.groupNo || 'N/A'}</td>}
                                  <td>{summary.manager}</td>
                                  <td className="number-cell">{summary.memberCount}</td>
                                  
                                  <td className="number-cell">
                                    {/* ===== UPDATED: Show API vs fallback indicator ===== */}
                                    <span title={`API: ${summary.apiScheduledCount || 0}, Fallback: ${summary.fallbackScheduledCount || 0}`}>
                                      {formatter.format(summary.scheduled_hours)}
                                      {summary.apiScheduledCount > 0 && summary.fallbackScheduledCount > 0 && (
                                        <span className="mixed-data-indicator">*</span>
                                      )}
                                    </span>
                                  </td>

                                  <td className="number-cell">{formatter.format(summary.direct_hours)}</td>
                                  <td className="number-cell">{formatter.format(summary.pto_holiday_hours)}</td>
                                  <td className="number-cell">{formatter.format(summary.indirect_hours)}</td>
                                  <td className={`number-cell available-hours-cell ${summary.available_hours === 0 ? 'zero-hours' : ''}`}>{formatter.format(summary.available_hours)}</td>
                                  <td className="number-cell"><strong>{formatter.format(summary.total_hours)}</strong></td>
                                  <td className="number-cell"><strong>{formatPercent(summary.ratio_b)}</strong></td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      );
                    })()}                    {/* Collapsible groups for each manager */}
                    <div className="collapsible-group-list">
                      {(() => {
                        console.log('Rendering collapsible groups for quarterly data');
                        
                        // Use utility function to normalize monthly data with selected month
                        const allStaffMembers = normalizeMonthlyWorkloadData(allStaffMonthlyData, selectedMonth);
                        console.log('Staff members for collapsible view:', allStaffMembers);
                        
                        if (allStaffMembers.length === 0) {
                          return (
                            <div className="no-data-message">
                              <p>No staff members found for the selected quarter.</p>
                              <p>This could be due to:</p>
                              <ul>
                                <li>No data available for {selectedQuarter} {selectedYear}</li>
                                <li>Data processing issues in utility functions</li>
                                <li>Backend data structure changes</li>
                              </ul>
                            </div>
                          );
                        }
                        
                        // Group staff by manager using utility function
                        const groupedByManager = groupStaffByManager(allStaffMembers);
                        console.log('Grouped by manager for collapsible view:', groupedByManager);
                        
                        // Convert the managers structure from backend to the format expected by CollapsibleGroup
                        const teamDataForGroups = {};
                        Object.entries(groupedByManager).forEach(([managerName, staffMembers]) => {
                          // Create studios structure grouped by studio/discipline
                          const studios = {};
                          staffMembers.forEach(member => {
                            const studioName = member.studio || 'Unassigned';
                            if (!studios[studioName]) {
                              studios[studioName] = {
                                members: [],
                                studioLeader: member.studio_leader || 'Unassigned',
                                discipline: member.discipline || '',
                                totalHours: 0,
                                scheduledHours: 0,
                                directHours: 0,
                                ptoHours: 0,
                                overheadHours: 0,
                                availableHours: 0,
                                ratioB: 0
                              };
                            }
                            
                            // Add member to studio
                            studios[studioName].members.push({
                              ...member,
                              laborCategory: member.labor_category,
                              scheduledHours: member.scheduled_hours,
                              directHours: member.direct_hours,
                              ptoHours: member.pto_holiday_hours,
                              overheadHours: member.indirect_hours,
                              availableHours: member.available_hours,
                              totalHours: member.total_hours,
                              ratioB: member.ratio_b,
                              rows: member.rows || []
                            });
                            
                            // Accumulate studio totals
                            studios[studioName].scheduledHours += member.scheduled_hours || 0;
                            studios[studioName].directHours += member.direct_hours || 0;
                            studios[studioName].ptoHours += member.pto_holiday_hours || 0;
                            studios[studioName].overheadHours += member.indirect_hours || 0;
                            studios[studioName].availableHours += member.available_hours || 0;
                            studios[studioName].totalHours += member.total_hours || 0;
                          });
                          
                          // Calculate studio ratios
                          Object.values(studios).forEach(studio => {
                            studio.ratioB = calculateRatioB(studio.directHours, studio.scheduledHours, studio.ptoHours);
                          });
                          
                          teamDataForGroups[managerName] = {
                            studios: studios,
                            memberCount: staffMembers.length
                          };
                        });
                        
                        console.log('TeamData for collapsible groups:', teamDataForGroups);
                        
                        // Render CollapsibleGroup components similar to the "My Group Only" view
                        return Object.entries(teamDataForGroups)
                          .sort(([managerA], [managerB]) => managerA.localeCompare(managerB))
                          .map(([manager, managerData]) => (
                            <CollapsibleGroup
                              key={manager}
                              manager={manager}
                              managerData={managerData}
                              formatter={formatter}
                              formatPercent={formatPercent}
                              navigate={navigate}
                              isEditable={false} // Read-only for all groups view
                              scheduledHoursLoading={scheduledHoursLoading}
                              scheduledHoursError={scheduledHoursError}
                              calculateStudioScheduledHours={calculateStudioScheduledHours}
                              getScheduledHoursForMember={getScheduledHoursForMember} 
                            />
                          ));
                      })()}
                    </div></div>
                </div>
              ) : (
                <div className="no-data-message">
                  <p>No workload data available for all groups.</p>
                  <p>This could be due to:</p>
                  <ul>
                    <li>No data returned from the backend</li>
                    <li>Data structure mismatch</li>
                    <li>Network connectivity issues</li>
                  </ul>
                  {process.env.NODE_ENV !== 'production' && (
                    <div style={{marginTop: '10px'}}>
                      <strong>Debug Info:</strong>
                      <pre style={{fontSize: '10px', color: '#888', background: '#f8f8f8', padding: '10px'}}>
                        AllStaffMonthlyData: {JSON.stringify(allStaffMonthlyData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )
            ) : Object.keys(teamData).length === 0 ? (
              <div className="no-data-message">
                No data found for your group. You might not be assigned to a group yet.
              </div>
            ) : (
              <div className="group-summary">
                <div className="project-summary">
                  <div className="pm-dashboard-title">
                    Group Summary ({selectedQuarter} {selectedYear})
                    {renderMonthSelector()}
                  </div>
                  <table className="summary-table">
                    <thead>
                      <tr className="project-metrics">
                        <th>Group Leader</th>
                        <th>Team Members</th>
                        
                        <th>
                          Scheduled Hours
                          {/* ===== NEW: Add status indicators ===== */}
                          {scheduledHoursLoading && <span className="loading-indicator"> ⏳</span>}
                          {scheduledHoursError && <span className="error-indicator" title={scheduledHoursError}> ⚠️</span>}
                        </th>

                        <th>Direct Hours</th>
                        <th>PTO/HOL</th>
                        <th>Indirect Hours</th>
                        <th>Available Hours</th>
                        <th>Total Hours</th>
                        <th>Utilization Ratio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(teamData)
                        .sort(([managerA, dataA], [managerB, dataB]) => {
                          const groupA = dataA.groupNo;
                          const groupB = dataB.groupNo;
                          if (groupA == null && groupB == null) return 0;
                          if (groupA == null) return 1;
                          if (groupB == null) return -1;
                          const numA = parseInt(groupA);
                          const numB = parseInt(groupB);
                          if (isNaN(numA) && isNaN(numB)) return 0;
                          if (isNaN(numA)) return 1;
                          if (isNaN(numB)) return -1;
                          return numA - numB;
                        })
                        .map(([manager, data], index) => {
        // ===== UPDATED: Calculate scheduled hours using API data =====
        const allMembers = [];
        Object.values(data.studios).forEach(studio => {
          allMembers.push(...studio.members);
        });
        
        const scheduledHoursSummary = getScheduledHoursSummary(allMembers);
        const actualScheduledHours = scheduledHoursSummary.totalScheduledHours;
        
        return (
                <tr key={index}>
                  <td>{manager}</td>
                  <td className="number-cell">{data.memberCount}</td>
                  <td className="number-cell">
                    {/* ===== UPDATED: Show actual calculated scheduled hours ===== */}
                    <span title={`API: ${scheduledHoursSummary.apiDataCount}, Fallback: ${scheduledHoursSummary.fallbackDataCount}, Errors: ${scheduledHoursSummary.errorCount}`}>
                      {formatter.format(actualScheduledHours)}
                      {scheduledHoursSummary.apiDataCount > 0 && scheduledHoursSummary.fallbackDataCount > 0 && (
                        <span className="mixed-data-indicator">*</span>
                      )}
                    </span>
                  </td>
                  <td className="number-cell">{formatter.format(data.directHours)}</td>
                  <td className="number-cell">{formatter.format(data.ptoHours)}</td>
                  <td className="number-cell">{formatter.format(data.overheadHours)}</td>
                  <td className={`number-cell available-hours-cell ${data.availableHours === 0 ? 'zero-hours' : ''}`}>
                    {formatter.format(data.availableHours)}
                  </td>
                  <td className="number-cell"><strong>{formatter.format(data.totalHours)}</strong></td>
                  <td className="number-cell"><strong>{formatPercent(data.ratioB)}</strong></td>
                </tr>
              );
            })}
        </tbody>
      </table>
                 
                </div>
                {/* Collapsible group for each manager */}
                {Object.entries(teamData)
                  .sort(([managerA, dataA], [managerB, dataB]) => {
                    const groupA = dataA.groupNo;
                    const groupB = dataB.groupNo;
                    if (groupA == null && groupB == null) return 0;
                    if (groupA == null) return 1;
                    if (groupB == null) return -1;
                    const numA = parseInt(groupA);
                    const numB = parseInt(groupB);
                    if (isNaN(numA) && isNaN(numB)) return 0;
                    if (isNaN(numA)) return 1;
                    if (isNaN(numB)) return -1;
                    return numA - numB;
                  })
                  .map(([manager, managerData]) => (
                    <CollapsibleGroup
                      key={manager}
                      manager={manager}
                      managerData={managerData}
                      formatter={formatter}
                      formatPercent={formatPercent}
                      navigate={navigate}
                      isEditable={true}
                      scheduledHoursLoading={scheduledHoursLoading}
                      scheduledHoursError={scheduledHoursError}
                      calculateStudioScheduledHours={calculateStudioScheduledHours}
                      getScheduledHoursForMember={getScheduledHoursForMember}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// CollapsibleGroup, CollapsibleStudio, CollapsibleMember components from RA app version
const CollapsibleGroup = ({ manager, managerData, formatter, formatPercent, navigate, isEditable = true,scheduledHoursLoading,scheduledHoursError,calculateStudioScheduledHours,getScheduledHoursForMember }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  return (
    <div className="collapsible-group">
      <div className="collapsible-header" onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? <span style={{marginRight: 8}}>▼</span> : <span style={{marginRight: 8}}>▶</span>}
        <h3 style={{display: 'inline'}}>{manager} Group</h3>
      </div>
      {isExpanded && (
        <div className="collapsible-content">
          <table className="summary-table">
            <thead>
              <tr className="project-metrics">
                <th>Studio Leader</th>
                <th>Discipline</th>
                <th>Team Members</th>
                {/* <th>Scheduled Hours</th> */}
                <th>
                  Scheduled Hours
                  {/* ===== NEW: Add status indicators ===== */}
                  {scheduledHoursLoading && <span className="loading-indicator"> ⏳</span>}
                  {scheduledHoursError && <span className="error-indicator" title={scheduledHoursError}> ⚠️</span>}
                </th>
                <th>Direct Hours</th>
                <th>PTO/HOL</th>
                <th>Indirect Hours</th>
                <th>Available Hours</th>
                <th>Total Hours</th>
                <th>Utilization Ratio</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(managerData.studios).map(([studio, studioData], index) => {
                const studioLeaderName = studioData.studioLeader || (studioData.members.length > 0 && studioData.members[0].studioLeader) || 'Unassigned';
                const discipline = studioData.discipline || '';
                // ===== UPDATED: Calculate studio scheduled hours using API data =====
                const studioScheduledHours = calculateStudioScheduledHours(studioData);
                return (
                  <tr key={index}>
                    <td>{studioLeaderName}</td>
                    <td>{discipline}</td>
                    <td className="number-cell">{studioData.members.length}</td>
                    {/* <td className="number-cell">{formatter.format(studioData.scheduledHours)}</td>
                     */}
                     <td className="number-cell">
                      {/* ===== UPDATED: Use calculated scheduled hours ===== */}
                      {formatter.format(studioScheduledHours)}
                    </td>
                    <td className="number-cell">{formatter.format(studioData.directHours)}</td>
                    <td className="number-cell">{formatter.format(studioData.ptoHours)}</td>
                    <td className="number-cell">{formatter.format(studioData.overheadHours)}</td>
                    <td className={`number-cell available-hours-cell ${studioData.availableHours === 0 ? 'zero-hours' : ''}`}>{formatter.format(studioData.availableHours)}</td>
                    <td className="number-cell"><strong>{formatter.format(studioData.totalHours)}</strong></td>
                    <td className="number-cell"><strong>{formatPercent(studioData.ratioB)}</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {Object.entries(managerData.studios).map(([studio, studioData]) => (
            <CollapsibleStudio
              key={studio}
              studio={studio}
              studioData={studioData}
              formatter={formatter}
              formatPercent={formatPercent}
              navigate={navigate}
              isEditable={isEditable}
              getScheduledHoursForMember={getScheduledHoursForMember}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CollapsibleStudio = ({ studio, studioData, formatter, formatPercent, navigate, isEditable = true,getScheduledHoursForMember}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const studioLeaderName =studioData.studioLeader || 'Unassigned';
  const discipline = studioData.discipline || (studioData.members.length > 0 && studioData.members[0].discipline) || '';
  return (
    <div className="collapsible-studio">
      <div className="collapsible-header" onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? <span style={{marginRight: 8}}>▼</span> : <span style={{marginRight: 8}}>▶</span>}
        <h4 style={{display: 'inline'}}>{studioLeaderName} - {discipline}</h4>
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
              <th>Available Hours</th>
              <th>Total Hours</th>
              <th>Utilization Ratio</th>
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
                  navigate={navigate}
                  isEditable={isEditable}
                  getScheduledHoursForMember={getScheduledHoursForMember}
                />
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const CollapsibleMember = ({ member, formatter, formatPercent, navigate, isEditable = true,getScheduledHoursForMember}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const sortedProjectRows = [...(member.milestoneRows || [])].sort((a, b) => a.projectNumber.localeCompare(b.projectNumber));
  const sortedOpportunityRows = [...(member.opportunityRows || [])].sort((a, b) => a.projectNumber.localeCompare(b.projectNumber));
  // ===== UPDATED: Get scheduled hours from API data =====
  const displayScheduledHours = getScheduledHoursForMember(member);
  
  // ===== FIX: Recalculate ratio using the same scheduled hours being displayed =====
  const calculateRatioB = (directHours, scheduledHours, ptoHours) => {
    const denominator = scheduledHours - ptoHours;
    if (denominator <= 0) return 0;
    return directHours / denominator;
  };
  const displayRatioB = calculateRatioB(member.directHours, displayScheduledHours, member.ptoHours);
  return (
    <>
      <tr>
        <td>
          {member.name}
        </td>
        <td>{member.laborCategory}</td>
        {/* <td className="number-cell">{formatter.format(member.scheduledHours || 0)}</td> */}
        <td className="number-cell">
          {/* ===== UPDATED: Use API scheduled hours ===== */}
          <span title={`Source: ${member.scheduledHoursSource || 'unknown'}`}>
            {formatter.format(displayScheduledHours)}
          </span>
        </td>
        <td className="number-cell">{formatter.format(member.directHours)}</td>
        <td className="number-cell">{formatter.format(member.ptoHours)}</td>
        <td className="number-cell">{formatter.format(member.overheadHours)}</td>
        <td className={`number-cell available-hours-cell ${member.availableHours === 0 ? 'zero-hours' : ''}`}>{formatter.format(member.availableHours)}</td>
        <td className={`number-cell ${member.totalHours < member.scheduledHours ? 'hours-warning' : ''}`}>{formatter.format(member.totalHours)}</td>
        <td className="number-cell"><strong>{formatPercent(displayRatioB)}</strong></td>
        <td>
          <button
            className="expand-details-btn"
            onClick={e => { e.preventDefault(); setIsExpanded(!isExpanded); }}
          >
            Details
          </button>
        </td>      </tr>
      {isExpanded && (
        <tr className="member-details">
          <td colSpan="10">
            <div className="time-entries">              {/* Projects Section */}
              <div className="time-entries-section">
                <h5>Projects</h5>                {sortedProjectRows.length === 0 ? (
                  <div className="no-entries">No project entries found</div>
                ) : (
                  sortedProjectRows.map((entry, i) => (
                    <div key={`project-${i}`} className="time-entry">
                      <span className="project-number">{entry.projectNumber}</span>
                      <span className="project-name">{entry.milestone}</span>
                      <span className="remarks">{entry.remarks}</span>
                      <span className="number-cell">{formatter.format(entry.hours)}</span>
                    </div>
                  ))
                )}
              </div>
              
              {/* Opportunities Section */}
              <div className="time-entries-section">
                <h5>Opportunities</h5>
                {sortedOpportunityRows.length === 0 ? (
                  <div className="no-entries">No opportunity entries found</div>                ) : (
                  sortedOpportunityRows.map((entry, i) => (
                    <div key={`opportunity-${i}`} className="time-entry">
                      <span className="project-number">{entry.projectNumber}</span>
                      <span className="project-name">{entry.projectName}</span>
                      <span className="remarks">{entry.remarks}</span>
                      <span className="number-cell">{formatter.format(entry.hours)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default LeadershipPage;
