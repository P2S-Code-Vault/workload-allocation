import API_CONFIG from './apiConfig';

export class PMDashboardService {
  static apiBaseUrl = API_CONFIG.BASE_URL;

  static async getPMDashboardData(quarter = null, year = null, pmName = null, showAllMilestones = false) {
    try {
      // Create a cache key for potentially caching the results
      const cacheKey = `pm_dashboard_${quarter || 'all'}_${year || 'all'}_${pmName || 'all'}_${showAllMilestones ? 'all_milestones' : 'filtered_milestones'}`;
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (quarter) {
        params.append('quarter', quarter);
      }
      
      if (year) {
        params.append('year', year);
      }
      
      if (pmName) {
        console.log(`Request filtering by PM: "${pmName}"`);
        params.append('pm_name', pmName);
      }
      
      if (showAllMilestones) {
        params.append('showAllMilestones', 'true');
      }
      
      // Log the full URL for debugging
      const url = `${this.apiBaseUrl}/workload/pm/projects/dashboard?${params.toString()}`;
      console.log("Fetching PM dashboard data from URL:", url);
      
      // Add request timing
      console.time('PM Dashboard API Request');
      const response = await fetch(url);
      console.timeEnd('PM Dashboard API Request');

      console.log('PM Dashboard API Response Status:', response.status);
      
      // Add detailed error handling
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP Error ${response.status}: ${errorText}`);
        
        // Add fallback for development/testing
        if (response.status === 404) {
          console.warn("Using fallback data since endpoint returned 404");
          return this._getFallbackData();
        }
        
        throw new Error(`Failed to fetch PM dashboard data: ${response.status} ${errorText}`);
      }

      // Clone the response for debugging
      const responseClone = response.clone();
      
      try {
        // Try to get the response as text first
        const responseText = await responseClone.text();
        console.log("Raw API response text:", responseText);
        
        // Now parse it to check if it's valid JSON
        try {
          JSON.parse(responseText);
          console.log("Response is valid JSON");
        } catch (jsonError) {
          console.error("Response is not valid JSON:", jsonError);
        }
      } catch (e) {
        console.error("Could not clone and check response:", e);
      }
      
      const data = await response.json();
      console.log("Received PM dashboard data:", data);
      
      // Check if data has expected structure
      if (!data.projects) {
        console.error("API response missing 'projects' array:", data);
        return this._getFallbackData();
      }
      
      console.log(`Received ${data.projects.length} projects for ${pmName || 'all PMs'}`);
      
      // Log summary information
      if (data.summary) {
        console.log("Summary data:", {
          totalProjects: data.summary.totalProjects || 0,
          totalResources: data.summary.totalResources || 0,
          totalHours: data.summary.totalHours || 0,
          totalCost: data.summary.totalCost || 0,
          projectManagers: data.summary.projectManagers || 0,
          quarter: data.summary.quarter || null,
          year: data.summary.year || null,
          month: data.summary.month || null
        });
      }
      
      // Log project details for debugging
      if (data.projects && data.projects.length > 0) {
        console.log("Sample project data:", {
          projectNumber: data.projects[0].projectNumber,
          name: data.projects[0].name,
          pm: data.projects[0].pm,
          resourceCount: data.projects[0].resources ? data.projects[0].resources.length : 0,
          sampleResource: data.projects[0].resources && data.projects[0].resources.length > 0 ? {
            name: data.projects[0].resources[0].name,
            laborCategory: data.projects[0].resources[0].laborCategory,
            month1Hours: data.projects[0].resources[0].month1Hours,
            month2Hours: data.projects[0].resources[0].month2Hours,
            month3Hours: data.projects[0].resources[0].month3Hours,
            totalHours: data.projects[0].resources[0].totalHours,
            totalCost: data.projects[0].resources[0].totalCost
          } : null
        });
      }
      
      // Cache successful results (not for fallback data)
      if (data.projects) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: data,
            timestamp: Date.now(),
            expiry: Date.now() + (30 * 60 * 1000) // 30 minute expiry
          }));
          console.log(`Cached PM dashboard data with key: ${cacheKey}`);
        } catch (cacheError) {
          console.warn("Failed to cache PM dashboard data:", cacheError);
        }
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching PM dashboard data:", error);
      // Return a fallback empty structure rather than throwing
      return this._getFallbackData();
    }
  }
  
  // Legacy method name for backwards compatibility - delegates to getPMDashboardData
  static async getPMDashboardDataByQuarter(year, quarter, pmName = null, showAllMilestones = false) {
    return this.getPMDashboardData(quarter, year, pmName, showAllMilestones);
  }
  
  static async getAllProjectManagers() {
    try {
      const url = `${this.apiBaseUrl}/workload/pm/projects/managers`;
      console.log("Fetching project managers from URL:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch project managers: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Received project managers:", data);
      
      // Clean and filter the project managers array
      const projectManagers = data.project_managers || [];
      const cleanedManagers = projectManagers
        .filter(pm => pm && typeof pm === 'string' && pm.trim().length > 0) // Remove empty, null, or whitespace-only entries
        .filter(pm => pm.trim() !== ',') // Remove entries that are just commas
        .map(pm => pm.trim()) // Trim whitespace
        .filter((pm, index, arr) => arr.indexOf(pm) === index) // Remove duplicates
        .sort(); // Sort alphabetically
      
      console.log(`Filtered project managers: ${cleanedManagers.length} out of ${projectManagers.length} original entries`);
      
      return cleanedManagers;
    } catch (error) {
      console.error("Error fetching project managers:", error);
      // Return empty array as fallback
      return [];
    }
  }
  
  // Opportunities Dashboard Methods
  static async getOpportunitiesDashboardData(quarter = null, year = null, championName = null, showAllMilestones = false) {
    try {
      // Create a cache key for potentially caching the results
      const cacheKey = `opportunities_dashboard_${quarter || 'all'}_${year || 'all'}_${championName || 'all'}_${showAllMilestones ? 'all_milestones' : 'filtered_milestones'}`;
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (quarter) {
        params.append('quarter', quarter);
      }
      
      if (year) {
        params.append('year', year);
      }
      
      if (championName) {
        console.log(`Request filtering by Champion: "${championName}"`);
        params.append('champion_name', championName);
      }
      
      if (showAllMilestones) {
        params.append('showAllMilestones', 'true');
      }
      
      // Log the full URL for debugging
      const url = `${this.apiBaseUrl}/workload/pm/opportunities/dashboard?${params.toString()}`;
      console.log("Fetching opportunities dashboard data from URL:", url);
      
      // Add request timing
      console.time('Opportunities Dashboard API Request');
      const response = await fetch(url);
      console.timeEnd('Opportunities Dashboard API Request');

      console.log('Opportunities Dashboard API Response Status:', response.status);
      
      // Add detailed error handling
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP Error ${response.status}: ${errorText}`);
        
        // Add fallback for development/testing
        if (response.status === 404) {
          console.warn("Using fallback data since opportunities endpoint returned 404");
          return this._getFallbackData();
        }
        
        throw new Error(`Failed to fetch opportunities dashboard data: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("Received opportunities dashboard data:", data);
      
      // Transform opportunities data to match expected structure
      if (data.opportunities) {
        // Transform opportunities array to projects array with consistent structure
        const transformedOpportunities = data.opportunities.map(opportunity => ({
          ...opportunity,
          projectNumber: opportunity.opportunityNumber,
          pm: opportunity.proposalChampion, // Map proposalChampion to pm for consistency
          labor: opportunity.estimatedFee || 0, // Map estimatedFee to labor
          laborUsed: opportunity.probability || 0 // Map probability to laborUsed for display
        }));
        
        // Create transformed data structure
        const transformedData = {
          projects: transformedOpportunities, // Use projects array for consistency with UI
          summary: {
            totalProjects: data.summary?.totalOpportunities || 0,
            totalResources: data.summary?.totalResources || 0,
            totalHours: data.summary?.totalHours || 0,
            totalCost: data.summary?.totalCost || 0,
            projectManagers: data.summary?.proposalChampions || 0,
            quarter: data.summary?.quarter || null,
            year: data.summary?.year || null,
            month: data.summary?.month || null
          }
        };
        
        console.log(`Received ${transformedOpportunities.length} opportunities for ${championName || 'all Champions'}`);
        console.log("Transformed opportunities data:", transformedData);
        
        // Cache successful results
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: transformedData,
            timestamp: Date.now(),
            expiry: Date.now() + (30 * 60 * 1000) // 30 minute expiry
          }));
          console.log(`Cached opportunities dashboard data with key: ${cacheKey}`);
        } catch (cacheError) {
          console.warn("Failed to cache opportunities dashboard data:", cacheError);
        }
        
        return transformedData;
      }
      
      // Check if data has expected structure (fallback for old format)
      if (!data.projects && !data.opportunities) {
        console.error("Opportunities API response missing 'opportunities' or 'projects' array:", data);
        return this._getFallbackData();
      }
      
      // Log summary information for legacy format
      if (data.summary && data.projects) {
        console.log("Opportunities Summary data (legacy format):", {
          totalProjects: data.summary.totalProjects || 0,
          totalResources: data.summary.totalResources || 0,
          totalHours: data.summary.totalHours || 0,
          totalCost: data.summary.totalCost || 0,
          projectManagers: data.summary.projectManagers || 0,
          quarter: data.summary.quarter || null,
          year: data.summary.year || null,
          month: data.summary.month || null
        });
        
        // Cache successful results
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: data,
            timestamp: Date.now(),
            expiry: Date.now() + (30 * 60 * 1000) // 30 minute expiry
          }));
          console.log(`Cached opportunities dashboard data with key: ${cacheKey}`);
        } catch (cacheError) {
          console.warn("Failed to cache opportunities dashboard data:", cacheError);
        }
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching opportunities dashboard data:", error);
      // Return a fallback empty structure rather than throwing
      return this._getFallbackData();
    }
  }

  // Legacy method name for backwards compatibility - delegates to getOpportunitiesDashboardData
  static async getOpportunitiesDashboardDataByQuarter(year, quarter, championName = null, showAllMilestones = false) {
    return this.getOpportunitiesDashboardData(quarter, year, championName, showAllMilestones);
  }
  
  static async getAllOpportunityChampions() {
    try {
      const url = `${this.apiBaseUrl}/workload/pm/opportunities/proposal-champions`;
      console.log("Fetching opportunity champions from URL:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch opportunity champions: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Received opportunity champions:", data);
      
      // Extract champions from the proposal_champions array
      const champions = data.proposal_champions || [];
      const cleanedChampions = champions
        .filter(champion => champion && typeof champion === 'string' && champion.trim().length > 0)
        .filter(champion => champion.trim() !== ',')
        .map(champion => champion.trim())
        .filter((champion, index, arr) => arr.indexOf(champion) === index)
        .sort();
      
      console.log(`Filtered opportunity champions: ${cleanedChampions.length} out of ${champions.length} original entries`);
      
      return cleanedChampions;
    } catch (error) {
      console.error("Error fetching opportunity champions:", error);
      // Return empty array as fallback
      return [];
    }
  }

  // Fallback data method for development/testing
  static _getFallbackData() {
    console.warn("Using fallback data structure");
    return {
      "projects": [],
      "summary": {
        "totalProjects": 0,
        "totalResources": 0,
        "totalHours": 0,
        "totalCost": 0,
        "projectManagers": 0,
        "quarter": null,
        "year": null,
        "month": null
      }
    };
  }

  // New method to fetch all projects with milestones
  static async getAllProjectsWithMilestones() {
    try {
      const url = `${this.apiBaseUrl}/projects/with-milestones?status=Active&include_empty=true`;
      console.log("Fetching all projects with milestones from URL:", url);
      
      console.time('All Projects API Request');
      const response = await fetch(url);
      console.timeEnd('All Projects API Request');

      console.log('All Projects API Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP Error ${response.status}: ${errorText}`);
        throw new Error(`Failed to fetch all projects with milestones: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("Received all projects with milestones data:", data);
      
      // Transform data to match expected structure
      if (data.projects) {
        const transformedProjects = data.projects.map(item => {
          const project = item.project || {};
          const milestones = item.milestones || [];
          
          return {
            // Map project fields to expected structure
            projectNumber: project.projectNumber,
            name: project.projectName,
            pm: project.projectManager || "Unassigned",
            labor: project.projectContractLabor || 0,
            laborUsed: 0, // Projects don't have labor used percentage in this endpoint
            totalHours: milestones.reduce((sum, milestone) => sum + (milestone.hours || 0), 0),
            totalCost: milestones.reduce((sum, milestone) => sum + (milestone.cost || 0), 0),
            status: project.status,
            // Ensure milestones array exists
            milestones: milestones,
            // Map milestones to resources for display consistency
            resources: milestones.map(milestone => ({
              name: milestone.milestone_name || "Unknown Milestone",
              laborCategory: milestone.labor_category || "N/A",
              month1Hours: 0, // Milestones don't have monthly breakdowns in this endpoint
              month2Hours: 0,
              month3Hours: 0,
              totalHours: milestone.hours || 0,
              totalCost: milestone.cost || 0
            }))
          };
        });

        return {
          projects: transformedProjects,
          summary: data.summary || {
            totalProjects: transformedProjects.length,
            totalResources: transformedProjects.reduce((sum, project) => sum + project.resources.length, 0),
            totalHours: transformedProjects.reduce((sum, project) => sum + project.totalHours, 0),
            totalCost: transformedProjects.reduce((sum, project) => sum + project.totalCost, 0),
            projectManagers: [...new Set(transformedProjects.map(p => p.pm).filter(pm => pm && pm !== "Unassigned"))].length,
            quarter: null,
            year: null,
            month: null
          }
        };
      }
      
      return this._getFallbackData();
    } catch (error) {
      console.error("Error fetching all projects with milestones:", error);
      return this._getFallbackData();
    }
  }

  // New method to fetch all opportunities
  static async getAllOpportunities() {
    try {
      const url = `${this.apiBaseUrl}/opportunities/all-opportunities`;
      console.log("Fetching all opportunities from URL:", url);
      
      console.time('All Opportunities API Request');
      const response = await fetch(url);
      console.timeEnd('All Opportunities API Request');

      console.log('All Opportunities API Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP Error ${response.status}: ${errorText}`);
        throw new Error(`Failed to fetch all opportunities: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log("Received all opportunities data:", data);
      
      // Transform opportunities data to match expected structure
      if (data.opportunities) {
        const transformedOpportunities = data.opportunities.map(opportunity => ({
          ...opportunity,
          projectNumber: opportunity.opportunity_number,
          name: opportunity.opportunity_name,
          pm: opportunity.proposal_champion || "Unassigned",
          proposalChampion: opportunity.proposal_champion || "Unassigned",
          labor: opportunity.estimated_fee_proposed || 0,
          estimatedFee: opportunity.estimated_fee_proposed || 0,
          laborUsed: opportunity.probability || 0,
          probability: opportunity.probability || 0,
          totalHours: 0, // Opportunities don't have hour allocations
          totalCost: opportunity.estimated_fee_proposed || 0,
          resources: [] // No resource breakdown for opportunities
        }));

        return {
          projects: transformedOpportunities, // Use projects array for consistency with UI
          summary: data.summary || {
            totalProjects: transformedOpportunities.length,
            totalResources: 0, // Opportunities don't have resource allocations
            totalHours: 0, // Opportunities don't have hour allocations
            totalCost: transformedOpportunities.reduce((sum, opp) => sum + (opp.estimatedFee || 0), 0),
            projectManagers: [...new Set(transformedOpportunities.map(opp => opp.proposalChampion).filter(champion => champion && champion !== "Unassigned"))].length,
            quarter: null,
            year: null,
            month: null
          }
        };
      }
      
      return this._getFallbackData();
    } catch (error) {
      console.error("Error fetching all opportunities:", error);
      return this._getFallbackData();
    }
  }
}

export default PMDashboardService;

