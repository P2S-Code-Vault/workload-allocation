// src/services/ProjectSearchService.js
import { loadMilestonesFromCSV } from '../utils/csvParser';

export class ProjectSearchService {
  static projectData = null;
  static isLoading = false;
  static loadPromise = null;

  // Initialize by loading the CSV file
  static async initialize() {
    if (this.projectData !== null) return this.projectData;
    if (this.loadPromise) return this.loadPromise;

    this.isLoading = true;
    console.log('Initializing project search service with CSV data');

    try {
      // Store the promise to prevent multiple loads
      this.loadPromise = loadMilestonesFromCSV('/data/Milestones.csv');
      this.projectData = await this.loadPromise;
      
      console.log(`Loaded ${this.projectData.length} project records for search`);
      this.isLoading = false;
      this.loadPromise = null;
      return this.projectData;
    } catch (error) {
      console.error('Failed to initialize project search service:', error);
      this.isLoading = false;
      this.loadPromise = null;
      throw error;
    }
  }

  // Search for projects that match the search term
  static async searchProjects(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    try {
      // Make sure data is loaded
      if (!this.projectData) {
        await this.initialize();
      }

      const searchTermLower = searchTerm.toLowerCase();
      
      // First look for projects that start with the search term (higher priority)
      const startsWithMatches = this.projectData.filter(project => 
        project['Project Number'].toLowerCase().startsWith(searchTermLower)
      );
      
      // Then look for projects that contain the search term anywhere
      const containsMatches = this.projectData.filter(project => 
        !project['Project Number'].toLowerCase().startsWith(searchTermLower) &&
        project['Project Number'].toLowerCase().includes(searchTermLower)
      );
      
      // Combine both result sets, with startsWith matches first
      const matches = [...startsWithMatches, ...containsMatches];

      console.log(`Found ${matches.length} projects matching "${searchTerm}"`);
      
      // Limit the results to avoid overwhelming the UI
      return matches.slice(0, 10);
    } catch (error) {
      console.error('Error searching projects:', error);
      return [];
    }
  }

  // Get full details for a specific project number (exact match)
  static async getProjectDetails(projectNumber) {
    if (!projectNumber) {
      throw new Error('Project number is required');
    }

    try {
      // Make sure data is loaded
      if (!this.projectData) {
        await this.initialize();
      }

      // Find exact match
      const project = this.projectData.find(p => 
        p['Project Number'] === projectNumber
      );

      if (!project) {
        throw new Error(`Project not found: ${projectNumber}`);
      }

      return project;
    } catch (error) {
      console.error('Error getting project details:', error);
      throw error;
    }
  }
}

export default ProjectSearchService;