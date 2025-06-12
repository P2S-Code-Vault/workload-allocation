import API_CONFIG from './apiConfig';

export class ScheduledHoursService {
  static cache = {};
  static cacheExpiration = 5 * 60 * 1000; // 5 minutes

  /**
   * Get monthly scheduled hours for a contact by ID
   * @param {number} contactId - Contact ID
   * @param {number} year - Year (e.g., 2025)
   * @param {number} month - Month (1-12)
   * @returns {Promise<Object>} Monthly scheduled hours data
   */
  static async getMonthlyScheduledHours(contactId, year, month) {
    const cacheKey = `monthly_${contactId}_${year}_${month}`;
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[ScheduledHoursService] Cache hit for monthly ${contactId}`);
      return cachedData;
    }

    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTACT_MONTHLY_SCHEDULED_HOURS(contactId)}?year=${year}&month=${month}`;
      console.log(`[ScheduledHoursService] Fetching monthly scheduled hours: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[ScheduledHoursService] Monthly data received for contact ${contactId}:`, data);
      
      this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`[ScheduledHoursService] Error fetching monthly scheduled hours for contact ${contactId}:`, error);
      throw error;
    }
  }

  /**
   * Get quarterly scheduled hours for a contact by ID
   * @param {number} contactId - Contact ID
   * @param {number} year - Year (e.g., 2025)
   * @param {string} quarter - Quarter (Q1, Q2, Q3, Q4)
   * @returns {Promise<Object>} Quarterly scheduled hours data
   */
  static async getQuarterlyScheduledHours(contactId, year, quarter) {
    const cacheKey = `quarterly_${contactId}_${year}_${quarter}`;
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[ScheduledHoursService] Cache hit for quarterly ${contactId}`);
      return cachedData;
    }

    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTACT_QUARTERLY_SCHEDULED_HOURS(contactId)}?year=${year}&quarter=${quarter}`;
      console.log(`[ScheduledHoursService] Fetching quarterly scheduled hours: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[ScheduledHoursService] Quarterly data received for contact ${contactId}:`, data);
      
      this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`[ScheduledHoursService] Error fetching quarterly scheduled hours for contact ${contactId}:`, error);
      throw error;
    }
  }

  /**
   * Get monthly scheduled hours by email
   * @param {string} email - Contact email
   * @param {number} year - Year (e.g., 2025)
   * @param {number} month - Month (1-12)
   * @returns {Promise<Object>} Monthly scheduled hours data
   */
  static async getMonthlyScheduledHoursByEmail(email, year, month) {
    const cacheKey = `monthly_email_${email}_${year}_${month}`;
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[ScheduledHoursService] Cache hit for monthly email ${email}`);
      return cachedData;
    }

    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTACT_MONTHLY_SCHEDULED_HOURS_BY_EMAIL(email)}?year=${year}&month=${month}`;
      console.log(`[ScheduledHoursService] Fetching monthly scheduled hours by email: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[ScheduledHoursService] Monthly data received for email ${email}:`, data);
      
      this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`[ScheduledHoursService] Error fetching monthly scheduled hours for email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Get quarterly scheduled hours by email
   * @param {string} email - Contact email
   * @param {number} year - Year (e.g., 2025)
   * @param {string} quarter - Quarter (Q1, Q2, Q3, Q4)
   * @returns {Promise<Object>} Quarterly scheduled hours data
   */
  static async getQuarterlyScheduledHoursByEmail(email, year, quarter) {
    const cacheKey = `quarterly_email_${email}_${year}_${quarter}`;
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[ScheduledHoursService] Cache hit for quarterly email ${email}`);
      return cachedData;
    }

    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTACT_QUARTERLY_SCHEDULED_HOURS_BY_EMAIL(email)}?year=${year}&quarter=${quarter}`;
      console.log(`[ScheduledHoursService] Fetching quarterly scheduled hours by email: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`[ScheduledHoursService] Quarterly data received for email ${email}:`, data);
      
      this.saveToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`[ScheduledHoursService] Error fetching quarterly scheduled hours for email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Batch fetch scheduled hours for multiple team members
   * @param {Array} members - Array of team member objects with contact_id or email
   * @param {number} year - Year (e.g., 2025)
   * @param {number|null} month - Month number (1-12) for monthly data, null for quarterly
   * @param {string|null} quarter - Quarter (Q1, Q2, Q3, Q4) for quarterly data, null for monthly
   * @returns {Promise<Object>} Object mapping member keys to their scheduled hours
   */
  static async batchFetchScheduledHours(members, year, month = null, quarter = null) {
    console.log(`[ScheduledHoursService] Batch fetching scheduled hours for ${members.length} members`);
    console.log(`[ScheduledHoursService] Parameters: year=${year}, month=${month}, quarter=${quarter}`);
    
    if (!month && !quarter) {
      throw new Error('Either month or quarter must be specified');
    }

    if (month && quarter) {
      throw new Error('Cannot specify both month and quarter');
    }

    const promises = members.map(async (member) => {
      try {
        let scheduledHoursData;
        const memberKey = member.contact_id || member.contactId || member.id || member.email;
        
        if (month !== null) {
          // Fetch monthly data
          if (member.contact_id || member.contactId || member.id) {
            const contactId = member.contact_id || member.contactId || member.id;
            scheduledHoursData = await this.getMonthlyScheduledHours(contactId, year, month);
          } else if (member.email) {
            scheduledHoursData = await this.getMonthlyScheduledHoursByEmail(member.email, year, month);
          }
        } else if (quarter !== null) {
          // Fetch quarterly data
          if (member.contact_id || member.contactId || member.id) {
            const contactId = member.contact_id || member.contactId || member.id;
            scheduledHoursData = await this.getQuarterlyScheduledHours(contactId, year, quarter);
          } else if (member.email) {
            scheduledHoursData = await this.getQuarterlyScheduledHoursByEmail(member.email, year, quarter);
          }
        }
        
        return {
          memberKey,
          member,
          scheduledHoursData,
          success: true
        };
      } catch (error) {
        console.warn(`[ScheduledHoursService] Failed to fetch scheduled hours for member ${member.name || member.email}:`, error);
        return {
          memberKey: member.contact_id || member.contactId || member.id || member.email,
          member,
          scheduledHoursData: null,
          error: error.message,
          success: false
        };
      }
    });

    const results = await Promise.all(promises);
    
    // Convert results array to object mapping
    const scheduledHoursMap = {};
    results.forEach(({ memberKey, member, scheduledHoursData, error, success }) => {
      scheduledHoursMap[memberKey] = {
        member,
        scheduledHoursData,
        error,
        success
      };
    });

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    console.log(`[ScheduledHoursService] Batch fetch completed. Success: ${successCount}, Errors: ${errorCount}`);
    
    if (errorCount > 0) {
      console.warn(`[ScheduledHoursService] ${errorCount} requests failed out of ${members.length} total`);
    }
    
    return scheduledHoursMap;
  }

  /**
   * Calculate the current month number for the selected month index and quarter
   * @param {number} selectedMonthIndex - 0-based index (0 = first month of quarter)
   * @param {string} quarter - Quarter (Q1, Q2, Q3, Q4)
   * @returns {number} Month number (1-12)
   */
  static getMonthNumberFromQuarterIndex(selectedMonthIndex, quarter) {
    const quarterMonths = {
      'Q1': [1, 2, 3],
      'Q2': [4, 5, 6], 
      'Q3': [7, 8, 9],
      'Q4': [10, 11, 12]
    };
    
    const months = quarterMonths[quarter] || [1, 2, 3];
    const monthNumber = months[selectedMonthIndex] || months[0];
    
    console.log(`[ScheduledHoursService] Month calculation: selectedMonthIndex=${selectedMonthIndex}, quarter=${quarter}, result=${monthNumber}`);
    return monthNumber;
  }

  /**
   * Extract scheduled hours value from API response
   * @param {Object} scheduledHoursData - Response from scheduled hours API
   * @param {number} defaultValue - Default value if data is not available
   * @returns {number} Scheduled hours value
   */
  static extractScheduledHours(scheduledHoursData, defaultValue = 40.0) {
    if (!scheduledHoursData) {
      return defaultValue;
    }

    // For monthly data - updated to match backend response structure
    if (scheduledHoursData.scheduled_hours !== undefined) {
      return parseFloat(scheduledHoursData.scheduled_hours) || defaultValue;
    }

    // For quarterly data - updated to match backend response structure
    if (scheduledHoursData.total_scheduled_hours !== undefined) {
      return parseFloat(scheduledHoursData.total_scheduled_hours) || defaultValue;
    }

    // Fallback for other possible structures
    if (scheduledHoursData.hours_per_week !== undefined) {
      // If we have weekly hours, calculate monthly (assuming ~4.33 weeks per month)
      return parseFloat(scheduledHoursData.hours_per_week) * 4.33 || defaultValue;
    }

    // Final fallback
    return defaultValue;
  }


/**
 * Batch fetch quarterly scheduled hours for multiple team members (OPTIMIZED VERSION)
 * This fetches quarterly data once and caches it for all month selections
 * @param {Array} members - Array of team member objects with contact_id or email
 * @param {number} year - Year (e.g., 2025)
 * @param {string} quarter - Quarter (Q1, Q2, Q3, Q4)
 * @returns {Promise<Object>} Object mapping member keys to their quarterly scheduled hours
 */
// static async batchFetchQuarterlyScheduledHours(members, year, quarter) {
//   console.log(`[ScheduledHoursService] Batch fetching QUARTERLY scheduled hours for ${members.length} members`);
//   console.log(`[ScheduledHoursService] Parameters: year=${year}, quarter=${quarter}`);
  
//   const promises = members.map(async (member) => {
//     try {
//       let scheduledHoursData;
//       const memberKey = member.contact_id || member.contactId || member.id || member.email;
      
//       if (member.contact_id || member.contactId || member.id) {
//         const contactId = member.contact_id || member.contactId || member.id;
//         scheduledHoursData = await this.getQuarterlyScheduledHours(contactId, year, quarter);
//       } else if (member.email) {
//         scheduledHoursData = await this.getQuarterlyScheduledHoursByEmail(member.email, year, quarter);
//       }
      
//       return {
//         memberKey,
//         member,
//         quarterlyScheduledHoursData: scheduledHoursData,
//         success: true
//       };
//     } catch (error) {
//       console.warn(`[ScheduledHoursService] Failed to fetch quarterly scheduled hours for member ${member.name || member.email}:`, error);
//       return {
//         memberKey: member.contact_id || member.contactId || member.id || member.email,
//         member,
//         quarterlyScheduledHoursData: null,
//         error: error.message,
//         success: false
//       };
//     }
//   });

//   const results = await Promise.all(promises);
  
//   // Convert results array to object mapping
//   const scheduledHoursMap = {};
//   results.forEach(({ memberKey, member, quarterlyScheduledHoursData, error, success }) => {
//     scheduledHoursMap[memberKey] = {
//       member,
//       quarterlyScheduledHoursData,
//       error,
//       success
//     };
//   });

//   const successCount = results.filter(r => r.success).length;
//   const errorCount = results.filter(r => !r.success).length;
  
//   console.log(`[ScheduledHoursService] Quarterly batch fetch completed. Success: ${successCount}, Errors: ${errorCount}`);
  
//   return scheduledHoursMap;
// }
/**
 * Batch fetch quarterly scheduled hours for multiple team members (OPTIMIZED VERSION)
 * This fetches quarterly data once and caches it for all month selections
 * @param {Array} members - Array of team member objects with contact_id or email
 * @param {number} year - Year (e.g., 2025)
 * @param {string} quarter - Quarter (Q1, Q2, Q3, Q4)
 * @returns {Promise<Object>} Object mapping member keys to their quarterly scheduled hours
 */
static async batchFetchQuarterlyScheduledHours(members, year, quarter) {
  console.log(`[ScheduledHoursService] Batch fetching QUARTERLY scheduled hours for ${members.length} members`);
  console.log(`[ScheduledHoursService] Parameters: year=${year}, quarter=${quarter}`);
  
  const promises = members.map(async (member) => {
    try {
      let scheduledHoursData;
      // Get all possible member keys
      const memberKeys = [
        member.contact_id,
        member.contactId, 
        member.id,
        member.email
      ].filter(Boolean); // Remove null/undefined values
      
      if (member.contact_id || member.contactId || member.id) {
        const contactId = member.contact_id || member.contactId || member.id;
        scheduledHoursData = await this.getQuarterlyScheduledHours(contactId, year, quarter);
      } else if (member.email) {
        scheduledHoursData = await this.getQuarterlyScheduledHoursByEmail(member.email, year, quarter);
      }
      
      // FIXED: Store data under ALL possible keys for this member
      const results = {};
      memberKeys.forEach(key => {
        results[key] = {
          member,
          quarterlyScheduledHoursData: scheduledHoursData,
          success: true
        };
      });
      
      return results;
      
    } catch (error) {
      console.warn(`[ScheduledHoursService] Failed to fetch quarterly scheduled hours for member ${member.name || member.email}:`, error);
      
      // FIXED: Store error under ALL possible keys for this member
      const memberKeys = [
        member.contact_id,
        member.contactId, 
        member.id,
        member.email
      ].filter(Boolean);
      
      const results = {};
      memberKeys.forEach(key => {
        results[key] = {
          member,
          quarterlyScheduledHoursData: null,
          error: error.message,
          success: false
        };
      });
      
      return results;
    }
  });

  const resultsArray = await Promise.all(promises);
  
  // FIXED: Flatten the results into a single map
  const scheduledHoursMap = {};
  resultsArray.forEach(memberResults => {
    Object.assign(scheduledHoursMap, memberResults);
  });

  const successCount = Object.values(scheduledHoursMap).filter(r => r.success).length;
  const errorCount = Object.values(scheduledHoursMap).filter(r => !r.success).length;
  
  console.log(`[ScheduledHoursService] Quarterly batch fetch completed. Total entries: ${Object.keys(scheduledHoursMap).length}`);
  console.log(`[ScheduledHoursService] Sample keys:`, Object.keys(scheduledHoursMap).slice(0, 5));
  
  return scheduledHoursMap;
}

/**
 * Extract monthly scheduled hours from quarterly data
 * @param {Object} quarterlyData - Quarterly scheduled hours data
 * @param {number} monthIndex - 0-based month index within the quarter (0, 1, 2)
 * @param {number} defaultValue - Default value if data is not available
 * @returns {number} Scheduled hours for the specific month
 */
static extractMonthlyFromQuarterly(quarterlyData, monthIndex = 0, defaultValue = 40.0) {
  console.log(`[ScheduledHoursService] Extracting monthly data for monthIndex ${monthIndex}:`, quarterlyData);
  
  if (!quarterlyData) {
    console.log(`[ScheduledHoursService] No quarterly data available, using default: ${defaultValue}`);
    return defaultValue;
  }

  // Check for the backend structure: quarterlyData has month1, month2, month3 properties
  const monthKey = `month${monthIndex + 1}`;
  console.log(`[ScheduledHoursService] Looking for monthKey: ${monthKey}`);
  
  // Backend structure: { month1: { month_number: 4, working_days: 22, scheduled_hours: 176.0 }, ... }
  if (quarterlyData[monthKey] && quarterlyData[monthKey].scheduled_hours !== undefined) {
    const monthlyHours = parseFloat(quarterlyData[monthKey].scheduled_hours) || defaultValue;
    console.log(`[ScheduledHoursService] Found monthly hours in ${monthKey}: ${monthlyHours}`);
    return monthlyHours;
  }

  // Alternative structure: check if data is directly available
  if (quarterlyData.scheduled_hours !== undefined) {
    const hours = parseFloat(quarterlyData.scheduled_hours) || defaultValue;
    console.log(`[ScheduledHoursService] Found direct scheduled_hours: ${hours}`);
    return hours;
  }

  // Fallback: if we have total_scheduled_hours, divide by 3 (rough approximation)
  if (quarterlyData.total_scheduled_hours !== undefined) {
    const approximateHours = parseFloat(quarterlyData.total_scheduled_hours) / 3 || defaultValue;
    console.log(`[ScheduledHoursService] Using total_scheduled_hours divided by 3: ${approximateHours}`);
    return approximateHours;
  }

  console.log(`[ScheduledHoursService] No matching structure found, using default: ${defaultValue}`);
  console.log(`[ScheduledHoursService] Available keys in quarterlyData:`, Object.keys(quarterlyData));
  return defaultValue;
}


/**
 * Optimized function to get scheduled hours for a member using quarterly cache
 * @param {Object} member - Member object
 * @param {Object} quarterlyScheduledHoursData - Quarterly data cache
 * @param {number} monthIndex - 0-based month index (0, 1, 2)
 * @param {number} defaultValue - Default value
 * @returns {number} Scheduled hours for the specific month
 */
static getScheduledHoursForMemberOptimized(member, quarterlyScheduledHoursData, monthIndex = 0, defaultValue = 40.0) {
  const memberKey = member.contact_id || member.contactId || member.id || member.email;
  const memberQuarterlyData = quarterlyScheduledHoursData[memberKey];
  
  // DEBUG: Log what we're working with
  console.log(`[DEBUG] Processing member: ${member.name || memberKey}`);
  console.log(`[DEBUG] Member key: ${memberKey}`);
  console.log(`[DEBUG] Has quarterly data:`, !!memberQuarterlyData);
  
  if (memberQuarterlyData) {
    console.log(`[DEBUG] Quarterly data success:`, memberQuarterlyData.success);
    console.log(`[DEBUG] Quarterly data structure:`, memberQuarterlyData.quarterlyScheduledHoursData);
  }
  
  if (memberQuarterlyData && memberQuarterlyData.success && memberQuarterlyData.quarterlyScheduledHoursData) {
    const monthlyHours = this.extractMonthlyFromQuarterly(
      memberQuarterlyData.quarterlyScheduledHoursData, 
      monthIndex, 
      defaultValue
    );
    console.log(`[ScheduledHoursService] Using quarterly API scheduled hours for ${member.name || memberKey}, month ${monthIndex + 1}: ${monthlyHours}`);
    return monthlyHours;
  }
  
  // Fallback to member data if available
  if (member.scheduled_hours !== null && member.scheduled_hours !== undefined) {
    const memberHours = parseFloat(member.scheduled_hours);
    if (!isNaN(memberHours)) {
      console.log(`[ScheduledHoursService] Using fallback scheduled hours for ${member.name || memberKey}: ${memberHours}`);
      return memberHours;
    }
  }
  
  console.log(`[ScheduledHoursService] Using default scheduled hours for ${member.name || memberKey}: ${defaultValue}`);
  return defaultValue;
}

  // ===== Cache Management Methods =====

  /**
   * Save data to cache with timestamp
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   */
  static saveToCache(key, data) {
    this.cache[key] = {
      data,
      timestamp: Date.now()
    };
    console.log(`[ScheduledHoursService] Cached data for key: ${key}`);
  }
  
  /**
   * Get data from cache if still valid
   * @param {string} key - Cache key
   * @returns {*|null} Cached data or null if expired/not found
   */
  static getFromCache(key) {
    const cached = this.cache[key];
    if (!cached) return null;
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.cacheExpiration) {
      delete this.cache[key];
      console.log(`[ScheduledHoursService] Cache expired for key: ${key}`);
      return null;
    }
    
    return cached.data;
  }
  
  /**
   * Clear all cached data
   */
  static clearCache() {
    const keyCount = Object.keys(this.cache).length;
    this.cache = {};
    console.log(`[ScheduledHoursService] Cleared ${keyCount} cached entries`);
  }

  /**
   * Clear cached data matching a pattern
   * @param {string} pattern - Pattern to match in cache keys
   */
  static clearCacheWithPattern(pattern) {
    const keysToDelete = Object.keys(this.cache).filter(key => key.includes(pattern));
    keysToDelete.forEach(key => delete this.cache[key]);
    console.log(`[ScheduledHoursService] Cleared ${keysToDelete.length} cached entries matching pattern: ${pattern}`);
  }

  /**
   * Get cache statistics for debugging
   * @returns {Object} Cache statistics
   */
  static getCacheStats() {
    const totalEntries = Object.keys(this.cache).length;
    const now = Date.now();
    const validEntries = Object.values(this.cache).filter(
      entry => (now - entry.timestamp) <= this.cacheExpiration
    ).length;
    
    return {
      totalEntries,
      validEntries,
      expiredEntries: totalEntries - validEntries,
      cacheHitRate: this.cacheHitCount / (this.cacheHitCount + this.cacheMissCount) || 0
    };
  }
}