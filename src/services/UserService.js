import API_CONFIG from './apiConfig';

export class UserService {
  static apiBaseUrl = API_CONFIG.BASE_URL;

  // Login user and store info in localStorage
  // static async login(email) {
  //   try {
  //     console.log(`Attempting to login with email: ${email}`);
      
  //     const response = await fetch(`${this.apiBaseUrl}${API_CONFIG.ENDPOINTS.LOGIN}`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ email })
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json().catch(() => ({}));
  //       throw new Error(errorData.detail || `Login failed: ${response.status} ${response.statusText}`);
  //     }

  //     const userData = await response.json();
  //     console.log("Login successful, user data:", userData);
      
  //     // Clear any previous login data
  //     this.logout();
      
  //     // Set new user data
  //     localStorage.setItem('userEmail', email);
  //     localStorage.setItem('userName', userData.name);
  //     localStorage.setItem('userContactId', userData.contact_id);
  //     localStorage.setItem('userScheduledHours', userData.scheduled_hours || 40);
  //     localStorage.setItem('isLoggedIn', 'true');
  //     localStorage.setItem('loginTimestamp', Date.now().toString());
      
  //     return userData;
  //   } catch (error) {
  //     console.error("Login failed:", error);
  //     throw error;
  //   }
  // }
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
      
      // Set new user data
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', userData.name);
      localStorage.setItem('userContactId', userData.contact_id);
      localStorage.setItem('userScheduledHours', userData.scheduled_hours || 40);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('loginTimestamp', Date.now().toString());
      // Store the group manager status
      localStorage.setItem('isGroupManager', String(userData.is_group_manager || false));
      
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

  // Get full user details from localStorage
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
    
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');
    const contactId = localStorage.getItem('userContactId');
    const scheduledHours = parseInt(localStorage.getItem('userScheduledHours') || '40', 10);
    const isGroupManager = localStorage.getItem('isGroupManager') === 'true';

    if (!email) {
      console.log("No user details found in localStorage");
      return null;
    }
    
    console.log("Getting user details:", { email, name, contactId, scheduledHours });
    return {
      email,
      name,
      contactId,
      scheduledHours,
      isGroupManager
    };
  }

  // Logout user by clearing localStorage
  static logout() {
    console.log("Logging out user");
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userContactId');
    localStorage.removeItem('userScheduledHours');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loginTimestamp');
    localStorage.removeItem('isGroupManager');
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