import Papa from 'papaparse';

export class GLDataService {
  static groupByResource(data) {
    const grouped = {};
    
    data.forEach(row => {
      const resource = row.resource || 'Unassigned';
      if (!grouped[resource]) {
        grouped[resource] = {
          name: resource,
          rows: [],
          totalHours: 0
        };
      }
      
      grouped[resource].rows.push(row);
      grouped[resource].totalHours += parseFloat(row.hours) || 0;
    });
    
    // Sort the groups alphabetically by resource name
    return Object.fromEntries(
      Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
    );
  }

  static groupByStudio(data) {
    const studioGroups = {};
    
    Object.entries(data).forEach(([resource, resourceData]) => {
      const studio = resourceData.studio || 'Unassigned';
      
      if (!studioGroups[studio]) {
        studioGroups[studio] = {
          name: studio,
          resources: {},
          totalHours: 0
        };
      }
      
      studioGroups[studio].resources[resource] = resourceData;
      studioGroups[studio].totalHours += resourceData.totalHours;
    });
    
    // Sort studios alphabetically
    return Object.fromEntries(
      Object.entries(studioGroups).sort(([a], [b]) => a.localeCompare(b))
    );
  }

  static async loadGLData() {
    try {
      const possiblePaths = [
        '/RA_Summary.csv',
        './RA_Summary.csv',
        process.env.PUBLIC_URL + '/RA_Summary.csv',
        '../public/RA_Summary.csv'
      ];

      let response;
      let usedPath;

      for (const path of possiblePaths) {
        try {
          console.log('Attempting to load GL data from:', path);
          response = await fetch(path);
          if (response.ok) {
            usedPath = path;
            break;
          }
        } catch (e) {
          console.log('Failed to load from path:', path, e);
        }
      }

      if (!response || !response.ok) {
        throw new Error('Failed to load RA_Summary.csv from all paths');
      }

      console.log('Successfully loaded GL data from:', usedPath);
      const csvText = await response.text();

      if (!csvText || csvText.trim() === '') {
        throw new Error('RA_Summary.csv file is empty');
      }
      
      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              console.error('CSV parsing errors:', results.errors);
              reject(new Error('CSV parsing failed'));
              return;
            }

            // Debug log to verify column indices
            console.log('First row data:', results.data[0]);
            console.log('Second row data:', results.data[1]);

            const mappedData = results.data
              .slice(1) // Skip header row
              .map(row => {
                let hours = parseFloat(row[9]) || 0;
                return {
                  resource: row[1] || '',
                  projectNumber: row[2] || '',
                  projectName: row[3] || '',
                  pm: row[5] || 'Unassigned',         
                  labor: parseFloat(row[6]) || 0,
                  pctLaborUsed: parseFloat(row[7]) || 0,
                  actualMultiplierRate: row[8] || '',
                  hours: hours,
                  group: row[10] || 'Unassigned',
                  scheduledHours: parseFloat(row[11]) || 40,
                  studio: row[12] || 'Unassigned'
                };
              })
              .filter(row => row.resource);

            console.log('Sample mapped data:', mappedData.slice(0, 2));
            
            const grouped = {};
            mappedData.forEach(row => {
              const resource = row.resource;
              if (!grouped[resource]) {
                grouped[resource] = {
                  name: resource,
                  rows: [],
                  totalHours: 0,
                  scheduledHours: row.scheduledHours,
                  studio: row.studio 
                };
              }
              grouped[resource].rows.push(row);
              grouped[resource].totalHours += row.hours;
            });

            const sortedGroups = Object.fromEntries(
              Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
            );

            resolve(sortedGroups);
          },
          error: (error) => {
            console.error('Papa Parse error:', error);
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('Error in loadGLData:', error);
      throw error;
    }
  }

  static groupProjectsByStudio(data) {
    const studioGroups = {};
    
    // First, collect all projects under each studio leader
    Object.entries(data).forEach(([resource, resourceData]) => {
      const studioLeaderName = resourceData.studioLeaderName || 'Unassigned';
      
      if (!studioGroups[studioLeaderName]) {
        studioGroups[studioLeaderName] = {
          name: studioLeaderName,
          projects: {},
          totalHours: 0
        };
      }
      
      // Group hours by project within each studio
      resourceData.rows.forEach(row => {
        const projectKey = row.projectNumber;
        if (!studioGroups[studioLeaderName].projects[projectKey]) {
          studioGroups[studioLeaderName].projects[projectKey] = {
            projectNumber: row.projectNumber,
            projectName: row.projectName,
            pm: row.pm,
            labor: row.labor,
            pctLaborUsed: row.pctLaborUsed,
            actualMultiplierRate: row.actualMultiplierRate,
            hours: 0
          };
        }
        studioGroups[studioLeaderName].projects[projectKey].hours += parseFloat(row.hours) || 0;
        studioGroups[studioLeaderName].totalHours += parseFloat(row.hours) || 0;
      });
    });
    
    // Sort studios alphabetically
    return Object.fromEntries(
      Object.entries(studioGroups).sort(([a], [b]) => a.localeCompare(b))
    );
  }
}