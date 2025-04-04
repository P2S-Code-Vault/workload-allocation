import API_CONFIG from './apiConfig';
import ProjectSearchService from './ProjectSearchService';

export class ProjectDataService {
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

  // Updated search method with proper error handling
  static async searchMilestones(searchTerm, limit = 10) {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }
    
    try {
      console.log(`Searching milestones with term: ${searchTerm}`);
      
      // Create a cache key for this search
      const cacheKey = `milestone_search_${searchTerm}`;
      
      // Try cache first for better performance
      const cachedResults = this.getCachedData(cacheKey);
      if (cachedResults) {
        console.log(`Using ${cachedResults.length} cached results for search term: ${searchTerm}`);
        return cachedResults;
      }
      
      // Build the search URL with parameters
      const params = new URLSearchParams({
        term: searchTerm,
        limit: limit
      });
      
      // Use the proper endpoint from the config
      const url = `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.MILESTONE_SEARCH}?${params.toString()}`;
      console.log(`Fetching milestone search from: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await this.handleErrorResponse(response);
        console.error(`Search failed with status ${response.status}: ${errorText}`);
        
        // Return empty array on error instead of throwing
        // This keeps the UI working even if the search fails
        return [];
      }
      
      const results = await response.json();
      console.log(`Received ${results.length} search results for term: ${searchTerm}`);
      
      // Cache the results for 5 minutes (300,000 ms)
      this.cacheData(cacheKey, results, 300000);
      
      return results;
    } catch (error) {
      console.error("Error searching milestones:", error);
      return [];
    }
  }

  // Get milestone details from project number
  static async getMilestoneDetails(projectNumber) {
    try {
      console.log('Fetching milestone details for:', projectNumber);
      const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.MILESTONES}/${encodeURIComponent(projectNumber)}`);

      if (!response.ok) {
        const errorText = await this.handleErrorResponse(response);
        throw new Error(`Milestone not found: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to fetch milestone details:", error);
      throw error;
    }
  }

static async getAllocations(email, startDate, endDate) {
  try {
    // Validate inputs
    if (!email) {
      throw new Error("Email is required for fetching allocations");
    }
    
    // Create a unique cache key for this query
    const cacheKey = `allocations_${email}_${startDate || 'current'}_${endDate || 'current'}_v2`;
    
    console.log(`Fetching allocations with dates: start=${startDate}, end=${endDate}`);
    // const cacheKey = `allocations_${email}_${startDate}_${endDate}`;
    const skipCache = (startDate && endDate);
    const cachedData = skipCache ? null : this.getCachedData(cacheKey);
    
    if (cachedData) {
      console.log(`Using cached allocations for ${email} from ${startDate} to ${endDate}`);
      return cachedData;
    }
    // Build query parameters
    const params = new URLSearchParams();
    params.append('email', email);
    
    if (startDate) {
      console.log(`Adding start_date param: ${startDate}`);
      params.append('start_date', startDate);
    }
    
    if (endDate) {
      console.log(`Adding end_date param: ${endDate}`);
      params.append('end_date', endDate);
    }
    
    // Log the full URL for debugging
    const url = `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.ALLOCATIONS}?${params.toString()}`;
    console.log("Fetching allocations from URL:", url);
    
    const response = await fetch(url);
    
    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await this.handleErrorResponse(response);
      throw new Error(`Failed to fetch allocations: ${errorText}`);
    }
    
    // Parse response
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn("Response is not JSON:", contentType);
      const text = await response.text();
      console.log("Response text:", text);
      
      if (!text || text.trim() === '') {
        return [];
      }
      
      try {
        // Try to parse anyway
        const data = JSON.parse(text);
        
        // Cache the results (1 hour expiration for allocations)
        this.cacheData(cacheKey, data, 60 * 60 * 1000);
        
        return data;
      } catch (e) {
        console.error("Failed to parse non-JSON response:", e);
        throw new Error("Server returned an invalid response format");
      }
    }
    
    const data = await response.json();
    console.log("Received allocations:", data);
    
    // Normalize data - handle both arrays and single objects
    const normalizedData = Array.isArray(data) ? data : (data ? [data] : []);
    
    // Cache the results (1 hour expiration for allocations)
    this.cacheData(cacheKey, normalizedData, 60 * 60 * 1000);
    
    return normalizedData;
  } catch (error) {
    console.error("Error fetching allocations:", error);
    throw error;
  }
}

// Cache utilities - reuse the ones we created earlier
static getCachedData(key) {
  try {
    const cachedItem = localStorage.getItem(key);
    if (!cachedItem) return null;
    
    const { data, expiry } = JSON.parse(cachedItem);
    const now = Date.now();
    
    if (now > expiry) {
      // Cache expired
      localStorage.removeItem(key);
      return null;
    }
    
    return data;
  } catch (error) {
    console.warn(`Error retrieving cached data for ${key}:`, error);
    return null;
  }
}

static cacheData(key, data, ttlMs) {
  try {
    // Add a version or timestamp to prevent stale cache issues
    const cacheItem = {
      data,
      expiry: Date.now() + ttlMs,
      version: '1.0', // Add version to help with cache busting if needed
      timestamp: Date.now()
    };
    
    localStorage.setItem(key, JSON.stringify(cacheItem));
    console.log(`Cached data for key: ${key}`);
  } catch (error) {
    console.warn(`Error caching data for ${key}:`, error);
    // If localStorage is full, clear old cache items
    this.pruneCache();
  }
}


static pruneCache() {
  try {
    // Find all cache entries
    const cacheEntries = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        const value = localStorage.getItem(key);
        const parsed = JSON.parse(value);
        
        // Only consider entries that have our cache structure
        if (parsed && parsed.expiry) {
          cacheEntries.push({
            key,
            expiry: parsed.expiry
          });
        }
      } catch (e) {
        // Skip entries that aren't valid JSON
        continue;
      }
    }
    
    // Sort by expiry (oldest first)
    cacheEntries.sort((a, b) => a.expiry - b.expiry);
    
    // Remove the oldest 50% if we have too many entries
    if (cacheEntries.length > 20) {
      const entriesToRemove = Math.floor(cacheEntries.length / 2);
      for (let i = 0; i < entriesToRemove; i++) {
        localStorage.removeItem(cacheEntries[i].key);
      }
    }
  } catch (error) {
    console.warn("Error pruning cache:", error);
  }
}


  // Save a new resource allocation
static async saveResourceAllocation(data) {
  try {
    // Validation
    if (!data.email || !data.project_number || !data.hours) {
      throw new Error("Missing required allocation data: email, project_number, and hours are required");
    }
  
    // Try to get project details from CSV if available
    let projectDetails = null;
    try {
      projectDetails = await ProjectSearchService.getProjectDetails(data.project_number);
      console.log("Found project details in CSV:", projectDetails);
    } catch (e) {
      console.log(`Project details not found in CSV for ${data.project_number}`);
    }
    
    // Format the data to match backend expectations
    const requestBody = {
      email: data.email,
      project_number: data.project_number,
      hours: parseFloat(data.hours) || 0,
      remarks: data.remarks || "",
      week_start: data.week_start || null,
      week_end: data.week_end || null
    };
    
    // Add milestone information if available from CSV
    if (projectDetails) {
      requestBody.project_name = projectDetails['Project Name'] || null;
      requestBody.milestone_name = projectDetails['Milestone'] || null;
      requestBody.project_manager = projectDetails['PM'] || null;
      requestBody.contract_labor = projectDetails['Labor'] || null;
      
      // Log that we're including milestone data
      console.log(`Including milestone data from CSV for ${data.project_number}`, {
        project_name: requestBody.project_name,
        milestone_name: requestBody.milestone_name,
        project_manager: requestBody.project_manager,
        contract_labor: requestBody.contract_labor
      });
    }
    
    console.log(`Creating new allocation:`, requestBody);
    const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.ALLOCATIONS}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await this.handleErrorResponse(response);
      throw new Error(`Failed to save allocation: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error saving allocation:", error);
    throw error;
  }
}

  static async updateAllocation(allocationId, hours, remarks) {
    try {
      // More aggressive validation and logging
      console.log(`updateAllocation called with ID: ${allocationId}, Type: ${typeof allocationId}`);
      
      if (!allocationId) {
        console.error("Missing allocation ID in updateAllocation call");
        throw new Error("Allocation ID is required for updates");
      }
      
      // Ensure the ID is properly formatted - normalize to string
      const normalizedId = String(allocationId).replace(/[^\d]/g, '');
      
      if (!normalizedId) {
        console.error(`Invalid allocation ID format: ${allocationId}`);
        throw new Error("Invalid allocation ID format");
      }
      
      console.log(`Using normalized ID: ${normalizedId}`);
      
      // Validate hours
      const parsedHours = parseFloat(hours);
      if (isNaN(parsedHours)) {
        console.error(`Invalid hours value: ${hours}`);
        throw new Error("Hours must be a valid number");
      }
      
      // Clear any cached allocations
      this.clearAllAllocationCache();
      
      // Prepare request payload
      const payload = {
        hours: parsedHours,
        remarks: remarks || ""
      };
      
      console.log(`Sending UPDATE request to: ${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.ALLOCATIONS}/${normalizedId}`);
      console.log("With payload:", payload);
      
      // Make the API request with explicit content type and accept headers
      const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.ALLOCATIONS}/${normalizedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      // Log response status and headers
      console.log(`Update response status: ${response.status}`);
      console.log(`Response headers:`, {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });
      
      // Check for errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from server: ${errorText}`);
        throw new Error(`Failed to update allocation: ${errorText}`);
      }
      
      // Parse the response
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.log(`Non-JSON response: ${text}`);
        
        try {
          responseData = JSON.parse(text);
        } catch (e) {
          console.log("Could not parse response as JSON, using default success response");
          responseData = { message: "Allocation updated successfully", allocation_id: normalizedId };
        }
      } else {
        responseData = await response.json();
      }
      
      console.log("Update success response:", responseData);
      return responseData;
    } catch (error) {
      console.error("Error in updateAllocation:", error);
      throw error;
    }
  }
  
  // Clear all allocation-related cache entries
  static clearAllAllocationCache() {
    try {
      const keysToRemove = [];
      
      // Find all cache keys related to allocations
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('allocation')) {
          keysToRemove.push(key);
        }
      }
      
      // Remove matched keys
      console.log(`Clearing ${keysToRemove.length} cached allocation items`);
      keysToRemove.forEach(key => {
        console.log(`Removing cache key: ${key}`);
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn("Error clearing allocation cache:", error);
    }
  }
  
  // Add a method to clear cache entries matching a pattern
  static clearCacheWithPattern(pattern) {
    try {
      const keysToRemove = [];
      
      // Find all cache keys matching the pattern
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(pattern)) {
          keysToRemove.push(key);
        }
      }
      
      // Remove matched keys
      console.log(`Clearing ${keysToRemove.length} cached items matching pattern: ${pattern}`);
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn(`Error clearing cache with pattern ${pattern}:`, error);
    }
  }

  static async deleteAllocation(allocationId) {
    try {
      if (!allocationId) {
        throw new Error("Allocation ID is required");
      }
      
      console.log(`Deleting allocation ${allocationId}`);
      const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.ALLOCATIONS}/${allocationId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        const errorText = await this.handleErrorResponse(response);
        throw new Error(`Failed to delete allocation: ${errorText}`);
      }
      
      // Remove specific cache entries that might contain this allocation
      this.removeAllocationFromCache(allocationId);
      
      return await response.json();
    } catch (error) {
      console.error("Error deleting allocation:", error);
      throw error;
    }
  }
  
  // Add this new method to handle targeted cache cleaning
  static removeAllocationFromCache(allocationId) {
    try {
      // Find all allocation cache keys
      const allocationCacheKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('allocations_')) {
          allocationCacheKeys.push(key);
        }
      }
      
      console.log(`Found ${allocationCacheKeys.length} allocation cache entries to check`);
      
      // For each cache entry, load it, filter out the deleted allocation, and save it back
      allocationCacheKeys.forEach(key => {
        try {
          const cachedItem = localStorage.getItem(key);
          if (!cachedItem) return;
          
          const { data, expiry } = JSON.parse(cachedItem);
          
          if (Array.isArray(data)) {
            // Filter out the deleted allocation from the cached data
            const filteredData = data.filter(item => 
              item.ra_id !== allocationId && 
              item.id !== allocationId
            );
            
            // If we actually removed something, update the cache
            if (filteredData.length !== data.length) {
              console.log(`Removed allocation ${allocationId} from cache key: ${key}`);
              localStorage.setItem(key, JSON.stringify({
                data: filteredData,
                expiry: expiry
              }));
            }
          }
        } catch (e) {
          console.warn(`Error processing cache entry ${key}:`, e);
        }
      });
    } catch (error) {
      console.warn("Error cleaning allocation from cache:", error);
    }
  }

}

export default ProjectDataService;

