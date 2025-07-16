import { ProjectDataService } from './ProjectDataService';

export class ProjectSearchService {
  static projectData = null;
  static isLoading = false;
  static loadPromise = null;
  static lastFetchTime = null;
  static CACHE_DURATION = 1 * 60 * 60 * 1000;
  static STORAGE_KEY = 'cached_projects';
  static STORAGE_TIMESTAMP_KEY = 'cached_projects_timestamp';

  // Add opportunity data caching
  static opportunityData = null;
  static opportunityLoadPromise = null;
  static OPPORTUNITY_STORAGE_KEY = 'cached_opportunities';
  static OPPORTUNITY_TIMESTAMP_KEY = 'cached_opportunities_timestamp';

  // Initialize by loading from API or cache
  static async initialize(forceRefresh = false) {
    // If data is already in memory and not forcing refresh, return it
    if (this.projectData !== null && !forceRefresh) return this.projectData;

    // If already loading, wait for the existing promise
    if (this.loadPromise) return this.loadPromise;

    this.isLoading = true;
    console.log('Initializing project search service...');

    try {
      // Check if we should use cached data
      const cachedData = this.getCachedData();
      if (cachedData && !forceRefresh) {
        console.log('Using cached project data');
        this.projectData = cachedData;
        this.isLoading = false;
        return this.projectData;
      }

      // Load fresh data from API
      console.log('Fetching fresh project data from API...');
      this.loadPromise = this.fetchFromAPI();
      this.projectData = await this.loadPromise;

      // Cache the data
      this.cacheData(this.projectData);

      console.log(`Loaded ${this.projectData.length} project records from API`);
      this.isLoading = false;
      this.loadPromise = null;
      return this.projectData;
    } catch (error) {
      console.error('Failed to initialize project search service:', error);

      // If API fails, try to use stale cache data as fallback
      const staleCache = this.getCachedData(true);
      if (staleCache) {
        console.warn('Using stale cached data as fallback');
        this.projectData = staleCache;
        this.isLoading = false;
        this.loadPromise = null;
        return this.projectData;
      }

      this.isLoading = false;
      this.loadPromise = null;
      throw error;
    }
  }

  // Fetch data from the API
  static async fetchFromAPI() {
    try {
      const data = await ProjectDataService.getAllActiveProjects();

      // Transform API data to match the expected format (same as CSV format)
      return data.map((project) => ({
        'Project Number': project.project_number,
        'Project Name': project.project_name,
        'PM': project.project_manager,
        'Labor': project.project_contract_labor || 0,
        'Pct Labor Used': project.eac_pct || 0,
        'ProjectID': project.project_id,
        'Status': project.status,
        'EAC': project.eac,
        // Keep the original API response for additional fields if needed
        _apiData: project,
      }));
    } catch (error) {
      console.error('Failed to fetch projects from API:', error);
      throw error;
    }
  }

  // Get cached data from localStorage
  static getCachedData(ignoreExpiry = false) {
    try {
      const timestamp = localStorage.getItem(this.STORAGE_TIMESTAMP_KEY);
      const cachedDataStr = localStorage.getItem(this.STORAGE_KEY);

      if (!timestamp || !cachedDataStr) return null;

      const cacheAge = Date.now() - parseInt(timestamp);

      // Check if cache is expired (unless we're ignoring expiry)
      if (!ignoreExpiry && cacheAge > this.CACHE_DURATION) {
        console.log('Cache is expired');
        return null;
      }

      return JSON.parse(cachedDataStr);
    } catch (error) {
      console.error('Failed to read cache:', error);
      return null;
    }
  }

  // Cache data to localStorage
  static cacheData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(this.STORAGE_TIMESTAMP_KEY, Date.now().toString());
      console.log('Project data cached successfully');
    } catch (error) {
      console.error('Failed to cache data:', error);
      // If localStorage is full, clear old data and try again
      if (error.name === 'QuotaExceededError') {
        this.clearCache();
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
          localStorage.setItem(this.STORAGE_TIMESTAMP_KEY, Date.now().toString());
        } catch (retryError) {
          console.error('Failed to cache data even after clearing:', retryError);
        }
      }
    }
  }

  // Clear the cache
  static clearCache() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_TIMESTAMP_KEY);
    this.projectData = null;
    console.log('Project cache cleared');
  }

  // Force refresh the data
  static async refresh() {
    this.clearCache();
    return this.initialize(true);
  }

  // Check if cache needs refresh
  static needsRefresh() {
    const timestamp = localStorage.getItem(this.STORAGE_TIMESTAMP_KEY);
    if (!timestamp) return true;

    const cacheAge = Date.now() - parseInt(timestamp);
    return cacheAge > this.CACHE_DURATION;
  }

  // Search for projects - same implementation as before
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

      // First look for project numbers that start with the search term
      const numberStartsWithMatches = this.projectData.filter((project) =>
        project['Project Number'].toLowerCase().startsWith(searchTermLower)
      );

      // Then look for project names that start with the search term
      const nameStartsWithMatches = this.projectData.filter((project) =>
        !project['Project Number'].toLowerCase().startsWith(searchTermLower) &&
        project['Project Name']?.toLowerCase().startsWith(searchTermLower)
      );

      // Then look for partial matches
      const partialMatches = this.projectData.filter((project) =>
        !project['Project Number'].toLowerCase().startsWith(searchTermLower) &&
        !project['Project Name']?.toLowerCase().startsWith(searchTermLower) &&
        (
          project['Project Number'].toLowerCase().includes(searchTermLower) ||
          project['Project Name']?.toLowerCase().includes(searchTermLower)
        )
      );

      // Combine all matches in priority order
      const matches = [
        ...numberStartsWithMatches,
        ...nameStartsWithMatches,
        ...partialMatches,
      ];

      console.log(`Found ${matches.length} projects matching "${searchTerm}"`);

      return matches.slice(0, 40);
    } catch (error) {
      console.error('Error searching projects:', error);
      return [];
    }
  }

  // Get project details
  static async getProjectDetails(projectNumber) {
    if (!projectNumber) {
      throw new Error('Project number is required');
    }

    try {
      if (!this.projectData) {
        await this.initialize();
      }

      const project = this.projectData.find((p) =>
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

  // Background refresh method
  static async backgroundRefresh() {
    if (this.needsRefresh()) {
      console.log('Starting background refresh of project data...');
      try {
        await this.refresh();
        console.log('Background refresh completed successfully');
      } catch (error) {
        console.error('Background refresh failed:', error);
      }
    }
  }

  // Opportunity methods implementation
  static async initializeOpportunities(forceRefresh = false) {
    // If data is already in memory and not forcing refresh, return it
    if (this.opportunityData !== null && !forceRefresh) return this.opportunityData;

    // If already loading, wait for the existing promise
    if (this.opportunityLoadPromise) return this.opportunityLoadPromise;

    this.isLoading = true;
    console.log('Initializing opportunity search service...');

    try {
      // Check if we should use cached data
      const cachedData = this.getCachedOpportunityData();
      if (cachedData && !forceRefresh) {
        console.log('Using cached opportunity data');
        this.opportunityData = cachedData;
        this.isLoading = false;
        return this.opportunityData;
      }

      // Load fresh data from API
      console.log('Fetching fresh opportunity data from API...');
      this.opportunityLoadPromise = this.fetchOpportunitiesFromAPI();
      this.opportunityData = await this.opportunityLoadPromise;

      // Cache the data
      this.cacheOpportunityData(this.opportunityData);

      console.log(`Loaded ${this.opportunityData.length} opportunity records from API`);
      this.isLoading = false;
      this.opportunityLoadPromise = null;
      return this.opportunityData;
    } catch (error) {
      console.error('Failed to initialize opportunity search service:', error);

      // If API fails, try to use stale cache data as fallback
      const staleCache = this.getCachedOpportunityData(true);
      if (staleCache) {
        console.warn('Using stale cached opportunity data as fallback');
        this.opportunityData = staleCache;
        this.isLoading = false;
        this.opportunityLoadPromise = null;
        return this.opportunityData;
      }

      this.isLoading = false;
      this.opportunityLoadPromise = null;
      throw error;
    }
  }

  // Fetch opportunities from the API
  static async fetchOpportunitiesFromAPI() {
    try {
      const data = await ProjectDataService.getAllOpportunities();

      // Transform API data to match the expected format for search
      return data.map((opportunity) => ({
        'Opportunity Number': opportunity.opportunity_number,
        'Opportunity Name': opportunity.opportunity_name,
        'Proposal Champion': opportunity.proposal_champion,
        'Champion Email': opportunity.champion_email,
        'Estimated Fee': opportunity.estimated_fee_proposed || 0,
        'Probability': opportunity.probability || 0,
        'Group': opportunity.o_group || '',
        // Keep the original API response for additional fields if needed
        _apiData: opportunity,
      }));
    } catch (error) {
      console.error('Failed to fetch opportunities from API:', error);
      throw error;
    }
  }

  // Get cached opportunity data from localStorage
  static getCachedOpportunityData(ignoreExpiry = false) {
    try {
      const timestamp = localStorage.getItem(this.OPPORTUNITY_TIMESTAMP_KEY);
      const cachedDataStr = localStorage.getItem(this.OPPORTUNITY_STORAGE_KEY);

      if (!timestamp || !cachedDataStr) return null;

      const cacheAge = Date.now() - parseInt(timestamp);

      // Check if cache is expired (unless we're ignoring expiry)
      if (!ignoreExpiry && cacheAge > this.CACHE_DURATION) {
        console.log('Opportunity cache is expired');
        return null;
      }

      return JSON.parse(cachedDataStr);
    } catch (error) {
      console.error('Failed to read opportunity cache:', error);
      return null;
    }
  }

  // Cache opportunity data to localStorage
  static cacheOpportunityData(data) {
    try {
      localStorage.setItem(this.OPPORTUNITY_STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(this.OPPORTUNITY_TIMESTAMP_KEY, Date.now().toString());
      console.log('Opportunity data cached successfully');
    } catch (error) {
      console.error('Failed to cache opportunity data:', error);
      // If localStorage is full, clear old data and try again
      if (error.name === 'QuotaExceededError') {
        this.clearOpportunityCache();
        try {
          localStorage.setItem(this.OPPORTUNITY_STORAGE_KEY, JSON.stringify(data));
          localStorage.setItem(this.OPPORTUNITY_TIMESTAMP_KEY, Date.now().toString());
        } catch (retryError) {
          console.error('Failed to cache opportunity data even after clearing:', retryError);
        }
      }
    }
  }

  // Clear the opportunity cache
  static clearOpportunityCache() {
    localStorage.removeItem(this.OPPORTUNITY_STORAGE_KEY);
    localStorage.removeItem(this.OPPORTUNITY_TIMESTAMP_KEY);
    this.opportunityData = null;
    console.log('Opportunity cache cleared');
  }

  // Force refresh the opportunity data
  static async refreshOpportunities() {
    this.clearOpportunityCache();
    return this.initializeOpportunities(true);
  }

  // Check if opportunity cache needs refresh
  static needsOpportunityRefresh() {
    const timestamp = localStorage.getItem(this.OPPORTUNITY_TIMESTAMP_KEY);
    if (!timestamp) return true;

    const cacheAge = Date.now() - parseInt(timestamp);
    return cacheAge > this.CACHE_DURATION;
  }

  // Background refresh method for opportunities
  static async backgroundRefreshOpportunities() {
    if (this.needsOpportunityRefresh()) {
      console.log('Starting background refresh of opportunity data...');
      try {
        await this.refreshOpportunities();
        console.log('Background opportunity refresh completed successfully');
      } catch (error) {
        console.error('Background opportunity refresh failed:', error);
      }
    }
  }

  static async searchOpportunities(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    try {
      // Make sure data is loaded
      if (!this.opportunityData) {
        await this.initializeOpportunities();
      }

      const searchTermLower = searchTerm.toLowerCase();

      // First look for opportunity numbers that start with the search term (highest priority)
      const numberStartsWithMatches = this.opportunityData.filter((opportunity) =>
        opportunity['Opportunity Number'].toLowerCase().startsWith(searchTermLower)
      );

      // Then look for opportunity names that start with the search term (high priority)
      const nameStartsWithMatches = this.opportunityData.filter((opportunity) =>
        !opportunity['Opportunity Number'].toLowerCase().startsWith(searchTermLower) &&
        opportunity['Opportunity Name']?.toLowerCase().startsWith(searchTermLower)
      );

      // Then look for proposal champion names that start with the search term (medium priority)
      const championStartsWithMatches = this.opportunityData.filter((opportunity) =>
        !opportunity['Opportunity Number'].toLowerCase().startsWith(searchTermLower) &&
        !opportunity['Opportunity Name']?.toLowerCase().startsWith(searchTermLower) &&
        opportunity['Proposal Champion']?.toLowerCase().startsWith(searchTermLower)
      );

      // Then look for partial matches in opportunity number and name (lowest priority)
      const partialMatches = this.opportunityData.filter((opportunity) =>
        !opportunity['Opportunity Number'].toLowerCase().startsWith(searchTermLower) &&
        !opportunity['Opportunity Name']?.toLowerCase().startsWith(searchTermLower) &&
        !opportunity['Proposal Champion']?.toLowerCase().startsWith(searchTermLower) &&
        (
          opportunity['Opportunity Number'].toLowerCase().includes(searchTermLower) ||
          opportunity['Opportunity Name']?.toLowerCase().includes(searchTermLower) ||
          opportunity['Proposal Champion']?.toLowerCase().includes(searchTermLower)
        )
      );

      // Combine all matches in priority order
      const matches = [
        ...numberStartsWithMatches,
        ...nameStartsWithMatches,
        ...championStartsWithMatches,
        ...partialMatches,
      ];

      console.log(`Found ${matches.length} opportunities matching "${searchTerm}"`);

      return matches.slice(0, 40);
    } catch (error) {
      console.error('Error searching opportunities:', error);
      return [];
    }
  }

  static async getOpportunityDetails(opportunityNumber) {
    if (!opportunityNumber) {
      throw new Error('Opportunity number is required');
    }

    try {
      if (!this.opportunityData) {
        await this.initializeOpportunities();
      }

      const opportunity = this.opportunityData.find((o) =>
        o['Opportunity Number'] === opportunityNumber
      );

      if (!opportunity) {
        throw new Error(`Opportunity not found: ${opportunityNumber}`);
      }

      return opportunity;
    } catch (error) {
      console.error('Error getting opportunity details:', error);
      throw error;
    }
  }
}

export default ProjectSearchService;



// export class ProjectSearchService {
//   static projectData = null;
//   static isLoading = false;
//   static loadPromise = null;
//   static lastFetchTime=null;
//   static CACHE_DURATION=24*60*60*1000;
//   static STORAGE_KEY='cached_projects';
//   static STORAGE_TIMESTAMP_KEY='cached_projects_timestamp';

//   // Add static for opportunities
//   static opportunityData = null;
//   static opportunityLoadPromise = null;

//   // Initialize by loading the CSV file
//   // static async initialize() {
//   //   if (this.projectData !== null) return this.projectData;
//   //   if (this.loadPromise) return this.loadPromise;

//   //   this.isLoading = true;
//   //   console.log('Initializing project search service with Projects CSV data');

//   //   try {
//   //     // Store the promise to prevent multiple loads - now loads from Projects.csv
//   //     this.loadPromise = loadMilestonesFromCSV('/Projects.csv');
//   //     this.projectData = await this.loadPromise;
      
//   //     console.log(`Loaded ${this.projectData.length} project records for search`);
//   //     this.isLoading = false;
//   //     this.loadPromise = null;
//   //     return this.projectData;
//   //   } catch (error) {
//   //     console.error('Failed to initialize project search service:', error);
//   //     this.isLoading = false;
//   //     this.loadPromise = null;
//   //     throw error;
//   //   }
//   // }
//   // Initialize by loading from API or cache
//   static async initialize(forceRefresh = false) {
//     // If data is already in memory and not forcing refresh, return it
//     if (this.projectData !== null && !forceRefresh) return this.projectData;
    
//     // If already loading, wait for the existing promise
//     if (this.loadPromise) return this.loadPromise;

//     this.isLoading = true;
//     console.log('Initializing project search service...');

//     try {
//       // Check if we should use cached data
//       const cachedData = this.getCachedData();
//       if (cachedData && !forceRefresh) {
//         console.log('Using cached project data');
//         this.projectData = cachedData;
//         this.isLoading = false;
//         return this.projectData;
//       }

//       // Load fresh data from API
//       console.log('Fetching fresh project data from API...');
//       this.loadPromise = this.fetchFromAPI();
//       this.projectData = await this.loadPromise;
      
//       // Cache the data
//       this.cacheData(this.projectData);
      
//       console.log(`Loaded ${this.projectData.length} project records from API`);
//       this.isLoading = false;
//       this.loadPromise = null;
//       return this.projectData;
//     } catch (error) {
//       console.error('Failed to initialize project search service:', error);
      
//       // If API fails, try to use stale cache data as fallback
//       const staleCache = this.getCachedData(true);
//       if (staleCache) {
//         console.warn('Using stale cached data as fallback');
//         this.projectData = staleCache;
//         this.isLoading = false;
//         this.loadPromise = null;
//         return this.projectData;
//       }
      
//       this.isLoading = false;
//       this.loadPromise = null;
//       throw error;
//     }
//   }


//   // Load Opportunities.csv and cache
//   static async initializeOpportunities() {
//     console.log("ProjectSearchService.initializeOpportunities called");
//     if (this.opportunityData !== null) return this.opportunityData;
//     if (this.opportunityLoadPromise) return this.opportunityLoadPromise;

//     try {
//       this.opportunityLoadPromise = loadOpportunitiesFromCSV('/data/Opportunities.csv');
//       this.opportunityData = await this.opportunityLoadPromise;
//       return this.opportunityData;
//     } catch (error) {
//       console.error('Failed to load Opportunities.csv:', error);
//       this.opportunityLoadPromise = null;
//       throw error;
//     }
//   }

//   // Search for projects that match the search term across project number and name
//   static async searchProjects(searchTerm) {
//     if (!searchTerm || searchTerm.length < 2) {
//       return [];
//     }

//     try {
//       // Make sure data is loaded
//       if (!this.projectData) {
//         await this.initialize();
//       }

//       const searchTermLower = searchTerm.toLowerCase();
      
//       // First look for project numbers that start with the search term (highest priority)
//       const numberStartsWithMatches = this.projectData.filter(project => 
//         project['Project Number'].toLowerCase().startsWith(searchTermLower)
//       );
      
//       // Then look for project names that start with the search term (high priority)
//       const nameStartsWithMatches = this.projectData.filter(project => 
//         !project['Project Number'].toLowerCase().startsWith(searchTermLower) &&
//         project['Project Name']?.toLowerCase().startsWith(searchTermLower)
//       );
      
//       // Then look for partial matches in project number and name (lowest priority)
//       const partialMatches = this.projectData.filter(project => 
//         !project['Project Number'].toLowerCase().startsWith(searchTermLower) &&
//         !project['Project Name']?.toLowerCase().startsWith(searchTermLower) &&
//         (
//           project['Project Number'].toLowerCase().includes(searchTermLower) ||
//           project['Project Name']?.toLowerCase().includes(searchTermLower)
//         )
//       );
      
//       // Combine all matches in priority order
//       const matches = [
//         ...numberStartsWithMatches,
//         ...nameStartsWithMatches, 
//         ...partialMatches
//       ];

//       console.log(`Found ${matches.length} projects matching "${searchTerm}" across project number and name`);
      
//       // Limit the results to avoid overwhelming the UI
//       return matches.slice(0, 40);
//     } catch (error) {
//       console.error('Error searching projects:', error);
//       return [];
//     }
//   }

//   // Get full details for a specific project number (exact match)
//   static async getProjectDetails(projectNumber) {
//     if (!projectNumber) {
//       throw new Error('Project number is required');
//     }

//     try {
//       // Make sure data is loaded
//       if (!this.projectData) {
//         await this.initialize();
//       }

//       // Find exact match
//       const project = this.projectData.find(p => 
//         p['Project Number'] === projectNumber
//       );

//       if (!project) {
//         throw new Error(`Project not found: ${projectNumber}`);
//       }

//       console.log("Raw project data from CSV:", project);
// console.log("Pct Labor Used value:", project['Pct Labor Used'], "Type:", typeof project['Pct Labor Used']);

//       return project;
//     } catch (error) {
//       console.error('Error getting project details:', error);
//       throw error;
//     }
//   }

//   // Get full details for a specific opportunity number (exact match)
//   static async getOpportunityDetails(opportunityNumber) {
//     if (!opportunityNumber) {
//       throw new Error('Opportunity number is required');
//     }

//     try {
//       if (!this.opportunityData) {
//         await this.initializeOpportunities();
//       }
//       // Find exact match
//       const opp = this.opportunityData.find(o => o.OpportunityNumber === opportunityNumber);
//       if (!opp) {
//         throw new Error(`Opportunity not found: ${opportunityNumber}`);
//       }
//       return opp;
//     } catch (error) {
//       console.error('Error getting opportunity details:', error);
//       throw error;
//     }
//   }
//   static async searchOpportunities(searchTerm) {
//     if (!searchTerm || searchTerm.length < 2) {
//       return [];
//     }

//     try {
//       // Make sure data is loaded
//       if (!this.opportunityData) {
//         await this.initializeOpportunities();
//       }

//       const searchTermLower = searchTerm.toLowerCase();
      
//       // First look for opportunity numbers that start with the search term (highest priority)
//       const numberStartsWithMatches = this.opportunityData.filter(opportunity => 
//         opportunity['OpportunityNumber']?.toLowerCase().startsWith(searchTermLower)
//       );
      
//       // Then look for opportunity names that start with the search term (high priority)
//       const nameStartsWithMatches = this.opportunityData.filter(opportunity => 
//         !opportunity['OpportunityNumber']?.toLowerCase().startsWith(searchTermLower) &&
//         opportunity['Opportunity_Name_from_Lead__c']?.toLowerCase().startsWith(searchTermLower)
//       );
      
//       // Then look for proposal champion names that start with the search term (medium priority)
//       const championStartsWithMatches = this.opportunityData.filter(opportunity => 
//         !opportunity['OpportunityNumber']?.toLowerCase().startsWith(searchTermLower) &&
//         !opportunity['Opportunity_Name_from_Lead__c']?.toLowerCase().startsWith(searchTermLower) &&
//         opportunity['ProposalChampion']?.toLowerCase().startsWith(searchTermLower)
//       );
      
//       // Then look for partial matches in opportunity number, name, and proposal champion (lowest priority)
//       const partialMatches = this.opportunityData.filter(opportunity => 
//         !opportunity['OpportunityNumber']?.toLowerCase().startsWith(searchTermLower) &&
//         !opportunity['Opportunity_Name_from_Lead__c']?.toLowerCase().startsWith(searchTermLower) &&
//         !opportunity['ProposalChampion']?.toLowerCase().startsWith(searchTermLower) &&
//         (
//           opportunity['OpportunityNumber']?.toLowerCase().includes(searchTermLower) ||
//           opportunity['Opportunity_Name_from_Lead__c']?.toLowerCase().includes(searchTermLower) ||
//           opportunity['ProposalChampion']?.toLowerCase().includes(searchTermLower)
//         )
//       );
      
//       // Combine all matches in priority order
//       const matches = [
//         ...numberStartsWithMatches,
//         ...nameStartsWithMatches, 
//         ...championStartsWithMatches,
//         ...partialMatches
//       ];

//       console.log(`Found ${matches.length} opportunities matching "${searchTerm}" across opportunity number, name, and proposal champion`);
      
//       // Limit the results to avoid overwhelming the UI
//       return matches.slice(0, 40);
//     } catch (error) {
//       console.error('Error searching opportunities:', error);
//       return [];
//     }
//   }
// }

// export default ProjectSearchService;
