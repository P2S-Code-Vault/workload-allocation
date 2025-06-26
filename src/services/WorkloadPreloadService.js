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
      
      const encodedEmail = encodeURIComponent(email);
      const params = new URLSearchParams({
        include_user_projects: includeUserProjects.toString()
      });
      
      const url = `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.CONTACTS_GROUP_PROJECTS_EXTENDED(encodedEmail)}?${params.toString()}`;
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
      console.log('Group projects:', Array.from(groupProjects));
      
      // Filter quarterly workload to only include relevant projects
      const relevantAllocations = quarterlyWorkload.filter(allocation => {
        // Include if it's the user's allocation or a group member's allocation on group projects
        const isUserAllocation = allocation.contact_email === userEmail;
        const isGroupProject = groupProjects.has(allocation.project_number);
        const isUserProject = userProjects.has(allocation.project_number);
        
        return isUserAllocation || isGroupProject || isUserProject;
      });
      
      console.log(`Filtered ${relevantAllocations.length} relevant allocations from ${quarterlyWorkload.length} total`);
      console.log('Sample allocation:', relevantAllocations[0]);
      
      // Transform the data to match the expected table row format
      const projectRows = relevantAllocations
        .filter(allocation => allocation.contact_email === userEmail) // Only user's own allocations for the table
        .map(allocation => ({
          id: allocation.ra_id || allocation.id || `${allocation.project_number}_${allocation.contact_email}`,
          resource: allocation.contact_email,
          projectNumber: allocation.project_number || allocation.proj_id,
          projectName: allocation.project_name || '',
          pm: allocation.project_manager || '',
          labor: allocation.project_contract_labor || allocation.contract_labor || 0,
          pctLaborUsed: 0, // Calculate if needed
          hours: allocation.total_hours || allocation.ra_hours || allocation.hours || 0,
          remarks: allocation.remarks || allocation.ra_remarks || '',
          month: allocation.month_1_hours || allocation.month_hours || 0,
          month1: allocation.month_2_hours || allocation.month_hours1 || 0,
          month2: allocation.month_3_hours || allocation.month_hours2 || 0,
        }));
      
      console.log(`Preloaded ${projectRows.length} project rows for user`);
      console.log('Sample project row:', projectRows[0]);
      
      return {
        projectRows,
        userGroupData,
        relevantAllocations,
        stats: {
          totalQuarterlyAllocations: quarterlyWorkload.length,
          userProjects: userProjects.size,
          groupProjects: groupProjects.size,
          relevantAllocations: relevantAllocations.length,
          userProjectRows: projectRows.length
        }
      };
      
    } catch (error) {
      console.error("Error preloading active projects:", error);
      throw error;
    }
  }
}
