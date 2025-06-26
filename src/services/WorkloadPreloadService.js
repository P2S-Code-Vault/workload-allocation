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
      
      return data;
    } catch (error) {
      console.error("Error fetching user group projects:", error);
      throw error;
    }
  }

  /**
   * Preload all active projects for a user and their group
   * Combines data from both the quarterly workload and user's group projects
   * @param {string} userEmail - User email
   * @param {number} year - The year
   * @param {string} quarter - The quarter
   * @returns {Promise<Object>} Object containing preloaded project data
   */
  static async preloadActiveProjects(userEmail, year, quarter) {
    try {
      console.log(`Preloading active projects for ${userEmail} in ${quarter} ${year}`);
      
      // Fetch both data sources in parallel
      const [quarterlyWorkload, userGroupData] = await Promise.all([
        this.getAllProjectsWorkloadQuarterly(year, quarter),
        this.getUserGroupProjectsExtended(userEmail, true)
      ]);
      
      console.log('Quarterly workload data received:', quarterlyWorkload?.length || 0, 'items');
      console.log('User group data received:', userGroupData);
      
      // Extract relevant projects from the quarterly workload
      const userProjects = new Set();
      const groupProjects = new Set();
      
      // Add user's group projects and user-managed projects from the extended data
      if (userGroupData.group_projects && Array.isArray(userGroupData.group_projects)) {
        userGroupData.group_projects.forEach(project => {
          groupProjects.add(project.project_number);
        });
      }
      
      // Add user's individual managed projects if available
      if (userGroupData.user_managed_projects && Array.isArray(userGroupData.user_managed_projects)) {
        userGroupData.user_managed_projects.forEach(project => {
          userProjects.add(project.project_number);
        });
      }
      
      console.log(`Found ${userProjects.size} user projects and ${groupProjects.size} group projects`);
      console.log('User projects:', Array.from(userProjects));
      console.log('Group projects sample:', Array.from(groupProjects).slice(0, 10));
      
      // Create table rows directly from project information instead of relying on existing allocations
      const projectRows = [];
      
      // Add rows for user's managed projects (these are the user's individual projects)
      if (userGroupData.user_managed_projects && Array.isArray(userGroupData.user_managed_projects)) {
        console.log(`Processing ${userGroupData.user_managed_projects.length} user managed projects`);
        userGroupData.user_managed_projects.forEach(project => {
          // Check if there's existing allocation data for this project
          const existingAllocation = quarterlyWorkload.find(allocation => 
            allocation.project_number === project.project_number && 
            allocation.contact_email === userEmail
          );
          
          projectRows.push({
            id: existingAllocation?.ra_id || existingAllocation?.id || `${project.project_number}_${userEmail}`,
            resource: userEmail,
            projectNumber: project.project_number,
            projectName: project.project_name || '',
            pm: project.project_manager || '',
            labor: project.project_contract_labor || 0,
            pctLaborUsed: 0,
            hours: existingAllocation?.total_hours || existingAllocation?.ra_hours || 0,
            remarks: existingAllocation?.remarks || existingAllocation?.ra_remarks || '',
            month: existingAllocation?.month_1_hours || existingAllocation?.month_hours || 0,
            month1: existingAllocation?.month_2_hours || existingAllocation?.month_hours1 || 0,
            month2: existingAllocation?.month_3_hours || existingAllocation?.month_hours2 || 0,
          });
        });
      }
      
      console.log(`Added ${projectRows.length} user managed project rows`);
      
      // Add group projects that the user can potentially work on
      if (userGroupData.group_projects && Array.isArray(userGroupData.group_projects)) {
        console.log(`Processing ${userGroupData.group_projects.length} group projects`);
        // Add all group projects (or limit to a reasonable number if too many)
        const groupProjectsToAdd = userGroupData.group_projects
          .filter(project => !userProjects.has(project.project_number)) // Don't duplicate user projects
          .slice(0, 20); // Limit to 20 to avoid overwhelming the UI, but show more than 5
          
        console.log(`Will add ${groupProjectsToAdd.length} group projects to table`);
        
        groupProjectsToAdd.forEach(project => {
          // Check if there's existing allocation data for this project
          const existingAllocation = quarterlyWorkload.find(allocation => 
            allocation.project_number === project.project_number && 
            allocation.contact_email === userEmail
          );
          
          // Add all group projects - both with and without existing allocations
          projectRows.push({
            id: existingAllocation?.ra_id || existingAllocation?.id || `${project.project_number}_${userEmail}`,
            resource: userEmail,
            projectNumber: project.project_number,
            projectName: project.project_name || '',
            pm: project.project_manager || '',
            labor: project.project_contract_labor || 0,
            pctLaborUsed: 0,
            hours: existingAllocation?.total_hours || existingAllocation?.ra_hours || 0,
            remarks: existingAllocation?.remarks || existingAllocation?.ra_remarks || '',
            month: existingAllocation?.month_1_hours || existingAllocation?.month_hours || 0,
            month1: existingAllocation?.month_2_hours || existingAllocation?.month_hours1 || 0,
            month2: existingAllocation?.month_3_hours || existingAllocation?.month_hours2 || 0,
          });
        });
      }
      
      console.log(`Total project rows created: ${projectRows.length} (user managed + group projects)`);
      console.log('Sample project row:', projectRows[0]);
      
      return {
        projectRows,
        userGroupData,
        quarterlyWorkload,
        stats: {
          totalQuarterlyAllocations: quarterlyWorkload.length,
          userProjects: userProjects.size,
          groupProjects: groupProjects.size,
          userProjectRows: projectRows.length
        }
      };
      
    } catch (error) {
      console.error("Error preloading active projects:", error);
      throw error;
    }
  }
}
