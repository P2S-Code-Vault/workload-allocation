import Papa from 'papaparse';
import { mockStaffData } from '../data/mockStaffData';

export class StaffService {
  static async loadStaffData() {
    try {
      const possiblePaths = [
        '/data/Staff.csv',
        `${process.env.PUBLIC_URL}/data/Staff.csv`,
        './data/Staff.csv'
      ];

      let response;
      let lastError;

      for (const path of possiblePaths) {
        try {
          console.log('Attempting to load Staff data from:', path);
          response = await fetch(path, {
            headers: {
              'Accept': 'text/csv,text/plain',
              'Cache-Control': 'no-cache'
            }
          });
          
          // Check if we got HTML instead of CSV
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            console.log('Received HTML instead of CSV from:', path);
            lastError = new Error('Received HTML instead of CSV');
            continue;
          }

          if (response.ok) {
            const text = await response.text();
            // Quick validation of CSV content
            if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
              console.log('Received HTML content instead of CSV from:', path);
              lastError = new Error('Received HTML content instead of CSV');
              continue;
            }
            
            // Verify it has CSV structure
            if (!text.includes(',') || !text.toLowerCase().includes('name')) {
              console.log('Invalid CSV structure from:', path);
              lastError = new Error('Invalid CSV structure');
              continue;
            }

            console.log('Successfully loaded Staff data from:', path);
            return this.parseKnownCSV(text);
          }
        } catch (e) {
          console.log('Failed to load from path:', path, e);
          lastError = e;
        }
      }

      // If we get here, no path worked
      console.warn('Failed to load Staff.csv from all paths, using mock data. Last error:', lastError);
      return mockStaffData;
    } catch (error) {
      console.error('Error in loadStaffData:', error);
      return mockStaffData;
    }
  }
  
  static parseKnownCSV(csvText) {
    return new Promise((resolve) => {
      try {
        // Use Papa Parse with specific config for the known CSV structure
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false, // Keep everything as string to avoid numeric conversion issues
          delimiter: ',', // Known delimiter
          comments: '#',
          transformHeader: (header) => header.trim(), // Trim whitespace from headers
          complete: (results) => {
            if (results.errors && results.errors.length > 0) {
              console.warn('CSV parse warnings:', results.errors.length, 'issues detected');
              
              if (results.errors.length > 0) {
                console.log('First error:', results.errors[0]);
              }
            }
            
            try {
              // Process the data with our known column structure
              const staffData = this.processKnownCSVFormat(results.data);
              resolve(staffData);
            } catch (e) {
              console.error('Error processing parsed CSV data:', e);
              resolve([]);
            }
          },
          error: (error) => {
            console.error('CSV parsing error:', error);
            resolve([]);
          }
        });
      } catch (e) {
        console.error('Error in CSV parser setup:', e);
        resolve([]);
      }
    });
  }
  
  static processKnownCSVFormat(data) {
    if (!data || data.length === 0) {
      return [];
    }
    
    // Log the headers to verify our column expectations
    const firstRow = data[0];
    const expectedColumns = ['Name', 'Email', 'Labor_Category__c', 'Resource_Studio_Leader__c', 
                            'Studio Leader', 'Group_Manager__c', 'Is_Group_Manager__c'];
    
    console.log('CSV headers found:', Object.keys(firstRow));
    console.log('Expected headers:', expectedColumns);
    
    // Process the data based on our known structure
    const staffData = data
      .filter(row => {
        // Skip rows without a name
        return row.Name && row.Name.trim() !== '';
      })
      .map(row => {
        // Sanitize each field
        return {
          name: this.sanitizeField(row.Name),
          email: this.sanitizeField(row.Email),
          laborCategory: this.sanitizeField(row['Labor_Category__c']),
          studioLeader: this.sanitizeField(row['Resource_Studio_Leader__c']),
          studioLeaderName: this.sanitizeField(row['Studio Leader']), // Keep original format
          groupManager: this.sanitizeField(row['Group_Manager__c']),
          isGroupManager: this.parseBoolean(row['Is_Group_Manager__c'])
        };
      });
      
    console.log(`Processed ${staffData.length} staff records from CSV`);
    
    // Log a sample record to verify the mapping
    if (staffData.length > 0) {
      console.log('Sample processed record:', staffData[0]);
    }
    
    return staffData;
  }
  
  static parseBoolean(value) {
    if (!value) return false;
    
    const strValue = String(value).toLowerCase().trim();
    return strValue === 'true' || strValue === 'yes' || strValue === '1';
  }
  
  // Helper method to sanitize field values
  static sanitizeField(value) {
    if (value === null || value === undefined) {
      return '';
    }
    
    // Convert to string
    let str = String(value);
    
    // Remove HTML tags
    str = str.replace(/<[^>]*>?/gm, '');
    
    // Decode HTML entities
    str = str.replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#039;/g, "'");
             
    // Remove leading/trailing whitespace
    return str.trim();
  }

  static getStudioLeaders(staffData) {
    const studioLeaders = staffData
      .filter(staff => staff.studioLeaderName === staff.name || staff.isGroupManager)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return studioLeaders;
  }

  static getTeamMembers(staffData, studioLeaderName) {
    if (!studioLeaderName) return [];
    
    return staffData
      .filter(staff => staff.studioLeaderName === studioLeaderName && staff.name !== studioLeaderName)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  static getAllUsers(staffData) {
    return staffData.sort((a, b) => a.name.localeCompare(b.name));
  }

  static getUserByName(staffData, name) {
    return staffData.find(staff => staff.name === name) || null;
  }

  static getUserByEmail(staffData, email) {
    return staffData.find(staff => staff.email === email) || null;
  }

  static getGroupManagers(staffData) {
    const groupManagers = staffData
      .filter(staff => staff.isGroupManager)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return groupManagers;
  }
}
