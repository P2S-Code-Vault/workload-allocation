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

  // Search for projects that match the search term across project number, name, and milestone
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
      
      // First look for project numbers that start with the search term (highest priority)
      const numberStartsWithMatches = this.projectData.filter(project => 
        project['Project Number'].toLowerCase().startsWith(searchTermLower)
      );
      
      // Then look for project names that start with the search term (high priority)
      const nameStartsWithMatches = this.projectData.filter(project => 
        !project['Project Number'].toLowerCase().startsWith(searchTermLower) &&
        project['Project Name']?.toLowerCase().startsWith(searchTermLower)
      );
      
      // Then look for milestone names that start with the search term (medium priority)
      const milestoneStartsWithMatches = this.projectData.filter(project => 
        !project['Project Number'].toLowerCase().startsWith(searchTermLower) &&
        !project['Project Name']?.toLowerCase().startsWith(searchTermLower) &&
        project['Milestone']?.toLowerCase().startsWith(searchTermLower)
      );
      
      // Then look for partial matches in project number, name, and milestone (lowest priority)
      const partialMatches = this.projectData.filter(project => 
        !project['Project Number'].toLowerCase().startsWith(searchTermLower) &&
        !project['Project Name']?.toLowerCase().startsWith(searchTermLower) &&
        !project['Milestone']?.toLowerCase().startsWith(searchTermLower) &&
        (
          project['Project Number'].toLowerCase().includes(searchTermLower) ||
          project['Project Name']?.toLowerCase().includes(searchTermLower) ||
          project['Milestone']?.toLowerCase().includes(searchTermLower)
        )
      );
      
      // Combine all matches in priority order
      const matches = [
        ...numberStartsWithMatches,
        ...nameStartsWithMatches, 
        ...milestoneStartsWithMatches,
        ...partialMatches
      ];

      console.log(`Found ${matches.length} projects matching "${searchTerm}" across project number, name, and milestone`);
      
      // Limit the results to avoid overwhelming the UI
      return matches.slice(0, 40);
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

      console.log("Raw project data from CSV:", project);
console.log("Pct Labor Used value:", project['Pct Labor Used'], "Type:", typeof project['Pct Labor Used']);

      return project;
    } catch (error) {
      console.error('Error getting project details:', error);
      throw error;
    }
  }
  
}

export default ProjectSearchService;