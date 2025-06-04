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
   * Get combined workload for a group manager (GET /gl/workload/combined)
   */
  static async getCombinedWorkload(groupManagerEmail, year, quarter) {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_WORKLOAD_COMBINED}?group_manager_email=${encodeURIComponent(groupManagerEmail)}&year=${year}&quarter=${quarter}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch combined workload: ${response.status}`);
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