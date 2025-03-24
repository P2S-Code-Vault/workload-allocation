// services/GLTeamService.js
import API_CONFIG from './apiConfig';

export class GLTeamService {
  static cache = {};
  static cacheExpiration = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  /**
   * Get team members for a specific user by trying multiple approaches
   * @param {string} userEmail - Email of the current user
   * @param {string} groupManagerName - Name of the user's group manager
   * @returns {Promise<Array>} - List of team members
   */
  static async getTeamMembersForUser(userEmail, groupManagerName) {
    try {
      // Try different approaches to get team members
      
      // Approach 1: Check if the group manager is in the leaders list
      const groupMembers = await this.getTeamMembersByGroupManager(groupManagerName);
      if (groupMembers && groupMembers.length > 0) {
        console.log(`Found ${groupMembers.length} members using group manager name`);
        return groupMembers;
      }
      
      // Approach 2: Try searching contacts directly
      const contacts = await this.searchContactsByGroupManager(groupManagerName);
      if (contacts && contacts.length > 0) {
        console.log(`Found ${contacts.length} contacts by searching`);
        return this.convertContactsToMembers(contacts);
      }
      
      // No members found through any approach
      console.log("No team members found through any approach");
      return [];
    } catch (error) {
      console.error("Error getting team members for user:", error);
      throw error;
    }
  }
  
  /**
   * Get team members directly by group manager name
   * @param {string} managerName - Name of the group manager
   * @returns {Promise<Array>} - List of team members
   */
  static async getTeamMembersByGroupManager(managerName) {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS_BY_GROUP_MANAGER}?manager_name=${encodeURIComponent(managerName)}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team members by manager: ${response.status}`);
      }
      
      const data = await response.json();
      return data.members || [];
    } catch (error) {
      console.error("Error fetching team members by manager:", error);
      return [];
    }
  }
  
  /**
   * Search contacts by group manager name
   * @param {string} managerName - Name of the group manager
   * @returns {Promise<Array>} - List of contacts
   */
  static async searchContactsByGroupManager(managerName) {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTACTS_SEARCH}?group_manager=${encodeURIComponent(managerName)}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to search contacts: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error searching contacts:", error);
      return [];
    }
  }
  
  /**
   * Convert contacts format to team members format
   * @param {Array} contacts - List of contacts
   * @returns {Array} - List of team members in the expected format
   */
  static convertContactsToMembers(contacts) {
    return contacts.map(contact => ({
      id: contact.contact_id,
      name: contact.full_name,
      email: contact.email,
      labor_category: contact.labor_category || '',
      scheduled_hours: contact.hrs_worked_per_week || 40,
      GroupName: contact.GroupName || 'Unassigned',
      is_group_manager: contact.is_group_manager || false
    }));
  }
  
  /**
   * Get team allocations for a list of emails
   * @param {Array} emails - List of email addresses
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Array>} - List of allocations
   */
  static async getTeamAllocations(emails, startDate, endDate) {
    // Reuse the existing GLService functionality for allocations
    const emailParams = emails.map(email => `emails=${encodeURIComponent(email)}`).join('&');
    const dateParams = `&start_date=${startDate}&end_date=${endDate}`;
    
    const cacheKey = `teamAllocations_${emails.join('_')}_${startDate}_${endDate}`;
    const cachedData = this.getFromCache(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_TEAM_ALLOCATIONS}?${emailParams}${dateParams}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team allocations: ${response.status}`);
      }
      
      const data = await response.json();
      this.saveToCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error("Error fetching team allocations:", error);
      return [];
    }
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
}