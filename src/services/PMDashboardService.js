// Updated PMDashboardService.js
import API_CONFIG from './apiConfig';

export class PMDashboardService {
  static apiBaseUrl = API_CONFIG.BASE_URL;

  static async getPMDashboardData(startDate, endDate, pmName = null) {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (startDate) {
        params.append('start_date', startDate);
      }
      
      if (endDate) {
        params.append('end_date', endDate);
      }
      
      if (pmName) {
        params.append('pm_name', encodeURIComponent(pmName));
      }
      
      // Log the full URL for debugging
      const url = `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.PM_DASHBOARD}?${params.toString()}`;
      console.log("Fetching PM dashboard data from URL:", url);
      
      const response = await fetch(url);
      
      // Add detailed error handling
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP Error ${response.status}: ${errorText}`);
        
        // Add fallback for development/testing
        if (response.status === 404) {
          console.warn("Using fallback data since endpoint returned 404");
          return this._getFallbackData();
        }
        
        throw new Error(`Failed to fetch PM dashboard data: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Received PM dashboard data:", data);
      
      return data;
    } catch (error) {
      console.error("Error fetching PM dashboard data:", error);
      // Return a fallback empty structure rather than throwing
      return this._getFallbackData();
    }
  }
  
  static async getAllProjectManagers() {
    try {
      const url = `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.LEADERSHIP_LEADERS}?type=pm`;
      console.log("Fetching project managers from URL:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch project managers: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Received project managers:", data);
      
      return data;
    } catch (error) {
      console.error("Error fetching project managers:", error);
      // Return empty array as fallback
      return [];
    }
  }
  
  // Fallback data method for development/testing
  static _getFallbackData() {
    console.warn("Using fallback data structure");
    return {
      "projects": [],
      "summary": {
        "totalProjects": 0,
        "totalResources": 0,
        "totalHours": 0,
        "totalCost": 0,
        "projectManagers": 0
      }
    };
  }
}

export default PMDashboardService;