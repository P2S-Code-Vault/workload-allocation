// import API_CONFIG from './apiConfig';

// export class GLService {
//   static async getTeamMembers(groupManagerEmail) {
//     try {
//       const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_TEAM_MEMBERS}?group_manager_email=${encodeURIComponent(groupManagerEmail)}`);
      
//       if (!response.ok) {
//         throw new Error(`Failed to fetch team members: ${response.status}`);
//       }
      
//       const data = await response.json();
//       return data.members || [];
//     } catch (error) {
//       console.error("Error fetching team members:", error);
//       throw error;
//     }
//   }
  
//   static async getTeamAllocations(emails, startDate, endDate) {
//     try {
//       // Convert emails array to query params
//       const emailParams = emails.map(email => `emails=${encodeURIComponent(email)}`).join('&');
//       const dateParams = `&start_date=${startDate}&end_date=${endDate}`;
      
//       const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_TEAM_ALLOCATIONS}?${emailParams}${dateParams}`;
//       const response = await fetch(url);
      
//       if (!response.ok) {
//         throw new Error(`Failed to fetch team allocations: ${response.status}`);
//       }
      
//       return await response.json();
//     } catch (error) {
//       console.error("Error fetching team allocations:", error);
//       throw error;
//     }
//   }
  
//   static async batchUpdateAllocations(updates) {
//     try {
//       const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_BATCH_UPDATE}`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ allocations: updates })
//       });
      
//       if (!response.ok) {
//         throw new Error(`Failed to update allocations: ${response.status}`);
//       }
      
//       return await response.json();
//     } catch (error) {
//       console.error("Error updating allocations:", error);
//       throw error;
//     }
//   }
// }

// services/GLService.js
import API_CONFIG from './apiConfig';

export class GLService {
  static cache = {};
  static cacheExpiration = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  static async getTeamMembers(groupManagerEmail) {
    // Check cache first
    const cacheKey = `teamMembers_${groupManagerEmail}`;
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_TEAM_MEMBERS}?group_manager_email=${encodeURIComponent(groupManagerEmail)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team members: ${response.status}`);
      }
      
      const data = await response.json();
      const members = data.members || [];
      
      // Save to cache
      this.saveToCache(cacheKey, members);
      
      return members;
    } catch (error) {
      console.error("Error fetching team members:", error);
      throw error;
    }
  }
  
  static async getTeamAllocations(emails, startDate, endDate) {
    // Check cache first
    const cacheKey = `teamAllocations_${emails.join('_')}_${startDate}_${endDate}`;
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      // Convert emails array to query params
      const emailParams = emails.map(email => `emails=${encodeURIComponent(email)}`).join('&');
      const dateParams = `&start_date=${startDate}&end_date=${endDate}`;
      
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_TEAM_ALLOCATIONS}?${emailParams}${dateParams}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team allocations: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Save to cache
      this.saveToCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error("Error fetching team allocations:", error);
      throw error;
    }
  }
  
  static async batchUpdateAllocations(updates) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_BATCH_UPDATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ allocations: updates })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update allocations: ${response.status}`);
      }
      
      // Clear relevant caches after update
      this.clearCacheWithPattern('teamAllocations_');
      
      return await response.json();
    } catch (error) {
      console.error("Error updating allocations:", error);
      throw error;
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
  
  static clearCacheWithPattern(pattern) {
    Object.keys(this.cache).forEach(key => {
      if (key.includes(pattern)) {
        delete this.cache[key];
      }
    });
  }
}