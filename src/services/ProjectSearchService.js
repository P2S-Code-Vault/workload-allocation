import { loadMilestonesFromCSV, loadOpportunitiesFromCSV } from '../utils/csvParser';

export class ProjectSearchService {
  static projectData = null;
  static isLoading = false;
  static loadPromise = null;

  // Add static for opportunities
  static opportunityData = null;
  static opportunityLoadPromise = null;

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

  // Load Opportunities.csv and cache
  static async initializeOpportunities() {
    console.log("ProjectSearchService.initializeOpportunities called");
    if (this.opportunityData !== null) return this.opportunityData;
    if (this.opportunityLoadPromise) return this.opportunityLoadPromise;

    try {
      this.opportunityLoadPromise = loadOpportunitiesFromCSV('/data/Opportunities.csv');
      this.opportunityData = await this.opportunityLoadPromise;
      return this.opportunityData;
    } catch (error) {
      console.error('Failed to load Opportunities.csv:', error);
      this.opportunityLoadPromise = null;
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

  // Get full details for a specific opportunity number (exact match)
  static async getOpportunityDetails(opportunityNumber) {
    if (!opportunityNumber) {
      throw new Error('Opportunity number is required');
    }

    try {
      if (!this.opportunityData) {
        await this.initializeOpportunities();
      }
      // Find exact match
      const opp = this.opportunityData.find(o => o.OpportunityNumber === opportunityNumber);
      if (!opp) {
        throw new Error(`Opportunity not found: ${opportunityNumber}`);
      }
      return opp;
    } catch (error) {
      console.error('Error getting opportunity details:', error);
      throw error;
    }
  }

  static async searchOpportunities(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }
    try {
      if (!this.opportunityData) {
        await this.initializeOpportunities();
      }
      const searchTermLower = searchTerm.trim().toLowerCase();
      // Helper to get number and name fields robustly
      const getNumber = (opp) => (opp.OpportunityNumber || opp['Opportunity Number'] || '').trim().toLowerCase();
      const getName = (opp) => (opp.Opportunity_Name_from_Lead__c || opp['Opportunity Name'] || '').trim().toLowerCase();
      // Highest priority: OpportunityNumber starts with search term
      const numberStartsWith = this.opportunityData.filter(opp =>
        getNumber(opp).startsWith(searchTermLower)
      );
      // Next: Opportunity Name starts with search term (but not already included)
      const nameStartsWith = this.opportunityData.filter(opp =>
        !getNumber(opp).startsWith(searchTermLower) &&
        getName(opp).startsWith(searchTermLower)
      );
      // Partial matches (not already included)
      const partialMatches = this.opportunityData.filter(opp =>
        !getNumber(opp).startsWith(searchTermLower) &&
        !getName(opp).startsWith(searchTermLower) &&
        (
          getNumber(opp).includes(searchTermLower) ||
          getName(opp).includes(searchTermLower)
        )
      );
      return [...numberStartsWith, ...nameStartsWith, ...partialMatches].slice(0, 40);
    } catch (error) {
      console.error('Error searching opportunities:', error);
      return [];
    }
  }
}

export default ProjectSearchService;