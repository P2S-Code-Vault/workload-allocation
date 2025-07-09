import API_CONFIG from './apiConfig';

export class WorkloadPreloadService {
  static apiBaseUrl = API_CONFIG.BASE_URL;

  static async handleErrorResponse(response) {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorJson = await response.json();
        return errorJson.detail || `Error: ${response.status}`;
      } else {
        return await response.text() || `Error: ${response.status}`;
      }
    } catch (error) {
      return `Error: ${response.status}`;
    }
  }

  /**
   * Get all projects workload for quarterly allocation
   * @param {number} year - The year (e.g., 2025)
   * @param {string} quarter - The quarter (e.g., 'Q2')
   * @returns {Promise<Array>} Array of project allocations
   */
  static async getAllProjectsWorkloadQuarterly(year, quarter) {
    try {
      console.log(`Fetching all projects workload for ${quarter} ${year}`);
      
      const params = new URLSearchParams({
        year: year.toString(),
        quarter: quarter
      });
      
      const url = `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.ALL_STAFF_PROJECTS_WORKLOAD_QUARTERLY}?${params.toString()}`;
      console.log(`Fetching from: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await this.handleErrorResponse(response);
        throw new Error(`Failed to fetch workload data: ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`Received workload data with ${data.length || 0} items`);
      
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching all projects workload:", error);
      throw error;
    }
  }

  /**
   * Get user and group projects with extended information
   * @param {string} email - User email (URL encoded)
   * @param {boolean} includeUserProjects - Whether to include user's individual projects
   * @returns {Promise<Object>} Object containing user, group_members, group_projects, and user_projects
   */
  static async getUserGroupProjectsExtended(email, includeUserProjects = true) {
    try {
      console.log(`Fetching group projects for user: ${email}`);
      
      const params = new URLSearchParams({
        include_user_projects: includeUserProjects.toString()
      });
      
      const url = `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.CONTACTS_GROUP_PROJECTS_EXTENDED(email)}?${params.toString()}`;
      console.log(`Fetching from: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await this.handleErrorResponse(response);
        throw new Error(`Failed to fetch user group projects: ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`Received group projects data:`, data);
      
      // Debug EAC data
      if (data.group_projects && Array.isArray(data.group_projects)) {
        console.log(`Found ${data.group_projects.length} group projects`);
        data.group_projects.forEach(project => {
          if (project.eac) {
            console.log(`Project ${project.project_number} has EAC: ${project.eac}, Contract Labor: ${project.project_contract_labor}`);
          }
        });
      }
      
      if (data.user_managed_projects && Array.isArray(data.user_managed_projects)) {
        console.log(`Found ${data.user_managed_projects.length} user managed projects`);
        data.user_managed_projects.forEach(project => {
          if (project.eac) {
            console.log(`User project ${project.project_number} has EAC: ${project.eac}, Contract Labor: ${project.project_contract_labor}`);
          }
        });
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching user group projects:", error);
      throw error;
    }
  }

  /**
   * Get user and group opportunities with extended information
   * @param {string} email - User email
   * @param {boolean} includeUserOpportunities - Whether to include user's individual opportunities
   * @returns {Promise<Object>} Object containing user, group_members, group_opportunities, and user_managed_opportunities
   */
  static async getUserGroupOpportunitiesExtended(email, includeUserOpportunities = true) {
    try {
      console.log(`Fetching group opportunities for user: ${email}`);
      
      const params = new URLSearchParams({
        include_user_opportunities: includeUserOpportunities.toString()
      });
      
      const url = `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.CONTACTS_GROUP_OPPORTUNITIES_EXTENDED(email)}?${params.toString()}`;
      console.log(`Fetching from: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await this.handleErrorResponse(response);
        throw new Error(`Failed to fetch user group opportunities: ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`Received group opportunities data:`, data);
      
      return data;
    } catch (error) {
      console.error("Error fetching user group opportunities:", error);
      throw error;
    }
  }

  /**
   * Preload all active projects for a user and their group
   * Combines data from both existing allocations and user's group projects
   * @param {string} userEmail - User email
   * @param {number} year - The year
   * @param {string} quarter - The quarter
   * @returns {Promise<Object>} Object containing preloaded project data
   */
  static async preloadActiveProjects(userEmail, year, quarter) {
    try {
      console.log(`Preloading active projects for ${userEmail} in ${quarter} ${year}`);
      
      // Fetch both data sources in parallel
      const [quarterlyWorkload, userGroupData, existingAllocations] = await Promise.all([
        this.getAllProjectsWorkloadQuarterly(year, quarter),
        this.getUserGroupProjectsExtended(userEmail, true),
        this.getExistingProjectAllocations(userEmail, year, quarter)
      ]);
      
      console.log('Quarterly workload data received:', quarterlyWorkload?.length || 0, 'items');
      console.log('User group data received:', userGroupData);
      console.log('Existing allocations received:', existingAllocations?.length || 0, 'items');
      
      // Create table rows by merging existing allocations and group/user-managed projects
      const projectRows = [];
      const addedProjectNumbers = new Set(); // Track projects we've already added to avoid duplicates
      
      // STEP 1: Add ALL existing allocations from the direct allocation endpoint first
      // This ensures we capture PTO, holidays, non-production, and all other existing allocations
      if (existingAllocations && Array.isArray(existingAllocations)) {
        console.log(`Processing ${existingAllocations.length} existing allocations for user`);
        
        existingAllocations.forEach(allocation => {
          // Try to find matching project from group/user data for enhanced project info
          let projectInfo = null;
          
          // Look for matching user project
          if (userGroupData.user_managed_projects && Array.isArray(userGroupData.user_managed_projects)) {
            projectInfo = userGroupData.user_managed_projects.find(project => 
              project.project_number === (allocation.proj_id || allocation.project_number)
            );
          }
          
          // If not found in user projects, look in group projects
          if (!projectInfo && userGroupData.group_projects && Array.isArray(userGroupData.group_projects)) {
            projectInfo = userGroupData.group_projects.find(project => 
              project.project_number === (allocation.proj_id || allocation.project_number)
            );
          }
          
          const projectNumber = allocation.proj_id || allocation.project_number;
          
          // Use EAC directly as percentage, or 0 if null
          let pctLaborUsed = 0;
          if (projectInfo) {
            pctLaborUsed = projectInfo.eac || 0;
            console.log(`Project ${projectNumber} - EAC Percentage: ${pctLaborUsed}%`);
          }
          
          projectRows.push({
            id: allocation.ra_id || allocation.id || `${projectNumber}_${userEmail}`,
            resource: userEmail,
            projectNumber: projectNumber,
            projectName: projectInfo?.project_name || allocation.project_name || '',
            pm: projectInfo?.project_manager || allocation.project_manager || '',
            labor: projectInfo?.project_contract_labor || allocation.project_contract_labor || allocation.contract_labor || 0,
            pctLaborUsed: pctLaborUsed,
            hours: allocation.ra_hours || allocation.hours || 0,
            remarks: allocation.ra_remarks || allocation.remarks || '',
            month: allocation.month_hours || 0,
            month1: allocation.month_hours1 || 0,
            month2: allocation.month_hours2 || 0,
          });
          
          addedProjectNumbers.add(projectNumber);
        });
      }
      
      console.log(`Added ${projectRows.length} existing allocation rows`);
      
      // STEP 2: Add additional rows from quarterly workload that might not be in existing allocations
      if (quarterlyWorkload && Array.isArray(quarterlyWorkload)) {
        const userAllocationsFromWorkload = quarterlyWorkload.filter(allocation => 
          allocation.contact_email === userEmail && 
          !addedProjectNumbers.has(allocation.project_number)
        );
        
        console.log(`Processing ${userAllocationsFromWorkload.length} additional allocations from quarterly workload`);
        
        userAllocationsFromWorkload.forEach(allocation => {
          // Try to find matching project from group/user data for enhanced project info
          let projectInfo = null;
          
          // Look for matching user project
          if (userGroupData.user_managed_projects && Array.isArray(userGroupData.user_managed_projects)) {
            projectInfo = userGroupData.user_managed_projects.find(project => 
              project.project_number === allocation.project_number
            );
          }
          
          // If not found in user projects, look in group projects
          if (!projectInfo && userGroupData.group_projects && Array.isArray(userGroupData.group_projects)) {
            projectInfo = userGroupData.group_projects.find(project => 
              project.project_number === allocation.project_number
            );
          }
          
          // Calculate % EAC Labor Used
          // Use EAC directly as percentage, or 0 if null
          let pctLaborUsed = 0;
          if (projectInfo) {
            pctLaborUsed = projectInfo.eac || 0;
            console.log(`Quarterly workload project ${allocation.project_number} - EAC Percentage: ${pctLaborUsed}%`);
          }
          
          projectRows.push({
            id: allocation.ra_id || allocation.id || `${allocation.project_number}_${userEmail}`,
            resource: userEmail,
            projectNumber: allocation.project_number,
            projectName: projectInfo?.project_name || allocation.project_name || '',
            pm: projectInfo?.project_manager || allocation.project_manager || '',
            labor: projectInfo?.project_contract_labor || allocation.project_contract_labor || allocation.contract_labor || 0,
            pctLaborUsed: pctLaborUsed,
            hours: allocation.total_hours || allocation.ra_hours || 0,
            remarks: allocation.remarks || allocation.ra_remarks || '',
            month: allocation.month_1_hours || allocation.month_hours || 0,
            month1: allocation.month_2_hours || allocation.month_hours1 || 0,
            month2: allocation.month_3_hours || allocation.month_hours2 || 0,
          });
          
          addedProjectNumbers.add(allocation.project_number);
        });
      }
      
      // STEP 2: Add user's managed projects that don't already have allocations
      if (userGroupData.user_managed_projects && Array.isArray(userGroupData.user_managed_projects)) {
        const newUserProjects = userGroupData.user_managed_projects.filter(project => 
          !addedProjectNumbers.has(project.project_number)
        );
        
        console.log(`Processing ${newUserProjects.length} new user managed projects (without existing allocations)`);
        
        newUserProjects.forEach(project => {
          // Use EAC directly as percentage, or 0 if null
          const pctLaborUsed = project.eac || 0;
          console.log(`New user project ${project.project_number} - EAC Percentage: ${pctLaborUsed}%`);
          
          projectRows.push({
            id: `${project.project_number}_${userEmail}`,
            resource: userEmail,
            projectNumber: project.project_number,
            projectName: project.project_name || '',
            pm: project.project_manager || '',
            labor: project.project_contract_labor || 0,
            pctLaborUsed: pctLaborUsed,
            hours: 0, // No existing allocation
            remarks: '',
            month: 0,
            month1: 0,
            month2: 0,
          });
          
          addedProjectNumbers.add(project.project_number);
        });
      }
      
      // STEP 3: Add group projects that don't already have allocations
      if (userGroupData.group_projects && Array.isArray(userGroupData.group_projects)) {
        const newGroupProjects = userGroupData.group_projects
          .filter(project => !addedProjectNumbers.has(project.project_number));
          
        console.log(`Processing ${newGroupProjects.length} new group projects (without existing allocations)`);
        
        newGroupProjects.forEach(project => {
          // Use EAC directly as percentage, or 0 if null
          const pctLaborUsed = project.eac || 0;
          console.log(`New group project ${project.project_number} - EAC Percentage: ${pctLaborUsed}%`);
          
          projectRows.push({
            id: `${project.project_number}_${userEmail}`,
            resource: userEmail,
            projectNumber: project.project_number,
            projectName: project.project_name || '',
            pm: project.project_manager || '',
            labor: project.project_contract_labor || 0,
            pctLaborUsed: pctLaborUsed,
            hours: 0, // No existing allocation
            remarks: '',
            month: 0,
            month1: 0,
            month2: 0,
          });
          
          addedProjectNumbers.add(project.project_number);
        });
      }
      
      console.log(`Total project rows created: ${projectRows.length}`);
      console.log(`Breakdown: ${existingAllocations?.length || 0} direct allocations, ${quarterlyWorkload?.filter(a => a.contact_email === userEmail && !addedProjectNumbers.has(a.project_number))?.length || 0} additional workload, ${userGroupData.user_managed_projects?.length || 0} user projects, ${userGroupData.group_projects?.length || 0} group projects`);
      console.log('Sample project row:', projectRows[0]);
      
      return {
        projectRows,
        userGroupData,
        quarterlyWorkload,
        existingAllocations,
        stats: {
          totalQuarterlyAllocations: quarterlyWorkload?.length || 0,
          directAllocations: existingAllocations?.length || 0,
          userQuarterlyAllocations: quarterlyWorkload?.filter(a => a.contact_email === userEmail)?.length || 0,
          userProjects: userGroupData.user_managed_projects?.length || 0,
          groupProjects: userGroupData.group_projects?.length || 0,
          totalProjectRows: projectRows.length,
          existingAllocationsPreserved: existingAllocations?.length || 0
        }
      };
      
    } catch (error) {
      console.error("Error preloading active projects:", error);
      throw error;
    }
  }

  /**
   * Preload all active opportunities for a user and their group
   * @param {string} userEmail - User email
   * @param {number} year - The year
   * @param {string} quarter - The quarter
   * @returns {Promise<Object>} Object containing preloaded opportunity data
   */
  static async preloadActiveOpportunities(userEmail, year, quarter) {
    try {
      console.log(`Preloading active opportunities for ${userEmail} in ${quarter} ${year}`);
      
      // Fetch both opportunities data sources in parallel
      const [existingOpportunityAllocations, userGroupOpportunityData] = await Promise.all([
        // Get existing opportunity allocations using the original endpoint
        this.getExistingOpportunityAllocations(userEmail, year, quarter),
        this.getUserGroupOpportunitiesExtended(userEmail, true)
      ]);
      
      console.log('Existing opportunity allocations received:', existingOpportunityAllocations?.length || 0, 'items');
      console.log('User group opportunity data received:', userGroupOpportunityData);
      
      // Create opportunity rows by merging existing allocations and group/user-managed opportunities
      const opportunityRows = [];
      const addedOpportunityNumbers = new Set(); // Track opportunities we've already added to avoid duplicates
      
      // STEP 1: Add ALL existing opportunity allocations first
      // This ensures we never lose any existing allocation, even if it's not in the group/user lists
      if (existingOpportunityAllocations && Array.isArray(existingOpportunityAllocations)) {
        console.log(`Processing ${existingOpportunityAllocations.length} existing opportunity allocations for user`);
        
        existingOpportunityAllocations.forEach(allocation => {
          // Try to find matching opportunity from group/user data for enhanced opportunity info
          let opportunityInfo = null;
          
          // Look for matching user opportunity
          if (userGroupOpportunityData.user_managed_opportunities && Array.isArray(userGroupOpportunityData.user_managed_opportunities)) {
            opportunityInfo = userGroupOpportunityData.user_managed_opportunities.find(opportunity => 
              opportunity.opportunity_number === allocation.opportunity_number
            );
          }
          
          // If not found in user opportunities, look in group opportunities
          if (!opportunityInfo && userGroupOpportunityData.group_opportunities && Array.isArray(userGroupOpportunityData.group_opportunities)) {
            opportunityInfo = userGroupOpportunityData.group_opportunities.find(opportunity => 
              opportunity.opportunity_number === allocation.opportunity_number
            );
          }
          
          opportunityRows.push({
            id: allocation.ra_id || allocation.id || `${allocation.opportunity_number}_${userEmail}`,
            opportunityNumber: allocation.opportunity_number,
            opportunityName: opportunityInfo?.opportunity_name || allocation.opportunity_name || '',
            proposalChampion: opportunityInfo?.proposal_champion || allocation.proposal_champion || '',
            estimatedFee: opportunityInfo?.estimated_fee || allocation.estimated_fee || 0,
            remarks: allocation.remarks || allocation.ra_remarks || '',
            month: allocation.month_hours || 0,
            month1: allocation.month_hours1 || 0,
            month2: allocation.month_hours2 || 0,
          });
          
          addedOpportunityNumbers.add(allocation.opportunity_number);
        });
      }
      
      console.log(`Added ${opportunityRows.length} existing opportunity allocation rows`);
      
      // STEP 2: Add user's managed opportunities that don't already have allocations
      if (userGroupOpportunityData.user_managed_opportunities && Array.isArray(userGroupOpportunityData.user_managed_opportunities)) {
        const newUserOpportunities = userGroupOpportunityData.user_managed_opportunities.filter(opportunity => 
          !addedOpportunityNumbers.has(opportunity.opportunity_number)
        );
        
        console.log(`Processing ${newUserOpportunities.length} new user managed opportunities (without existing allocations)`);
        
        newUserOpportunities.forEach(opportunity => {
          opportunityRows.push({
            id: `${opportunity.opportunity_number}_${userEmail}`,
            opportunityNumber: opportunity.opportunity_number,
            opportunityName: opportunity.opportunity_name || '',
            proposalChampion: opportunity.proposal_champion || '',
            estimatedFee: opportunity.estimated_fee || 0,
            remarks: '',
            month: 0, // No existing allocation
            month1: 0,
            month2: 0,
          });
          
          addedOpportunityNumbers.add(opportunity.opportunity_number);
        });
      }
      
      // STEP 3: Add group opportunities that don't already have allocations
      if (userGroupOpportunityData.group_opportunities && Array.isArray(userGroupOpportunityData.group_opportunities)) {
        const newGroupOpportunities = userGroupOpportunityData.group_opportunities
          .filter(opportunity => !addedOpportunityNumbers.has(opportunity.opportunity_number));
          
        console.log(`Processing ${newGroupOpportunities.length} new group opportunities (without existing allocations)`);
        
        newGroupOpportunities.forEach(opportunity => {
          opportunityRows.push({
            id: `${opportunity.opportunity_number}_${userEmail}`,
            opportunityNumber: opportunity.opportunity_number,
            opportunityName: opportunity.opportunity_name || '',
            proposalChampion: opportunity.proposal_champion || '',
            estimatedFee: opportunity.estimated_fee || 0,
            remarks: '',
            month: 0, // No existing allocation
            month1: 0,
            month2: 0,
          });
          
          addedOpportunityNumbers.add(opportunity.opportunity_number);
        });
      }
      
      console.log(`Total opportunity rows created: ${opportunityRows.length} (existing allocations + user managed + group opportunities)`);
      console.log('Sample opportunity row:', opportunityRows[0]);
      
      return {
        opportunityRows,
        userGroupOpportunityData,
        existingOpportunityAllocations,
        stats: {
          totalExistingAllocations: existingOpportunityAllocations?.length || 0,
          userOpportunities: userGroupOpportunityData.user_managed_opportunities?.length || 0,
          groupOpportunities: userGroupOpportunityData.group_opportunities?.length || 0,
          totalOpportunityRows: opportunityRows.length
        }
      };
      
    } catch (error) {
      console.error("Error preloading active opportunities:", error);
      throw error;
    }
  }

  /**
   * Get existing project allocations for a user (helper method)
   * This uses the existing ProjectDataService to get current project allocations
   * @param {string} userEmail - User email
   * @param {number} year - The year
   * @param {string} quarter - The quarter
   * @returns {Promise<Array>} Array of existing project allocations
   */
  static async getExistingProjectAllocations(userEmail, year, quarter) {
    try {
      // Import ProjectDataService dynamically to avoid circular dependency
      const { ProjectDataService } = await import('./ProjectDataService');
      
      console.log(`Fetching existing project allocations for ${userEmail} in ${quarter} ${year}`);
      const existingAllocations = await ProjectDataService.getAllocationsByQuarterWithDetails(userEmail, year, quarter);
      
      console.log(`Retrieved ${existingAllocations?.length || 0} existing project allocations`);
      return Array.isArray(existingAllocations) ? existingAllocations : [];
    } catch (error) {
      console.error("Error fetching existing project allocations:", error);
      return []; // Return empty array on error, don't fail the whole preload
    }
  }

  /**
   * Get existing opportunity allocations for a user (helper method)
   * This uses the existing ProjectDataService to get current opportunity allocations
   * @param {string} userEmail - User email
   * @param {number} year - The year
   * @param {string} quarter - The quarter
   * @returns {Promise<Array>} Array of existing opportunity allocations
   */
  static async getExistingOpportunityAllocations(userEmail, year, quarter) {
    try {
      // Import ProjectDataService dynamically to avoid circular dependency
      const { ProjectDataService } = await import('./ProjectDataService');
      
      console.log(`Fetching existing opportunity allocations for ${userEmail} in ${quarter} ${year}`);
      const existingAllocations = await ProjectDataService.getOpportunitiesByQuarter(userEmail, year, quarter);
      
      console.log(`Retrieved ${existingAllocations?.length || 0} existing opportunity allocations`);
      return Array.isArray(existingAllocations) ? existingAllocations : [];
    } catch (error) {
      console.error("Error fetching existing opportunity allocations:", error);
      return []; // Return empty array on error, don't fail the whole preload
    }
  }
}
