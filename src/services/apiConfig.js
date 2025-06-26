const API_CONFIG = {
    // http://localhost:8000
    BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://p2s-ra-api.azurewebsites.net',   //https://p2s-ra-api.azurewebsites.net
    
    // API endpoints
    ENDPOINTS: {
      LOGIN: '/login',
<<<<<<< Updated upstream
      MILESTONES: '/milestones',
      MILESTONE_SEARCH: '/milestones/search',
      ALLOCATIONS: '/allocations',
      LEADERSHIP_DATA: '/leadership/data',
      LEADERSHIP_LEADERS: '/leadership/leaders',
      PM_DASHBOARD: '/pm/dashboard',
      GL_TEAM_MEMBERS: '/gl/team-members',
      GL_TEAM_ALLOCATIONS: '/gl/team-allocations',
      GL_BATCH_UPDATE: '/gl/batch-update',
      GL_ALL_STAFF: '/gl/all-staff',
      USER_GROUP_INFO: '/users/group-info',
      USERS_BY_GROUP_MANAGER: '/users/by-group-manager',
      CONTACTS_SEARCH: '/contacts/search',
      USERS_SAME_GROUP: '/users/same-group'
=======
      CONTACT_BY_ID: contactId => `/contacts/${contactId}`,
      CONTACTS: '/contacts', // for GET /contacts?search=...&group_manager=...
      CONTACT_BY_EMAIL: email => `/contacts/email/${encodeURIComponent(email)}`,
      CONTACTS_SAME_GROUP: contactId => `/contacts/${contactId}/same-group`,
      CONTACTS_SAME_GROUP_BY_EMAIL: email => `/contacts/by-email/${encodeURIComponent(email)}/same-group`,      MILESTONES_ACTIVE_ALL: '/milestones/active-all',
      MILESTONES_PROJECT: projectNumber => `/milestones/project/${projectNumber}`,
      MILESTONES: '/milestones', // for GET /milestones?search=...&project_manager=...&active_only=...&limit=...
      MILESTONE_BY_ID: milestoneId => `/milestones/${milestoneId}`,
      OPPORTUNITY_BY_NUMBER: opportunityNumber => `/opportunities/number/${opportunityNumber}`,
      OPPORTUNITIES: '/opportunities', // for GET /opportunities?search=...&min_probability=...&champion_email=...&limit=...
      OPPORTUNITY_BY_ID: opportunityId => `/opportunities/${opportunityId}`,
      MILESTONE_PROJECTIONS: '/milestone-projections',
      MILESTONE_PROJECTION_BY_ID: raId => `/milestone-projections/${raId}`,
      CONTACT_MILESTONE_PROJECTIONS: contactId => `/contacts/${contactId}/milestone-projections`,
      MILESTONE_PROJECTIONS_BATCH: '/milestone-projections/batch',
      OPPORTUNITY_PROJECTIONS: '/opportunity-projections',
      OPPORTUNITY_PROJECTION_BY_ID: raId => `/opportunity-projections/${raId}`,
      CONTACT_OPPORTUNITY_PROJECTIONS: contactId => `/contacts/${contactId}/opportunity-projections`,
      OPPORTUNITY_PROJECTIONS_BATCH: '/opportunity-projections/batch',
      // GL endpoints
      GL_TEAM_MEMBERS: '/gl/team-members', // GET with group_manager_email query param
      GL_MILESTONES_QUARTERLY: '/gl/milestones/quarterly', // group_manager_email, year, quarter
      GL_OPPORTUNITIES_QUARTERLY: '/gl/opportunities/quarterly', // group_manager_email, year, quarter
      GL_MILESTONES_MONTHLY: '/gl/milestones/monthly', // group_manager_email, year, quarter
      GL_OPPORTUNITIES_MONTHLY: '/gl/opportunities/monthly', // group_manager_email, year, quarter
      GL_WORKLOAD_COMBINED: '/gl/workload/combined', // group_manager_email, year, quarter
      GL_WORKLOAD_BATCH_UPDATE: '/gl/workload/batch-update', // POST with group_manager_email
      GL_ACCESS_CHECK: '/gl/access-check', // GET with email
      // All-staff endpoints
      ALL_STAFF_WORKLOAD_QUARTERLY: '/all-staff/workload/quarterly', // year, quarter
      ALL_STAFF_PROJECTS_WORKLOAD_QUARTERLY: '/all-staff/projects/workload/quarterly', // year, quarter (new endpoint)
      ALL_STAFF_WORKLOAD_MONTHLY: '/all-staff/workload/monthly', // year, quarter
      ALL_STAFF_WORKLOAD_SUMMARY: '/all-staff/workload/summary', // year, quarter
      ALL_STAFF_WORKLOAD_MANAGER: managerName => `/all-staff/workload/manager/${encodeURIComponent(managerName)}`,
      ALL_STAFF_WORKLOAD_STUDIOS: '/all-staff/workload/studios', // year, quarter
      
      // User group projects endpoints
      CONTACTS_GROUP_PROJECTS_EXTENDED: email => `/contacts/by-email/${encodeURIComponent(email)}/group-projects/extended`, // include_user_projects param
      //scheduled hours endpoints
      CONTACT_MONTHLY_SCHEDULED_HOURS: contactId => `/contacts/${contactId}/scheduled-hours/monthly`,
      CONTACT_QUARTERLY_SCHEDULED_HOURS: contactId => `/contacts/${contactId}/scheduled-hours/quarterly`,
      CONTACT_MONTHLY_SCHEDULED_HOURS_BY_EMAIL: email => `/contacts/by-email/${encodeURIComponent(email)}/scheduled-hours/monthly`,
      CONTACT_QUARTERLY_SCHEDULED_HOURS_BY_EMAIL: email => `/contacts/by-email/${encodeURIComponent(email)}/scheduled-hours/quarterly`,
      CONTACT_SCHEDULED_HOURS_SUMMARY: contactId => `/contacts/${contactId}/scheduled-hours/summary`,
      
      // Project endpoints (replacing milestone endpoints for production workload)
      PROJECTS_ACTIVE_ALL: '/projects/active-all',
      PROJECTS_BY_NUMBER: projectNumber => `/projects/number/${projectNumber}`,
      PROJECTS_MANAGERS: '/projects/managers',
      PROJECTS: '/projects', // for GET /projects?search=...&project_manager=...&active_only=...&limit=...
      PROJECT_BY_ID: projectId => `/projects/${projectId}`,
      PROJECT_PROJECTIONS: '/project-projections',
      PROJECT_PROJECTION_BY_ID: raId => `/project-projections/${raId}`,
      CONTACT_PROJECT_PROJECTIONS: contactId => `/contacts/${contactId}/project-projections`,
      PROJECT_PROJECTIONS_BY_PROJECT: projectId => `/projects/${projectId}/projections`,
      PROJECT_PROJECTIONS_BATCH: '/project-projections/batch',
      
      // GL project endpoints (replacing milestone endpoints for production workload)
      GL_PROJECTS_QUARTERLY: '/gl/projects/quarterly', // group_manager_email, year, quarter
      GL_PROJECTS_MONTHLY: '/gl/projects/monthly', // group_manager_email, year, quarter
      GL_WORKLOAD_COMBINED_WITH_PROJECTS: '/gl/workload/combined-with-projects', // group_manager_email, year, quarter
      GL_WORKLOAD_BATCH_UPDATE_WITH_PROJECTS: '/gl/workload/batch-update-with-projects', // POST with group_manager_email
>>>>>>> Stashed changes
    },
    
    // HTTP status codes
    STATUS: {
      OK: 200,
      CREATED: 201,
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      NOT_FOUND: 404,
      SERVER_ERROR: 500
    }
  };
  
  export default API_CONFIG;