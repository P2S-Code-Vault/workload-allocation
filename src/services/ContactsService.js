import API_CONFIG from './apiConfig';

class ContactsService {
  /**
   * Fetch all active contacts from the API
   * @returns {Promise<Array>} Array of active contacts
   */
  static async getAllActiveContacts() {
    try {
      console.log('ContactsService: Fetching all active contacts...');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTACTS_ALL_ACTIVE}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const contacts = await response.json();
      console.log('ContactsService: Raw contacts from API:', contacts);
      
      // Transform the data to match what TeamMemberSelector expects
      const transformedContacts = contacts.map(contact => ({
        // Primary fields expected by TeamMemberSelector
        id: contact.contact_id,  // Map contact_id to id for component compatibility
        name: contact.name,
        title: contact.title || contact.labor_category || 'No Title', // Use title or labor_category as fallback
        email: contact.email,
        
        // Keep all original fields for backend operations
        contact_id: contact.contact_id,
        labor_category: contact.labor_category,
        scheduled_hours: contact.scheduled_hours || 40,
        hrs_worked_per_week: contact.scheduled_hours || 40, // Alias for compatibility
        studio_leader: contact.studio_leader || '',
        GroupName: contact.GroupName || 'Unassigned',
        is_group_manager: contact.is_group_manager || false,
        group_manager: contact.group_manager || '',
        discipline: contact.discipline || ''
      }));

      console.log('ContactsService: Transformed contacts:', transformedContacts);
      return transformedContacts;
      
    } catch (error) {
      console.error('ContactsService: Error fetching all active contacts:', error);
      throw new Error(`Failed to fetch active contacts: ${error.message}`);
    }
  }

  /**
   * Get contact by email
   * @param {string} email - Email address
   * @returns {Promise<Object>} Contact object
   */
  static async getContactByEmail(email) {
    try {
      console.log(`ContactsService: Fetching contact by email: ${email}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTACT_BY_EMAIL(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Contact not found');
        }
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const contact = await response.json();
      console.log('ContactsService: Contact found:', contact);
      return contact;
      
    } catch (error) {
      console.error('ContactsService: Error fetching contact by email:', error);
      throw error;
    }
  }

  /**
   * Get contacts in the same group as the specified email
   * @param {string} email - Email address
   * @returns {Promise<Array>} Array of contacts in same group
   */
  static async getSameGroupContacts(email) {
    try {
      console.log(`ContactsService: Fetching same group contacts for: ${email}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTACTS_SAME_GROUP_BY_EMAIL(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const contacts = await response.json();
      console.log('ContactsService: Same group contacts:', contacts);
      
      // Transform the data similar to getAllActiveContacts
      const transformedContacts = contacts.map(contact => ({
        id: contact.contact_id,
        name: contact.name,
        title: contact.title || contact.labor_category || 'No Title',
        email: contact.email,
        contact_id: contact.contact_id,
        labor_category: contact.labor_category,
        scheduled_hours: contact.scheduled_hours || 40,
        hrs_worked_per_week: contact.scheduled_hours || 40,
        studio_leader: contact.studio_leader || '',
        GroupName: contact.GroupName || 'Unassigned',
        is_group_manager: contact.is_group_manager || false,
        group_manager: contact.group_manager || '',
        discipline: contact.discipline || ''
      }));

      return transformedContacts;
      
    } catch (error) {
      console.error('ContactsService: Error fetching same group contacts:', error);
      throw error;
    }
  }

  /**
   * Search contacts with optional filters
   * @param {Object} options - Search options
   * @param {string} options.search - Search term for name or email
   * @param {string} options.group_manager - Group manager name filter
   * @returns {Promise<Array>} Array of matching contacts
   */
  static async searchContacts({ search = null, group_manager = null } = {}) {
    try {
      console.log('ContactsService: Searching contacts with options:', { search, group_manager });
      
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (group_manager) queryParams.append('group_manager', group_manager);
      
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONTACTS}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const contacts = await response.json();
      console.log('ContactsService: Search results:', contacts);
      
      // Transform the data
      const transformedContacts = contacts.map(contact => ({
        id: contact.contact_id,
        name: contact.name,
        title: contact.title || contact.labor_category || 'No Title',
        email: contact.email,
        contact_id: contact.contact_id,
        labor_category: contact.labor_category,
        scheduled_hours: contact.scheduled_hours || 40,
        hrs_worked_per_week: contact.scheduled_hours || 40,
        studio_leader: contact.studio_leader || '',
        GroupName: contact.GroupName || 'Unassigned',
        is_group_manager: contact.is_group_manager || false,
        group_manager: contact.group_manager || '',
        discipline: contact.discipline || ''
      }));

      return transformedContacts;
      
    } catch (error) {
      console.error('ContactsService: Error searching contacts:', error);
      throw error;
    }
  }
}

export default ContactsService;