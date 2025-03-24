// services/AllStaffService.js
import API_CONFIG from './apiConfig';
import { format } from 'date-fns';

export class AllStaffService {
  static cache = {};
  static cacheExpiration = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  /**
   * Get data for all staff members across the company
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} - All staff data
   */
  static async getAllStaffData(startDate, endDate) {
    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      // Check cache first
      const cacheKey = `allStaff_${formattedStartDate}_${formattedEndDate}`;
      const cachedData = this.getFromCache(cacheKey);
      
      if (cachedData) {
        console.log("Using cached all staff data");
        return cachedData;
      }
      
      console.log(`Fetching all staff data for date range: ${formattedStartDate} to ${formattedEndDate}`);
      
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GL_ALL_STAFF}?start_date=${formattedStartDate}&end_date=${formattedEndDate}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch all staff data: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the data
      this.saveToCache(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error("Error fetching all staff data:", error);
      throw error;
    }
  }
  
  // Fallback method to get all staff data when the main endpoint is not available
  // This will use the existing groupby data and use it for the All Staff view
  static getAllCompanyData(teamData) {
    // Start with an empty result
    const companyData = {};
    
    // Iterate through each group manager in the team data
    Object.entries(teamData).forEach(([manager, managerData]) => {
      companyData[manager] = { ...managerData };
    });
    
    return companyData;
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