/**
 * Utility functions for processing monthly and quarterly payload data from the backend
 */

/**
 * Normalize monthly workload data to a consistent format
 * @param {Object} rawData - Raw data from getAllStaffMonthlyWorkload API
 * @param {number} selectedMonthIndex - 0-based month index (0=first month, 1=second month, 2=third month)
 * @returns {Array} Normalized array of staff members with consistent structure
 */
export function normalizeMonthlyWorkloadData(rawData, selectedMonthIndex = 0) {
  console.log('Normalizing monthly workload data:', {
    rawData: rawData,
    selectedMonthIndex: selectedMonthIndex,
    hasManagers: !!rawData?.managers,
    managersCount: rawData?.managers ? Object.keys(rawData.managers).length : 0
  });
  
  if (!rawData) {
    console.warn('No raw data provided to normalize');
    return [];
  }

  const monthKey = `month${selectedMonthIndex + 1}`;
  const allStaffMembers = [];

  try {
    // Handle different possible data structures from backend
    
    // Structure 1: { managers: { "Manager Name": { monthlyData: { month1: [...], month2: [...] } } } }
    if (rawData.managers) {
      console.log('Processing managers structure with', Object.keys(rawData.managers).length, 'managers');
      Object.entries(rawData.managers).forEach(([managerName, managerData]) => {
        console.log(`Processing manager: ${managerName}`, {
          hasMonthlyData: !!managerData.monthlyData,
          hasStudios: !!managerData.studios,
          hasMembers: !!managerData.members
        });
        
        // Check for monthlyData structure first
        if (managerData.monthlyData && managerData.monthlyData[monthKey]) {
          console.log(`Found monthlyData for ${managerName} with ${managerData.monthlyData[monthKey].length} members`);
          managerData.monthlyData[monthKey].forEach(member => {
            allStaffMembers.push(normalizeMemberData(member, managerName));
          });
        }
        // Check for studios structure (new backend format)
        else if (managerData.studios) {
          console.log(`Found studios structure for ${managerName} with ${Object.keys(managerData.studios).length} studios`);
          Object.entries(managerData.studios).forEach(([studioName, studioData]) => {
            console.log(`Processing studio: ${studioName}`, {
              hasMembers: !!studioData.members,
              membersCount: studioData.members ? studioData.members.length : 0
            });
            if (studioData.members && Array.isArray(studioData.members)) {
              studioData.members.forEach(member => {
                // Include all members from studios, they should have the monthly data already normalized
                console.log(`Adding member: ${member.name} from ${studioName}`);
                allStaffMembers.push(normalizeMemberData(member, managerName, studioName));
              });
            }
          });
        }
        // Check if manager data has direct member arrays
        else if (managerData.members && Array.isArray(managerData.members)) {
          managerData.members.forEach(member => {
            allStaffMembers.push(normalizeMemberData(member, managerName));
          });
        }
      });
    }
    // Structure 2: { monthlyBreakdown: { month1: [...], month2: [...], month3: [...] } }
    else if (rawData.monthlyBreakdown && rawData.monthlyBreakdown[monthKey]) {
      rawData.monthlyBreakdown[monthKey].forEach(member => {
        allStaffMembers.push(normalizeMemberData(member));
      });
    }
    // Structure 3: { month1: [...], month2: [...], month3: [...] }
    else if (rawData[monthKey]) {
      rawData[monthKey].forEach(member => {
        allStaffMembers.push(normalizeMemberData(member));
      });
    }
    // Structure 4: Direct array of members
    else if (Array.isArray(rawData)) {
      rawData.forEach(member => {
        allStaffMembers.push(normalizeMemberData(member));
      });
    }
    // Structure 5: { data: [...] } wrapper
    else if (rawData.data && Array.isArray(rawData.data)) {
      rawData.data.forEach(member => {
        allStaffMembers.push(normalizeMemberData(member));
      });
    }
    // Structure 6: Single object (treat as array of one)
    else if (typeof rawData === 'object' && rawData.name) {
      allStaffMembers.push(normalizeMemberData(rawData));
    }

    console.log(`Normalized ${allStaffMembers.length} staff members for ${monthKey}`);
    return allStaffMembers;

  } catch (error) {
    console.error('Error normalizing monthly workload data:', error);
    return [];
  }
}


/**
 * Normalize individual member data to consistent format
 * @param {Object} member - Raw member data from backend
 * @param {string} groupManager - Group manager name (optional)
 * @param {string} studioName - Studio name (optional)
 * @returns {Object} Normalized member data
 */
function normalizeMemberData(member, groupManager = null, studioName = null) {
  const normalized = {
    // Basic info
    name: member.name || member.employee_name || '',
    email: member.email || member.employee_email || '',
    id: member.id || member.contact_id || member.email || '',
    
    // FIXED: Preserve contact_id for scheduled hours API
    contact_id: member.contact_id || member.contactId || member.id || null,
    contactId: member.contact_id || member.contactId || member.id || null, // Some code uses contactId
    
    // Group/organizational info
    group_manager: groupManager || member.group_manager || member.groupManager || member.group_leader || 'Unassigned',
    studio: studioName || member.studio || member.studioName || member.group_name || 'Unassigned',
    studio_leader: member.studio_leader || member.studioLeader || member.studio || 'Unassigned',
    labor_category: member.labor_category || member.laborCategory || member.title || '',
    discipline: member.discipline || '',
    
    // Hours data
    scheduled_hours: parseFloat(member.scheduled_hours || member.scheduledHours || 40) || 40,
    direct_hours: parseFloat(member.direct_hours || member.directHours || 0) || 0,
    pto_holiday_hours: parseFloat(member.pto_holiday_hours || member.ptoHours || member.pto_hours || 0) || 0,
    indirect_hours: parseFloat(member.indirect_hours || member.indirectHours || member.overhead_hours || 0) || 0,
    available_hours: parseFloat(member.available_hours || member.availableHours || 0) || 0,
    
    // Calculated fields
    total_hours: 0, // Will be calculated below
    ratio_b: 0, // Will be calculated below
    
    // Additional data
    rows: member.rows || []
  };

  // Calculate total hours (Direct + PTO + Indirect, but NOT Available)
  normalized.total_hours = normalized.direct_hours + normalized.pto_holiday_hours + normalized.indirect_hours;

  // Calculate Ratio B (Direct Hours / (Scheduled Hours - PTO Hours))
  const denominator = normalized.scheduled_hours - normalized.pto_holiday_hours;
  normalized.ratio_b = denominator > 0 ? normalized.direct_hours / denominator : 0;

  return normalized;
}

/**
 * Normalize quarterly workload data to a consistent format
 * @param {Object} rawData - Raw data from getAllStaffQuarterlyWorkload API
 * @returns {Array} Normalized array of staff members with consistent structure
 */
export function normalizeQuarterlyWorkloadData(rawData) {
  console.log('Normalizing quarterly workload data:', {
    rawData: rawData,
    hasManagers: !!rawData?.managers,
    managersCount: rawData?.managers ? Object.keys(rawData.managers).length : 0
  });
  
  if (!rawData) {
    console.warn('No raw data provided to normalize');
    return [];
  }

  const allStaffMembers = [];

  try {
    // Handle quarterly data structure: { managers: { "Manager Name": { studios: { "Studio Name": { members: [...] } } } } }
    if (rawData.managers) {
      console.log('Processing managers structure with', Object.keys(rawData.managers).length, 'managers');
      Object.entries(rawData.managers).forEach(([managerName, managerData]) => {
        console.log(`Processing manager: ${managerName}`, {
          hasStudios: !!managerData.studios,
          studiosCount: managerData.studios ? Object.keys(managerData.studios).length : 0,
          memberCount: managerData.memberCount,
          groupNo: managerData.groupNo
        });
        
        // Process studios structure for quarterly data
        if (managerData.studios) {
          Object.entries(managerData.studios).forEach(([studioName, studioData]) => {
            console.log(`Processing studio: ${studioName}`, {
              hasMembers: !!studioData.members,
              membersCount: studioData.members ? studioData.members.length : 0,
              studioLeader: studioData.studioLeader
            });
            if (studioData.members && Array.isArray(studioData.members)) {
              studioData.members.forEach(member => {
                // Normalize quarterly member data
                console.log(`Adding member: ${member.name} from ${studioName}`);
                allStaffMembers.push(normalizeQuarterlyMemberData(member, managerName, studioName, managerData.groupNo));
              });
            }
          });
        }
      });
    }

    console.log(`Normalized ${allStaffMembers.length} staff members from quarterly data`);
    return allStaffMembers;

  } catch (error) {
    console.error('Error normalizing quarterly workload data:', error);
    return [];
  }
}

/**
 * Normalize individual quarterly member data to consistent format
 * @param {Object} member - Raw member data from quarterly backend
 * @param {string} groupManager - Group manager name
 * @param {string} studioName - Studio name
 * @param {number} groupNo - Group number
 * @returns {Object} Normalized member data
 */
function normalizeQuarterlyMemberData(member, groupManager, studioName, groupNo) {
  const normalized = {
    // Basic info
    name: member.name || '',
    email: member.email || '',
    id: member.contactId || member.email || '',
    
    // Contact ID fields for scheduled hours API
    contact_id: member.contactId || null,
    contactId: member.contactId || null,
    
    // Group/organizational info
    group_manager: groupManager || 'Unassigned',
    studio: studioName || 'Unassigned',
    studio_leader: member.studioLeader || 'Unassigned',
    labor_category: member.laborCategory || '',
    discipline: member.discipline || '',
    groupNo: groupNo,
    
    // Quarterly hours data - map from quarterly response fields
    scheduled_hours: parseFloat(member.weeklyScheduledHours || member.quarterlyScheduledHours / 13 || 40) || 40,
    direct_hours: parseFloat(member.directHours || 0) || 0,
    pto_holiday_hours: parseFloat(member.ptoHours || 0) || 0,
    indirect_hours: parseFloat(member.overheadHours || 0) || 0,
    available_hours: parseFloat(member.availableHours || 0) || 0,
    
    // Quarterly totals
    quarterlyScheduledHours: parseFloat(member.quarterlyScheduledHours || 0) || 0,
    totalQuarterHours: parseFloat(member.totalQuarterHours || 0) || 0,
    utilization: parseFloat(member.utilization || 0) || 0,
    
    // Additional data
    isGroupManager: member.isGroupManager || false,
    projectProjections: member.projectProjections || []
  };

  // Calculate total hours and ratio
  normalized.total_hours = normalized.direct_hours + normalized.pto_holiday_hours + normalized.indirect_hours;
  normalized.ratio_b = calculateRatioB(normalized.direct_hours, normalized.scheduled_hours, normalized.pto_holiday_hours);

  return normalized;
}

/**
 * Group staff members by their group manager
 * @param {Array} staffMembers - Array of normalized staff members
 * @returns {Object} Staff members grouped by manager
 */
export function groupStaffByManager(staffMembers) {
  return staffMembers.reduce((acc, member) => {
    const manager = member.group_manager || 'Unassigned';
    if (!acc[manager]) {
      acc[manager] = [];
    }
    acc[manager].push(member);
    return acc;
  }, {});
}

/**
 * Calculate summary statistics for a group of staff members
 * @param {Array} members - Array of staff members
 * @returns {Object} Summary statistics
 */
export function calculateGroupSummary(members) {
  if (!members || members.length === 0) {
    return {
      memberCount: 0,
      scheduled_hours: 0,
      direct_hours: 0,
      pto_holiday_hours: 0,
      indirect_hours: 0,
      available_hours: 0,
      total_hours: 0,
      ratio_b: 0
    };
  }

  const summary = members.reduce((acc, member) => {
    acc.scheduled_hours += member.scheduled_hours || 0;
    acc.direct_hours += member.direct_hours || 0;
    acc.pto_holiday_hours += member.pto_holiday_hours || 0;
    acc.indirect_hours += member.indirect_hours || 0;
    acc.available_hours += member.available_hours || 0;
    acc.total_hours += member.total_hours || 0;
    acc.ratio_b += member.ratio_b || 0;
    return acc;
  }, {
    scheduled_hours: 0,
    direct_hours: 0,
    pto_holiday_hours: 0,
    indirect_hours: 0,
    available_hours: 0,
    total_hours: 0,
    ratio_b: 0
  });

  // Average ratio_b for the group
  summary.ratio_b = members.length > 0 ? summary.ratio_b / members.length : 0;
  summary.memberCount = members.length;

  return summary;
}

/**
 * Validate that the monthly data has the expected structure
 * @param {Object} data - Raw data from backend
 * @returns {Object} Validation result with isValid flag and errors
 */
export function validateMonthlyData(data) {
  const result = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!data) {
    result.isValid = false;
    result.errors.push('No data provided');
    return result;
  }

  if (typeof data !== 'object') {
    result.isValid = false;
    result.errors.push('Data is not an object');
    return result;
  }

  // Check for expected structures
  const hasManagers = data.managers && typeof data.managers === 'object';
  const hasMonthKeys = data.month1 || data.month2 || data.month3;
  const isArray = Array.isArray(data);
  const hasDataArray = data.data && Array.isArray(data.data);

  if (!hasManagers && !hasMonthKeys && !isArray && !hasDataArray) {
    result.warnings.push('Data structure does not match any expected format');
  }

  // Check for expected months
  if (data.expected_months && !Array.isArray(data.expected_months)) {
    result.warnings.push('expected_months should be an array');
  }

  return result;
}

/**
 * Calculate Ratio B for a member
 * @param {number} directHours - Direct hours
 * @param {number} scheduledHours - Scheduled hours
 * @param {number} ptoHours - PTO hours
 * @returns {number} Calculated Ratio B
 */
function calculateRatioB(directHours, scheduledHours, ptoHours) {
  const denominator = scheduledHours - ptoHours;
  return denominator > 0 ? directHours / denominator : 0;
}