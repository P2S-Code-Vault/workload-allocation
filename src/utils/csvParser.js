import Papa from 'papaparse';

export async function loadProjectsFromCSV(csvPath) {
  try {
    const response = await fetch(csvPath);
    const csvText = await response.text();
    
    const { data, errors } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });
    
    if (errors.length > 0) {
      console.error("CSV parse errors:", errors);
    }
    
    // Transform the CSV data to match the expected format for Projects.csv
    return data.map(item => ({
      'Project Number': item.ProjectNumber,
      'Project Name': item.ProjectName,
      'PM': item.ProjectManager,
      'Labor': parseFloat(item.ProjectContractLabor) || 0,
      'Pct Labor Used': 0, // This will be calculated from API data when needed
      'ProjectID': item.ProjectID,
      'Status': item.Status,
      'GroupNo': item.GroupNo
    }));
  } catch (error) {
    console.error("Error loading Projects CSV:", error);
    return [];
  }
}

// Keep the old function name for backward compatibility
export async function loadMilestonesFromCSV(csvPath) {
  // Now load from Projects.csv instead of Milestones.csv
  return loadProjectsFromCSV('/Projects.csv');
}

export async function loadOpportunitiesFromCSV(csvPath) {
  console.log("loadOpportunitiesFromCSV called with path:", csvPath);
  try {
    const response = await fetch(csvPath);
    const csvText = await response.text();
    const { data, errors } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });
    if (errors.length > 0) {
      console.error("CSV parse errors:", errors);
    }
    console.log("First 3 parsed opportunities (raw):", data.slice(0, 3));
    const mapped = data.map(item => ({
      'OpportunityNumber': item.opportunity_number,
      'Opportunity_Name_from_Lead__c': item.opportunity_name,
      'ProposalChampion': item.proposal_champion,
      'Estimated_Fee__c': item.estimated_fee,
      ...item
    }));
    console.log("First 3 mapped opportunities (for search):", mapped.slice(0, 3));
    return mapped;
  } catch (error) {
    console.error("Error loading Opportunities CSV:", error);
    return [];
  }
}