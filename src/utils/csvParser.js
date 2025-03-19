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