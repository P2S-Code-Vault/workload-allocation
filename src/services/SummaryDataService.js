import Papa from 'papaparse';

export class SummaryDataService {
  static async loadSummaryData() {
    try {
      const response = await fetch('/RA_Summary.csv');
      if (!response.ok) {
        throw new Error('Failed to load summary data');
      }

      const csvText = await response.text();
      
      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => {
            // Map CSV headers to our expected column names
            const headerMap = {
              'Project Number': 'Number',
              'Project Name': 'Name',
              'Contract Total Labor': 'ContractLabor',
              '% Labor Used': 'PercentLaborUsed',
              'Actual Multiplier Rate': 'MultiplierRate',
              'Resource': 'Resource',
              'Hours': 'Hours',
              'PM': 'PM'
            };
            return headerMap[header] || header;
          },
          complete: (results) => {
            if (results.errors.length > 0) {
              reject(new Error('CSV parsing failed'));
              return;
            }
            resolve(results.data);
          },
          error: (error) => {
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('Error loading summary data:', error);
      throw error;
    }
  }

  static groupByProjectNumber(data) {
    // First pass: group by project number and collect project-level metrics
    const projectGroups = data.reduce((groups, row) => {
      const projectNumber = row.Number || 'Unassigned';
      
      if (!groups[projectNumber]) {
        groups[projectNumber] = {
          name: row.Name || '',
          pm: row.PM || '', 
          contractTotalLabor: parseFloat(row.ContractLabor) || 0,
          percentLaborUsed: parseFloat(row.PercentLaborUsed) || 0,
          actualMultiplierRate: parseFloat(row.MultiplierRate) || 0,
          rows: []
        };
      }

      // Only add resource and hours to rows array
      if (row.Resource) {
        groups[projectNumber].rows.push({
          resource: row.Resource,
          hours: parseFloat(row.Hours) || 0,
          laborGrade: row[Object.keys(row)[13]] || 'N/A'  // Add labor grade from column 13
        });
      }

      return groups;
    }, {});

    return projectGroups;
  }

  static calculateProjectTotals(groupedData) {
    return Object.entries(groupedData).reduce((acc, [projectNumber, data]) => {
      const totalHours = data.rows.reduce((sum, row) => sum + row.hours, 0);
      
      acc[projectNumber] = {
        ...data,
        totalHours
      };
      
      return acc;
    }, {});
  }

  static groupByPM(data) {
    // First pass: group by PM and collect project-level metrics
    const pmGroups = {};

    // Group projects by PM
    Object.entries(data).forEach(([resource, resourceData]) => {
      resourceData.rows.forEach(row => {
        const pm = row.pm || 'Unassigned';
        
        if (!pmGroups[pm]) {
          pmGroups[pm] = {
            totalHours: 0,
            projects: {}
          };
        }

        const projectKey = row.projectNumber;
        if (!pmGroups[pm].projects[projectKey]) {
          pmGroups[pm].projects[projectKey] = {
            projectNumber: row.projectNumber,
            projectName: row.projectName,
            labor: row.labor,
            pctLaborUsed: row.pctLaborUsed,
            actualMultiplierRate: row.actualMultiplierRate,
            resources: {},
            totalHours: 0
          };
        }

        // Add or update resource hours for this project
        if (!pmGroups[pm].projects[projectKey].resources[resource]) {
          pmGroups[pm].projects[projectKey].resources[resource] = 0;
        }
        pmGroups[pm].projects[projectKey].resources[resource] += parseFloat(row.hours) || 0;
        pmGroups[pm].projects[projectKey].totalHours += parseFloat(row.hours) || 0;
        pmGroups[pm].totalHours += parseFloat(row.hours) || 0;
      });
    });

    return pmGroups;
  }
}