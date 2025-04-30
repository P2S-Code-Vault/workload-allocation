import API_CONFIG from './apiConfig';

export class UserService {
  static apiBaseUrl = API_CONFIG.BASE_URL;

  // Login user and store info in localStorage with enhanced group/studio data
  static async login(email) {
    try {
      console.log(`Attempting to login with email: ${email}`);
      
      const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.LOGIN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Login failed: ${response.status} ${response.statusText}`);
      }

      const userData = await response.json();
      console.log("Login successful, user data:", userData);
      
      // Clear any previous login data
      this.logout();
      
      // Set new user data with standard fields - preserve exact values from server
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', userData.name || '');
      localStorage.setItem('userContactId', userData.contact_id || '');
      
      // Store the actual scheduled hours from database, not defaulting
      localStorage.setItem('userScheduledHours', 
        userData.scheduled_hours !== null && userData.scheduled_hours !== undefined 
          ? userData.scheduled_hours 
          : 40);
      
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('loginTimestamp', Date.now().toString());
      
      // Store the group manager status
      localStorage.setItem('isGroupManager', String(userData.is_group_manager || false));
      
      // Store enhanced group/studio information without defaulting
      localStorage.setItem('userGroupName', userData.GroupName || '');
      localStorage.setItem('userGroupManager', userData.group_manager || '');
      localStorage.setItem('userGroupNo', userData.GroupNo !== null ? String(userData.GroupNo) : '');
      localStorage.setItem('userStudioNo', userData.StudioNo !== null ? String(userData.StudioNo) : '');
      localStorage.setItem('userStudioIdentifier', userData.studio_identifier || '');
      
      // Store the complete user details object for easy access
      const userDetailsObj = {
        email,
        name: userData.name || '',
        contact_id: userData.contact_id || '',
        scheduledHours: userData.scheduled_hours !== null && userData.scheduled_hours !== undefined 
          ? userData.scheduled_hours 
          : 40,
        isGroupManager: userData.is_group_manager || false,
        GroupName: userData.GroupName || '',
        groupManager: userData.group_manager || '',
        GroupNo: userData.GroupNo !== null ? userData.GroupNo : '',
        StudioNo: userData.StudioNo !== null ? userData.StudioNo : '',
        studioIdentifier: userData.studio_identifier || ''
      };
      
      localStorage.setItem('userDetails', JSON.stringify(userDetailsObj));
      
      // Debug log to verify data being stored
      console.log("Stored user details in localStorage:", userDetailsObj);
      
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  // Get current logged in user email
  static getCurrentUser() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      return null;
    }
    
    // Check if session has expired (8 hours)
    const loginTimestamp = parseInt(localStorage.getItem('loginTimestamp') || '0', 10);
    const currentTime = Date.now();
    const eightHoursInMs = 8 * 60 * 60 * 1000;
    
    if (currentTime - loginTimestamp > eightHoursInMs) {
      console.log("User session has expired");
      this.logout();
      return null;
    }
    
    const email = localStorage.getItem('userEmail');
    console.log("Getting current user:", email);
    return email || null;
  }

  // Get full user details from localStorage including enhanced studio info
  static getCurrentUserDetails() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      return null;
    }
    
    // Check session expiration
    const loginTimestamp = parseInt(localStorage.getItem('loginTimestamp') || '0', 10);
    const currentTime = Date.now();
    const eightHoursInMs = 8 * 60 * 60 * 1000;
    
    if (currentTime - loginTimestamp > eightHoursInMs) {
      console.log("User session has expired");
      this.logout();
      return null;
    }

    // Try to get the complete user details object first
    const userDetailsStr = localStorage.getItem('userDetails');
    if (userDetailsStr) {
      try {
        const userDetails = JSON.parse(userDetailsStr);
        console.log("Retrieved user details from localStorage:", userDetails);
        return userDetails;
      } catch (e) {
        console.warn("Failed to parse user details from localStorage, falling back to individual properties");
      }
    }
    
    // Fallback to individual properties if the complete object isn't available
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');
    const contact_id = localStorage.getItem('userContactId');
    
    // Get actual scheduled hours, safely parse to number
    const scheduledHoursStr = localStorage.getItem('userScheduledHours');
    let scheduledHours = 40;  // Default if parsing fails
    
    if (scheduledHoursStr !== null && scheduledHoursStr !== '') {
      try {
        scheduledHours = parseFloat(scheduledHoursStr);
        console.log(`Parsed scheduledHours to number: ${scheduledHours}`);
      } catch (e) {
        console.warn(`Failed to parse scheduledHours "${scheduledHoursStr}" to number, using default 40`);
      }
    } else {
      console.log("No scheduledHours value found, using default 40");
    }
    
    const isGroupManager = localStorage.getItem('isGroupManager') === 'true';
    const GroupName = localStorage.getItem('userGroupName') || '';
    const groupManager = localStorage.getItem('userGroupManager') || '';
    const GroupNo = localStorage.getItem('userGroupNo') || '';
    const StudioNo = localStorage.getItem('userStudioNo') || '';
    const studioIdentifier = localStorage.getItem('userStudioIdentifier') || '';

    if (!email) {
      console.log("No user details found in localStorage");
      return null;
    }
    
    const userDetails = {
      email,
      name,
      contact_id,
      scheduledHours,
      isGroupManager,
      GroupName,
      groupManager,
      GroupNo,
      StudioNo,
      studioIdentifier
    };
    
    console.log("Getting user details:", userDetails);
    return userDetails;
  }
 
  // Updated logout to clear all user data
  static logout() {
    console.log("Logging out user");
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userContactId');
    localStorage.removeItem('userScheduledHours');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loginTimestamp');
    localStorage.removeItem('isGroupManager');
    localStorage.removeItem('userGroupName');
    localStorage.removeItem('userGroupManager');
    localStorage.removeItem('userGroupNo');
    localStorage.removeItem('userStudioNo');
    localStorage.removeItem('userStudioIdentifier');
    localStorage.removeItem('userDetails'); // Also remove the complete user details object
  }

  // Refresh login to update session timer
  static refreshLogin() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      localStorage.setItem('loginTimestamp', Date.now().toString());
      return true;
    }
    return false;
  }
}

export default UserService;

