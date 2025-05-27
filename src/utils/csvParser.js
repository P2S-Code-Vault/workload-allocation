import Papa from 'papaparse';

export async function loadMilestonesFromCSV(csvPath) {
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
    
    // Transform the CSV data to match the expected format
    return data.map(item => ({
      'Project Number': item.project_number,
      'Project Name': item.project_name,
      'Milestone': item.milestone_name,
      'PM': item.project_manager,
      'Labor': parseFloat(item.contract_labor) || 0,
      'Pct Labor Used': parseFloat(item.forecast_pm_labor) * 100 || 0
    }));
  } catch (error) {
    console.error("Error loading CSV:", error);
    return [];
  }
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
      'Opportunity Number': item.opportunity_number,
      'OpportunityName': item.opportunity_name, // fallback for search
      'Opportunity Name': item.opportunity_name,
      'Proposal Champion': item.proposal_champion,
      'Estimated Fee': item.estimated_fee,
      // Add camelCase fields for search compatibility
      'OpportunityNumber': item.opportunity_number,
      'Opportunity_Name_from_Lead__c': item.opportunity_name,
      'Proposal_Champion__c': item.proposal_champion,
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