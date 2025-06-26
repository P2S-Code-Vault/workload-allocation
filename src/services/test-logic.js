// Test the WorkloadPreloadService logic with sample data
const sampleUserGroupData = {
  "user": {
    "contact_id": 56,
    "full_name": "Mckean, Wesley",
    "group_name": "01 SL G43 -00",
    "group_manager": "McKean, Wesley",
    "labor_category": "Design Engineer Grade 05",
    "is_group_manager": true,
    "email": "wes.mckean@p2sinc.com"
  },
  "group_projects": [
    {
      "project_id": "aBA1R000000Cm8IWAS",
      "project_name": "Huntington Park High School - MEPT and FP Design",
      "project_number": "2016-8269-0000",
      "project_manager": "Anglin, Kirk",
      "project_contract_labor": 2355394.58,
      "status": "Active"
    },
    {
      "project_id": "aBA1R000000TTaaWAG",
      "project_name": "SBCCD SBVC Tech Building Replacement",
      "project_number": "2019-0360-0000",
      "project_manager": "Anglin, Kirk", 
      "project_contract_labor": 1185578.26,
      "status": "Active"
    }
  ],
  "user_managed_projects": [
    {
      "project_id": "aBAUb0000000BwLOAU",
      "project_name": "LACC Security and Fencing",
      "project_number": "2024-0246-0000",
      "project_manager": "Mckean, Wesley",
      "project_contract_labor": 36000,
      "status": "Active"
    },
    {
      "project_id": "aBAUb0000000JnROAU",
      "project_name": "IYC Electrical Upgrades",
      "project_number": "2024-0502-0000",
      "project_manager": "Mckean, Wesley",
      "project_contract_labor": 40495.94,
      "status": "Active"
    }
  ]
};

// Simulate the logic
const userProjects = new Set();
const groupProjects = new Set();

// Add user's group projects and user-managed projects from the extended data
if (sampleUserGroupData.group_projects && Array.isArray(sampleUserGroupData.group_projects)) {
  sampleUserGroupData.group_projects.forEach(project => {
    groupProjects.add(project.project_number);
  });
}

// Add user's individual managed projects if available
if (sampleUserGroupData.user_managed_projects && Array.isArray(sampleUserGroupData.user_managed_projects)) {
  sampleUserGroupData.user_managed_projects.forEach(project => {
    userProjects.add(project.project_number);
  });
}

console.log(`Found ${userProjects.size} user projects:`, Array.from(userProjects));
console.log(`Found ${groupProjects.size} group projects:`, Array.from(groupProjects));

// Simulate creating project rows
const projectRows = [];

// Add user managed projects
sampleUserGroupData.user_managed_projects.forEach(project => {
  projectRows.push({
    projectNumber: project.project_number,
    projectName: project.project_name,
    pm: project.project_manager,
    type: 'user_managed'
  });
});

// Add group projects (filtered to avoid duplicates)
const groupProjectsToAdd = sampleUserGroupData.group_projects
  .filter(project => !userProjects.has(project.project_number));

groupProjectsToAdd.forEach(project => {
  projectRows.push({
    projectNumber: project.project_number,
    projectName: project.project_name,
    pm: project.project_manager,
    type: 'group'
  });
});

console.log(`Total project rows: ${projectRows.length}`);
console.log('Rows:', projectRows);
