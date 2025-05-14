import API_CONFIG from './apiConfig';

export class PMDashboardService {
  static apiBaseUrl = API_CONFIG.BASE_URL;

  static async getPMDashboardData(startDate, endDate, pmName = null, showAllMilestones = false) {
    try {
      // Create a cache key for potentially caching the results
      const cacheKey = `pm_dashboard_${startDate || 'all'}_${endDate || 'all'}_${pmName || 'all'}_${showAllMilestones ? 'all_milestones' : 'filtered_milestones'}`;
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (startDate) {
        params.append('start_date', startDate);
      }
      
      if (endDate) {
        params.append('end_date', endDate);
      }
      
      if (pmName) {
        console.log(`Request filtering by PM: "${pmName}"`);
        params.append('pm_name', pmName);
      }
      
      if (showAllMilestones) {
        params.append('showAllMilestones', 'true');
      }
      
      // Log the full URL for debugging
      const url = `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.PM_DASHBOARD}?${params.toString()}`;
      console.log("Fetching PM dashboard data from URL:", url);
      
      // Add request timing
      console.time('PM Dashboard API Request');
      const response = await fetch(url);
      console.timeEnd('PM Dashboard API Request');

      console.log('PM Dashboard API Response Status:', response.status);
      
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

      // Clone the response for debugging
      const responseClone = response.clone();
      
      try {
        // Try to get the response as text first
        const responseText = await responseClone.text();
        console.log("Raw API response text:", responseText);
        
        // Now parse it to check if it's valid JSON
        try {
          JSON.parse(responseText);
          console.log("Response is valid JSON");
        } catch (jsonError) {
          console.error("Response is not valid JSON:", jsonError);
        }
      } catch (e) {
        console.error("Could not clone and check response:", e);
      }
      
      const data = await response.json();
      console.log("Received PM dashboard data:", data);
      
      // Check if data has expected structure
      if (!data.projects) {
        console.error("API response missing 'projects' array:", data);
        return this._getFallbackData();
      }
      
      console.log(`Received ${data.projects.length} projects for ${pmName || 'all PMs'}`);
      
      // Log summary information
      if (data.summary) {
        console.log("Summary data:", {
          totalProjects: data.summary.totalProjects || 0,
          totalResources: data.summary.totalResources || 0,
          totalHours: data.summary.totalHours || 0,
          totalCost: data.summary.totalCost || 0,
        });
      }
      
      // Cache successful results (not for fallback data)
      if (data.projects) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: data,
            timestamp: Date.now(),
            expiry: Date.now() + (30 * 60 * 1000) // 30 minute expiry
          }));
          console.log(`Cached PM dashboard data with key: ${cacheKey}`);
        } catch (cacheError) {
          console.warn("Failed to cache PM dashboard data:", cacheError);
        }
      }
      
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

