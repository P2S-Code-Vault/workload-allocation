// services/GLTeamService.js
import API_CONFIG from './apiConfig';

export class GLTeamService {
  static cache = {};
  static cacheExpiration = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  /**
   * Get team members for a group manager (GET /gl/team-members?group_manager_email=...)
   * @param {string} groupManagerEmail - Email of the group manager
   * @returns {Promise<Array>} - List of team members
   */
  static async getTeamMembers(groupManagerEmail) {
    try {
      const cacheKey = `teamMembers_${groupManagerEmail}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) return cachedData;
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_TEAM_MEMBERS}?group_manager_email=${encodeURIComponent(groupManagerEmail)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch team members: ${response.status}`);
      const data = await response.json();
      this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error("Error fetching team members (GL API):", error);
      throw error;
    }
  }

  /**
   * Get detailed milestone information by ID
   * @param {number} milestoneId - The milestone ID
   * @returns {Promise<Object>} - Milestone details
   */
  static async getMilestoneDetails(milestoneId) {
    try {
      const cacheKey = `milestone_${milestoneId}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) return cachedData;
      
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.MILESTONES}/${milestoneId}`;
      console.log(`[GLTeamService] Fetching milestone details for ID ${milestoneId} from:`, url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch milestone details: ${response.status}`);
      const data = await response.json();
      
      this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching milestone details for ID ${milestoneId}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed project information by ID
   * @param {string} projectId - The project ID
   * @returns {Promise<Object>} - Project details
   */
  static async getProjectDetails(projectId) {
    try {
      const cacheKey = `project_${projectId}`;
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) return cachedData;
      
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROJECT_BY_ID(projectId)}`;
      console.log(`[GLTeamService] Fetching project details for ID ${projectId} from:`, url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch project details: ${response.status}`);
      const data = await response.json();
      
      this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching project details for ID ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get quarterly milestones for a group manager (GET /gl/milestones/quarterly)
   */
  static async getQuarterlyMilestones(groupManagerEmail, year, quarter) {
    console.log('[GLTeamService] getQuarterlyMilestones called with:', {
      groupManagerEmail,
      year,
      quarter
    });
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_MILESTONES_QUARTERLY}?group_manager_email=${encodeURIComponent(groupManagerEmail)}&year=${year}&quarter=${quarter}`;
    console.log('[GLTeamService] Fetching quarterly milestones URL:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch quarterly milestones: ${response.status}`);
    return await response.json();
  }

  /**
   * Get quarterly opportunities for a group manager (GET /gl/opportunities/quarterly)
   */
  static async getQuarterlyOpportunities(groupManagerEmail, year, quarter) {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_OPPORTUNITIES_QUARTERLY}?group_manager_email=${encodeURIComponent(groupManagerEmail)}&year=${year}&quarter=${quarter}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch quarterly opportunities: ${response.status}`);
    return await response.json();
  }

  /**
   * Get quarterly projects for a group manager (GET /gl/projects/quarterly)
   */
  static async getQuarterlyProjects(groupManagerEmail, year, quarter) {
    console.log('[GLTeamService] getQuarterlyProjects called with:', {
      groupManagerEmail,
      year,
      quarter
    });
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_PROJECTS_QUARTERLY}?group_manager_email=${encodeURIComponent(groupManagerEmail)}&year=${year}&quarter=${quarter}`;
    console.log('[GLTeamService] Fetching quarterly projects URL:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch quarterly projects: ${response.status}`);
    return await response.json();
  }

  /**
   * Get monthly milestones for a group manager (GET /gl/milestones/monthly)
   */
  static async getMonthlyMilestones(groupManagerEmail, year, quarter) {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_MILESTONES_MONTHLY}?group_manager_email=${encodeURIComponent(groupManagerEmail)}&year=${year}&quarter=${quarter}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch monthly milestones: ${response.status}`);
    return await response.json();
  }

  /**
   * Get monthly opportunities for a group manager (GET /gl/opportunities/monthly)
   */
  static async getMonthlyOpportunities(groupManagerEmail, year, quarter) {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_OPPORTUNITIES_MONTHLY}?group_manager_email=${encodeURIComponent(groupManagerEmail)}&year=${year}&quarter=${quarter}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch monthly opportunities: ${response.status}`);
    return await response.json();
  }

  /**
   * Get monthly projects for a group manager (GET /gl/projects/monthly)
   */
  static async getMonthlyProjects(groupManagerEmail, year, quarter) {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_PROJECTS_MONTHLY}?group_manager_email=${encodeURIComponent(groupManagerEmail)}&year=${year}&quarter=${quarter}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch monthly projects: ${response.status}`);
    return await response.json();
  }

  /**
   * Get combined workload for a group manager (GET /gl/workload/combined)
   */
  static async getCombinedWorkload(groupManagerEmail, year, quarter) {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_WORKLOAD_COMBINED}?group_manager_email=${encodeURIComponent(groupManagerEmail)}&year=${year}&quarter=${quarter}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch combined workload: ${response.status}`);
    return await response.json();
  }

  /**
   * Get combined workload with projects for a group manager (GET /gl/workload/combined-with-projects)
   */
  static async getCombinedWorkloadWithProjects(groupManagerEmail, year, quarter) {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_WORKLOAD_COMBINED_WITH_PROJECTS}?group_manager_email=${encodeURIComponent(groupManagerEmail)}&year=${year}&quarter=${quarter}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch combined workload with projects: ${response.status}`);
    return await response.json();
  }

  /**
   * Batch update workload projections (POST /gl/workload/batch-update)
   */
  static async batchUpdateWorkload(groupManagerEmail, milestoneUpdates, opportunityUpdates) {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_WORKLOAD_BATCH_UPDATE}?group_manager_email=${encodeURIComponent(groupManagerEmail)}`;
    const body = {};
    if (milestoneUpdates) body.milestone_updates = milestoneUpdates;
    if (opportunityUpdates) body.opportunity_updates = opportunityUpdates;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Failed to batch update workload: ${response.status}`);
    return await response.json();
  }

  /**
   * Batch update workload projections with projects (POST /gl/workload/batch-update-with-projects)
   */
  static async batchUpdateWorkloadWithProjects(groupManagerEmail, milestoneUpdates, opportunityUpdates, projectUpdates) {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_WORKLOAD_BATCH_UPDATE_WITH_PROJECTS}?group_manager_email=${encodeURIComponent(groupManagerEmail)}`;
    const body = {};
    if (milestoneUpdates) body.milestone_updates = milestoneUpdates;
    if (opportunityUpdates) body.opportunity_updates = opportunityUpdates;
    if (projectUpdates) body.project_updates = projectUpdates;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Failed to batch update workload with projects: ${response.status}`);
    return await response.json();
  }

  /**
   * Check GL access (GET /gl/access-check?email=...)
   */
  static async checkGLAccess(email) {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_ACCESS_CHECK}?email=${encodeURIComponent(email)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to check GL access: ${response.status}`);
    return await response.json();
  }

  /**
   * Get team allocations (milestones and opportunities) for a group manager by quarter and year
   * @param {string} groupManagerEmail
   * @param {number|string} year
   * @param {number|string} quarter
   * @returns {Promise<{milestones: Array, opportunities: Array}>}
   */
  static async getTeamAllocationsByQuarter(groupManagerEmail, year, quarter) {
    console.log('[GLTeamService] getTeamAllocationsByQuarter called with:', {
      groupManagerEmail,
      year,
      quarter
    });
    const [milestones, opportunities] = await Promise.all([
      this.getQuarterlyMilestones(groupManagerEmail, year, quarter),
      this.getQuarterlyOpportunities(groupManagerEmail, year, quarter)
    ]);
    return { milestones, opportunities };
  }

  /**
   * Get team allocations with projects (milestones, opportunities, and projects) for a group manager by quarter and year
   * @param {string} groupManagerEmail
   * @param {number|string} year
   * @param {number|string} quarter
   * @returns {Promise<{milestones: Array, opportunities: Array, projects: Array}>}
   */
  static async getTeamAllocationsByQuarterWithProjects(groupManagerEmail, year, quarter) {
    console.log('[GLTeamService] getTeamAllocationsByQuarterWithProjects called with:', {
      groupManagerEmail,
      year,
      quarter
    });
    const [milestones, opportunities, projects] = await Promise.all([
      this.getQuarterlyMilestones(groupManagerEmail, year, quarter),
      this.getQuarterlyOpportunities(groupManagerEmail, year, quarter),
      this.getQuarterlyProjects(groupManagerEmail, year, quarter)
    ]);
    return { milestones, opportunities, projects };
  }

  /**
   * Get team monthly allocations (milestones) for a group manager by quarter and year
   * @param {string} groupManagerEmail
   * @param {number|string} year
   * @param {string} quarter (e.g., 'Q1')
   * @returns {Promise<Object>} monthly_milestones object from backend
   */
  static async getTeamMonthlyAllocations(groupManagerEmail, year, quarter) {
    console.log('[GLTeamService] getTeamMonthlyAllocations called with:', {
      groupManagerEmail,
      year,
      quarter
    });
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_MILESTONES_MONTHLY}?group_manager_email=${encodeURIComponent(groupManagerEmail)}&year=${year}&quarter=${quarter}`;
    console.log('[GLTeamService] Fetching monthly milestones URL:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch monthly milestones: ${response.status}`);
    const data = await response.json();
    return data.monthly_milestones;
  }

  /**
   * Get team monthly allocations with detailed milestone information
   * @param {string} groupManagerEmail
   * @param {number|string} year
   * @param {string} quarter (e.g., 'Q1')
   * @returns {Promise<Object>} monthly_milestones object with enhanced milestone details
   */
  static async getTeamMonthlyAllocationsWithDetails(groupManagerEmail, year, quarter) {
    console.log('[GLTeamService] getTeamMonthlyAllocationsWithDetails called with:', {
      groupManagerEmail,
      year,
      quarter
    });
    
    // Get the basic monthly data
    const monthlyData = await this.getTeamMonthlyAllocations(groupManagerEmail, year, quarter);
    console.log('[GLTeamService] Basic monthly data received:', monthlyData);
    
    // Extract unique milestone IDs from all monthly data
    const milestoneIds = new Set();
    if (monthlyData && monthlyData.monthly_data) {
      Object.values(monthlyData.monthly_data).forEach(monthAllocations => {
        monthAllocations.forEach(allocation => {
          if (allocation.milestone_id) {
            milestoneIds.add(allocation.milestone_id);
          }
        });
      });
    }
    
    console.log('[GLTeamService] Found unique milestone IDs:', Array.from(milestoneIds));
    
    // Fetch detailed milestone information for all unique milestone IDs
    const milestoneDetailsPromises = Array.from(milestoneIds).map(async (milestoneId) => {
      try {
        const details = await this.getMilestoneDetails(milestoneId);
        return { id: milestoneId, details };
      } catch (error) {
        console.warn(`Failed to fetch details for milestone ${milestoneId}:`, error);
        return { id: milestoneId, details: null };
      }
    });
    
    const milestoneDetailsResults = await Promise.all(milestoneDetailsPromises);
    const milestoneDetailsMap = new Map();
    milestoneDetailsResults.forEach(({ id, details }) => {
      milestoneDetailsMap.set(id, details);
    });
    
    console.log('[GLTeamService] Milestone details fetched for IDs:', Array.from(milestoneDetailsMap.keys()));
    
    // Enhance the monthly data with detailed milestone information
    if (monthlyData && monthlyData.monthly_data) {
      Object.keys(monthlyData.monthly_data).forEach(monthKey => {
        monthlyData.monthly_data[monthKey] = monthlyData.monthly_data[monthKey].map(allocation => {
          const milestoneDetails = milestoneDetailsMap.get(allocation.milestone_id);
          if (milestoneDetails) {
            console.log(`[GLTeamService] Enhancing allocation for milestone ${allocation.milestone_id} with details:`, milestoneDetails);
            return {
              ...allocation,
              // Add detailed milestone information
              project_number: milestoneDetails.project_number,
              project_name: milestoneDetails.project_name,
              milestone_name: milestoneDetails.milestone_name,
              project_manager: milestoneDetails.project_manager,
              act_mult_rate: milestoneDetails.act_mult_rate,
              contract_labor: milestoneDetails.contract_labor,
              forecast_pm_labor: milestoneDetails.forecast_pm_labor,
              milestone_status: milestoneDetails.milestone_status,
              is_billable: milestoneDetails.is_billable,
            };
          }
          return allocation;
        });
      });
    }
    
    console.log('[GLTeamService] Enhanced monthly data with milestone details:', monthlyData);
    return monthlyData;
  }

  /**
   * Get team monthly project allocations for a group manager by quarter and year
   * @param {string} groupManagerEmail
   * @param {number|string} year
   * @param {string} quarter (e.g., 'Q1')
   * @returns {Promise<Object>} monthly_projects object from backend
   */
  static async getTeamMonthlyProjectAllocations(groupManagerEmail, year, quarter) {
    console.log('[GLTeamService] getTeamMonthlyProjectAllocations called with:', {
      groupManagerEmail,
      year,
      quarter
    });
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_PROJECTS_MONTHLY}?group_manager_email=${encodeURIComponent(groupManagerEmail)}&year=${year}&quarter=${quarter}`;
    console.log('[GLTeamService] Fetching monthly projects URL:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch monthly projects: ${response.status}`);
    const data = await response.json();
    return data.monthly_projects;
  }

  /**
   * Get team monthly project allocations with detailed project information
   * @param {string} groupManagerEmail
   * @param {number|string} year
   * @param {string} quarter (e.g., 'Q1')
   * @returns {Promise<Object>} monthly_projects object with enhanced project details
   */
  static async getTeamMonthlyProjectAllocationsWithDetails(groupManagerEmail, year, quarter) {
    console.log('[GLTeamService] getTeamMonthlyProjectAllocationsWithDetails called with:', {
      groupManagerEmail,
      year,
      quarter
    });
    
    // Get the basic monthly project data
    const monthlyData = await this.getTeamMonthlyProjectAllocations(groupManagerEmail, year, quarter);
    console.log('[GLTeamService] Basic monthly project data received:', monthlyData);
    
    // Extract unique project IDs from all monthly data
    const projectIds = new Set();
    if (monthlyData && monthlyData.monthly_data) {
      Object.values(monthlyData.monthly_data).forEach(monthAllocations => {
        monthAllocations.forEach(allocation => {
          if (allocation.project_id) {
            projectIds.add(allocation.project_id);
          }
        });
      });
    }
    
    console.log('[GLTeamService] Found unique project IDs:', Array.from(projectIds));
    
    // Fetch detailed project information for all unique project IDs
    const projectDetailsPromises = Array.from(projectIds).map(async (projectId) => {
      try {
        const details = await this.getProjectDetails(projectId);
        return { id: projectId, details };
      } catch (error) {
        console.warn(`Failed to fetch details for project ${projectId}:`, error);
        return { id: projectId, details: null };
      }
    });
    
    const projectDetailsResults = await Promise.all(projectDetailsPromises);
    const projectDetailsMap = new Map();
    projectDetailsResults.forEach(({ id, details }) => {
      projectDetailsMap.set(id, details);
    });
    
    console.log('[GLTeamService] Project details fetched for IDs:', Array.from(projectDetailsMap.keys()));
    
    // Enhance the monthly data with detailed project information
    if (monthlyData && monthlyData.monthly_data) {
      Object.keys(monthlyData.monthly_data).forEach(monthKey => {
        monthlyData.monthly_data[monthKey] = monthlyData.monthly_data[monthKey].map(allocation => {
          const projectDetails = projectDetailsMap.get(allocation.project_id);
          if (projectDetails) {
            console.log(`[GLTeamService] Enhancing allocation for project ${allocation.project_id} with details:`, projectDetails);
            return {
              ...allocation,
              // Add detailed project information
              project_number: projectDetails.project_number,
              project_name: projectDetails.project_name,
              project_manager: projectDetails.project_manager,
              project_contract_labor: projectDetails.project_contract_labor,
              status: projectDetails.status,
              created_date: projectDetails.created_date,
              modified_date: projectDetails.modified_date,
            };
          }
          return allocation;
        });
      });
    }
    
    console.log('[GLTeamService] Enhanced monthly project data with project details:', monthlyData);
    return monthlyData;
  }

  /**
   * Get all staff monthly workload for a given year and quarter (for 'All Groups' view)
   * @param {number|string} year
   * @param {string} quarter (e.g., 'Q1')
   * @returns {Promise<Object>} backend response for all staff monthly workload
   */
  static async getAllStaffMonthlyWorkload(year, quarter) {
    console.log('[GLTeamService] getAllStaffMonthlyWorkload called with:', { year, quarter });
    const url = `${API_CONFIG.BASE_URL}/all-staff/workload/monthly?year=${year}&quarter=${quarter}`;
    console.log('[GLTeamService] Fetching all staff monthly workload URL:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch all staff monthly workload: ${response.status}`);
    return await response.json();
  }

  // Cache helper methods
  static saveToCache(key, data) {
    this.cache[key] = {
      data,
      timestamp: Date.now()
    };
  }
  
  static getFromCache(key) {
    const cached = this.cache[key];
    if (!cached) return null;
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.cacheExpiration) {
      delete this.cache[key];
      return null;
    }
    
    return cached.data;
  }
  
  static clearCache() {
    this.cache = {};
  }

  static clearCacheWithPattern(pattern) {
    const keysToDelete = Object.keys(this.cache).filter(key => key.startsWith(pattern));
    for (const key of keysToDelete) {
      delete this.cache[key];
    }
  }
}