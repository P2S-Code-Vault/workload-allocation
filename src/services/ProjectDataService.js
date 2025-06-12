import API_CONFIG from './apiConfig';

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
    if (!email) {
      throw new Error("Email is required for fetching allocations");
    }
    // Use milestone projections batch endpoint
    const params = new URLSearchParams();
    params.append('email', email);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    // Always use the correct key
    const url = `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.MILESTONE_PROJECTIONS_BATCH}?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await this.handleErrorResponse(response);
      throw new Error(`Failed to fetch milestone projections: ${errorText}`);
    }
    const data = await response.json();
    // Normalize to array
    return Array.isArray(data) ? data : (data ? [data] : []);
  } catch (error) {
    console.error("Error fetching milestone projections:", error);
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

//TODO: Implement this method to fetch users in the same group
static async getUsersInSameGroup(email) {
  // Endpoint not implemented yet, return empty array for now
  console.warn('The /users/same-group endpoint is not yet implemented in the backend. Returning empty array.');
  return [];
}

  // Add this method for creating new milestone projections by quarter
static async saveResourceAllocationByQuarter(data) {
  try {
    if (!data.email || !data.project_number) {
      throw new Error("Missing required allocation data: email, project_number");
    }

    // First, get the milestone from the project number
    const milestone = await this.getMilestoneByProjectNumber(data.project_number);
    if (!milestone) {
      throw new Error(`Milestone not found for project number: ${data.project_number}`);
    }

    // Convert quarter to actual month numbers
    const months = this.getQuarterMonths(data.quarter);

    // Prepare request body matching backend MilestoneProjectionCreate schema
    const requestBody = {
      email: data.email,
      milestone_id: milestone.milestone_id,
      quarter: data.quarter,
      year: data.year,
      month: months[0],        // First month number of quarter
      month1: months[1],       // Second month number of quarter
      month2: months[2],       // Third month number of quarter
      month_hours: parseFloat(data.month) || 0,    // Hours for first month
      month_hours1: parseFloat(data.month1) || 0,  // Hours for second month
      month_hours2: parseFloat(data.month2) || 0,  // Hours for third month
      remarks: data.remarks || ""
    };

    // Add modified_by if allocating for someone else
    const currentUserDetails = JSON.parse(localStorage.getItem('userDetails'));
    if (currentUserDetails && currentUserDetails.email !== data.email) {
      requestBody.modified_by = currentUserDetails.contact_id;
    }

    const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.MILESTONE_PROJECTIONS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await this.handleErrorResponse(response);
      throw new Error(`Failed to save milestone projection: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving milestone projection by quarter:", error);
    throw error;
  }
}

// Add this method for updating existing milestone projections by quarter
static async updateMilestoneAllocationByQuarter(allocationId, month, month1, month2, remarks) {
  try {
    if (!allocationId) throw new Error("Allocation ID is required for updates");
    
    const payload = {
      month_hours: parseFloat(month) || 0,
      month_hours1: parseFloat(month1) || 0,
      month_hours2: parseFloat(month2) || 0,
      remarks: remarks || ""
    };
    
    const currentUserDetails = JSON.parse(localStorage.getItem('userDetails'));
    const allocatingForUser = localStorage.getItem('allocatingForUser');
    if (currentUserDetails && allocatingForUser && currentUserDetails.email !== allocatingForUser) {
      payload.modified_by = currentUserDetails.contact_id;
    }
    
    const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.MILESTONE_PROJECTION_BY_ID(allocationId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update milestone projection: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating milestone projection:", error);
    throw error;
  }
}

// Helper method to get milestone by project number
static async getMilestoneByProjectNumber(projectNumber) {
  try {
    const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.MILESTONES_PROJECT(projectNumber)}`);
    if (!response.ok) {
      const errorText = await this.handleErrorResponse(response);
      throw new Error(`Milestone not found: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error getting milestone by project number:", error);
    throw error;
  }
}

// Add this method for saving opportunity projections by quarter
static async saveOpportunityAllocationByQuarter(data) {
  try {
    if (!data.email || !data.opportunity_number) {
      throw new Error("Missing required opportunity data: email, opportunity_number");
    }

    // First, get the opportunity from the opportunity number
    const opportunity = await this.getOpportunityByNumber(data.opportunity_number);
    if (!opportunity) {
      throw new Error(`Opportunity not found for opportunity number: ${data.opportunity_number}`);
    }

    // Convert quarter to actual month numbers
    const months = this.getQuarterMonths(data.quarter);

    // Prepare request body matching backend OpportunityProjectionCreate schema
    const requestBody = {
      email: data.email,
      opportunity_id: opportunity.opportunity_id,
      quarter: data.quarter,
      year: data.year,
      month: months[0],        // First month number of quarter
      month1: months[1],       // Second month number of quarter
      month2: months[2],       // Third month number of quarter
      month_hours: parseFloat(data.month) || 0,    // Hours for first month
      month_hours1: parseFloat(data.month1) || 0,  // Hours for second month
      month_hours2: parseFloat(data.month2) || 0,  // Hours for third month
      remarks: data.remarks || ""
    };

    // Add modified_by if allocating for someone else
    const currentUserDetails = JSON.parse(localStorage.getItem('userDetails'));
    if (currentUserDetails && currentUserDetails.email !== data.email) {
      requestBody.modified_by = currentUserDetails.contact_id;
    }

    const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.OPPORTUNITY_PROJECTIONS}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await this.handleErrorResponse(response);
      throw new Error(`Failed to save opportunity projection: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving opportunity projection by quarter:", error);
    throw error;
  }
}
static async updateOpportunityAllocationByQuarter(allocationId, month, month1, month2, remarks) {
  try {
    if (!allocationId) throw new Error("Allocation ID is required for updates");
    
    const payload = {
      month_hours: parseFloat(month) || 0,
      month_hours1: parseFloat(month1) || 0,
      month_hours2: parseFloat(month2) || 0,
      remarks: remarks || ""
    };
    
    const currentUserDetails = JSON.parse(localStorage.getItem('userDetails'));
    const allocatingForUser = localStorage.getItem('allocatingForUser');
    if (currentUserDetails && allocatingForUser && currentUserDetails.email !== allocatingForUser) {
      payload.modified_by = currentUserDetails.contact_id;
    }
    
    const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.OPPORTUNITY_PROJECTION_BY_ID(allocationId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update milestone projection: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating milestone projection:", error);
    throw error;
  }
}

// Helper method to get opportunity by number
static async getOpportunityByNumber(opportunityNumber) {
  try {
    const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.OPPORTUNITY_BY_NUMBER(opportunityNumber)}`);
    if (!response.ok) {
      const errorText = await this.handleErrorResponse(response);
      throw new Error(`Opportunity not found: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error getting opportunity by number:", error);
    throw error;
  }
}

// Helper method to convert quarter to month numbers
static getQuarterMonths(quarter) {
  const quarterMonths = {
    'Q1': [1, 2, 3], '1': [1, 2, 3],
    'Q2': [4, 5, 6], '2': [4, 5, 6],
    'Q3': [7, 8, 9], '3': [7, 8, 9],
    'Q4': [10, 11, 12], '4': [10, 11, 12]
  };
  
  return quarterMonths[quarter] || quarterMonths['Q1'];
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
      keysToRemove.forEach(key => {
        console.log(`Removing cache key: ${key}`);
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn(`Error clearing cache with pattern ${pattern}:`, error);
    }
  }

  // static async deleteAllocation(allocationId) {
  //   try {
  //     if (!allocationId) {
  //       throw new Error("Allocation ID is required");
  //     }
      
  //     console.log(`Deleting allocation ${allocationId}`);
  //     const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.ALLOCATIONS}/${allocationId}`, {
  //       method: "DELETE"
  //     });
      
  //     if (!response.ok) {
  //       const errorText = await this.handleErrorResponse(response);
  //       throw new Error(`Failed to delete allocation: ${errorText}`);
  //     }
      
  //     // Remove specific cache entries that might contain this allocation
  //     this.removeAllocationFromCache(allocationId);
      
  //     return await response.json();
  //   } catch (error) {
  //     console.error("Error deleting allocation:", error);
  //     throw error;
  //   }
  // }
  
  // Delete milestone projection
static async deleteMilestoneAllocation(allocationId) {
  try {
    if (!allocationId) {
      throw new Error("Allocation ID is required");
    }
    
    console.log(`Deleting milestone allocation ${allocationId}`);
    
    const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.MILESTONE_PROJECTION_BY_ID(allocationId)}`, {
      method: "DELETE"
    });
    
    if (!response.ok) {
      const errorText = await this.handleErrorResponse(response);
      throw new Error(`Failed to delete milestone allocation: ${errorText}`);
    }
    
    // Remove from cache
    this.removeAllocationFromCache(allocationId);
    
    return await response.json();
  } catch (error) {
    console.error("Error deleting milestone allocation:", error);
    throw error;
  }
}

// Delete opportunity projection
static async deleteOpportunityAllocation(allocationId) {
  try {
    if (!allocationId) {
      throw new Error("Allocation ID is required");
    }
    
    console.log(`Deleting opportunity allocation ${allocationId}`);
    
    const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.OPPORTUNITY_PROJECTION_BY_ID(allocationId)}`, {
      method: "DELETE"
    });
    
    if (!response.ok) {
      const errorText = await this.handleErrorResponse(response);
      throw new Error(`Failed to delete opportunity allocation: ${errorText}`);
    }
    
    // Remove from cache
    this.removeAllocationFromCache(allocationId);
    
    return await response.json();
  } catch (error) {
    console.error("Error deleting opportunity allocation:", error);
    throw error;
  }
}

// Generic delete method that determines the type and calls the appropriate method
static async deleteAllocation(allocationId, type = 'milestone') {
  try {
    if (type === 'opportunity') {
      return await this.deleteOpportunityAllocation(allocationId);
    } else {
      return await this.deleteMilestoneAllocation(allocationId);
    }
  } catch (error) {
    console.error("Error in generic delete allocation:", error);
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

  // Add similar methods for opportunity projections
  static async getOpportunities(email, startDate, endDate) {
    try {
      if (!email) throw new Error("Email is required for fetching opportunities");
      const params = new URLSearchParams();
      params.append('email', email);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const url = `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.OPPORTUNITY_PROJECTIONS_BATCH}?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await this.handleErrorResponse(response);
        throw new Error(`Failed to fetch opportunity projections: ${errorText}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : (data ? [data] : []);
    } catch (error) {
      console.error("Error fetching opportunity projections:", error);
      throw error;
    }
  }
  static async saveOpportunityProjection(data) {
    try {
      if (!data.email || !data.opportunity_number) {
        throw new Error("Missing required opportunity data: email, opportunity_number");
      }
      const requestBody = {
        email: data.email,
        opportunity_number: data.opportunity_number,
        remarks: data.remarks || "",
        month: parseFloat(data.month) || 0,
        month1: parseFloat(data.month1) || 0,
        month2: parseFloat(data.month2) || 0
      };
      const currentUserDetails = JSON.parse(localStorage.getItem('userDetails'));
      if (currentUserDetails && currentUserDetails.email !== data.email) {
        requestBody.modified_by = currentUserDetails.contact_id;
      }
      const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.OPPORTUNITY_PROJECTIONS}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        const errorText = await this.handleErrorResponse(response);
        throw new Error(`Failed to save opportunity projection: ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error saving opportunity projection:", error);
      throw error;
    }
  }
  static async updateOpportunityProjection(opportunityId, month, month1, month2, remarks) {
    try {
      if (!opportunityId) throw new Error("Opportunity ID is required for updates");
      const payload = {
        month: parseFloat(month) || 0,
        month1: parseFloat(month1) || 0,
        month2: parseFloat(month2) || 0,
        remarks: remarks || ""
      };
      const currentUserDetails = JSON.parse(localStorage.getItem('userDetails'));
      const allocatingForUser = localStorage.getItem('allocatingForUser');
      if (currentUserDetails && allocatingForUser && currentUserDetails.email !== allocatingForUser) {
        payload.modified_by = currentUserDetails.contact_id;
      }
      const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.OPPORTUNITY_PROJECTION_BY_ID(opportunityId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update opportunity projection: ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error updating opportunity projection:", error);
      throw error;
    }
  }

  /**
   * Batch update milestone projections
   * @param {Array} updates - Array of objects with { ra_id, month_hours, month_hours1, month_hours2, remarks, modified_by }
   * @returns {Promise<Object>} BatchUpdateResponse
   */
  static async batchUpdateMilestoneProjections(updates) {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error("No updates provided for batch milestone projection update");
    }
    const url = `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.MILESTONE_PROJECTIONS_BATCH}`;
    const body = { allocations: updates };
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorText = await this.handleErrorResponse(response);
      throw new Error(`Batch milestone projection update failed: ${errorText}`);
    }
    return await response.json();
  }

  /**
   * Batch update opportunity projections
   * @param {Array} updates - Array of objects with { ra_id, month_hours, month_hours1, month_hours2, remarks, modified_by }
   * @returns {Promise<Object>} BatchUpdateResponse
   */
  static async batchUpdateOpportunityProjections(updates) {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error("No updates provided for batch opportunity projection update");
    }
    const url = `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.OPPORTUNITY_PROJECTIONS_BATCH}`;
    const body = { allocations: updates };
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorText = await this.handleErrorResponse(response);
      throw new Error(`Batch opportunity projection update failed: ${errorText}`);
    }
    return await response.json();
  }

   static async getAllocationsByQuarter(email, year, quarter) {
  if (!email || !year || !quarter) {
    throw new Error("Missing required parameters for getAllocationsByQuarter");
  }
  
  console.log("=== getAllocationsByQuarter DEBUG ===");
  console.log("Input params:", { email, year, quarter });
  
  // Step 1: Get contact_id for the email
  const contactId = await this.getContactIdByEmail(email);
  console.log("Found contact_id:", contactId);
  
  if (!contactId) {
    throw new Error(`No contact_id found for email: ${email}`);
  }
  
  // Step 2: Fetch milestone projections for contact_id
  const params = new URLSearchParams();
  params.append('year', year);
  params.append('quarter', quarter);
  const url = `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.CONTACT_MILESTONE_PROJECTIONS(contactId)}?${params.toString()}`;
  
  console.log("Making API call to URL:", url);
  console.log("Full URL breakdown:");
  console.log("- Base URL:", this.apiBaseUrl);
  console.log("- Endpoint function result:", API_CONFIG.ENDPOINTS.CONTACT_MILESTONE_PROJECTIONS(contactId));
  console.log("- Params:", params.toString());
  
  const response = await fetch(url);
  console.log("Response status:", response.status);
  console.log("Response OK:", response.ok);
  
  if (!response.ok) {
    const errorText = await this.handleErrorResponse(response);
    console.error("API Error:", errorText);
    throw new Error(`Failed to fetch milestone projections: ${errorText}`);
  }
  
  const data = await response.json();
  console.log("Raw API response:", data);
  console.log("=== END getAllocationsByQuarter DEBUG ===");
  
  return Array.isArray(data) ? data : (data ? [data] : []);
}

  static async getAllocationsByQuarterWithDetails(email, year, quarter) {
    if (!email || !year || !quarter) {
      throw new Error("Missing required parameters for getAllocationsByQuarterWithDetails");
    }
    
    console.log("=== getAllocationsByQuarterWithDetails DEBUG ===");
    console.log("Input params:", { email, year, quarter });
    
    // Step 1: Get basic allocations data
    const allocations = await this.getAllocationsByQuarter(email, year, quarter);
    console.log("Basic allocations fetched:", allocations.length);
    
    if (!allocations || allocations.length === 0) {
      console.log("No allocations found, returning empty array");
      return [];
    }
    
    // Step 2: Extract unique milestone IDs
    const milestoneIds = new Set();
    allocations.forEach(allocation => {
      if (allocation.milestone_id) {
        milestoneIds.add(allocation.milestone_id);
      }
    });
    
    console.log("Found unique milestone IDs:", Array.from(milestoneIds));
    
    // Step 3: Fetch detailed milestone information
    const milestoneDetailsPromises = Array.from(milestoneIds).map(async (milestoneId) => {
      try {
        const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.MILESTONE_BY_ID(milestoneId)}`);
        if (!response.ok) {
          console.warn(`Failed to fetch milestone details for ID ${milestoneId}`);
          return { id: milestoneId, details: null };
        }
        const details = await response.json();
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
    
    console.log("Milestone details fetched for IDs:", Array.from(milestoneDetailsMap.keys()));
    
    // Step 4: Enhance allocations with milestone details
    const enhancedAllocations = allocations.map(allocation => {
      const milestoneDetails = milestoneDetailsMap.get(allocation.milestone_id);
      if (milestoneDetails) {
        console.log(`Enhancing allocation for milestone ${allocation.milestone_id} with details:`, milestoneDetails);
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
          // Keep original fields for backward compatibility
          proj_id: milestoneDetails.project_number,
        };
      }
      return allocation;
    });
    
    console.log("Enhanced allocations with milestone details:", enhancedAllocations.length);
    console.log("=== END getAllocationsByQuarterWithDetails DEBUG ===");
    
    return enhancedAllocations;
  }

  static async getOpportunitiesByQuarter(email, year, quarter) {
  if (!email || !year || !quarter) {
    throw new Error("Missing required parameters for getOpportunitiesByQuarter");
  }
  
  console.log("=== getOpportunitiesByQuarter DEBUG ===");
  console.log("Input params:", { email, year, quarter });
  
  // Step 1: Get contact_id for the email
  const contactId = await this.getContactIdByEmail(email);
  console.log("Found contact_id:", contactId);
  
  if (!contactId) {
    throw new Error(`No contact_id found for email: ${email}`);
  }
  
  // Step 2: Fetch opportunity projections for contact_id
  const params = new URLSearchParams();
  params.append('year', year);
  params.append('quarter', quarter);
  const url = `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.CONTACT_OPPORTUNITY_PROJECTIONS(contactId)}?${params.toString()}`;
  
  console.log("Making API call to URL:", url);
  console.log("Full URL breakdown:");
  console.log("- Base URL:", this.apiBaseUrl);
  console.log("- Endpoint function result:", API_CONFIG.ENDPOINTS.CONTACT_OPPORTUNITY_PROJECTIONS(contactId));
  console.log("- Params:", params.toString());
  
  const response = await fetch(url);
  console.log("Response status:", response.status);
  console.log("Response OK:", response.ok);
  
  if (!response.ok) {
    const errorText = await this.handleErrorResponse(response);
    console.error("API Error:", errorText);
    throw new Error(`Failed to fetch opportunity projections: ${errorText}`);
  }
  
  const data = await response.json();
  console.log("Raw API response:", data);
  console.log("=== END getOpportunitiesByQuarter DEBUG ===");
  
  return Array.isArray(data) ? data : (data ? [data] : []);
}

  // Helper: Get contact_id for a given email
  static async getContactIdByEmail(email) {
    if (!email) return null;
    // Try /contacts/email/{email} endpoint
    const emailUrl = `${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.CONTACTS}/email/${encodeURIComponent(email)}`;
    try {
      const response = await fetch(emailUrl);
      if (!response.ok) return null;
      const data = await response.json();
      return data.contact_id || null;
    } catch (e) {
      return null;
    }
  }
}

export default ProjectDataService;

