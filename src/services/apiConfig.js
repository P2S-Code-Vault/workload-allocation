const API_CONFIG = {
    // http://localhost:8000
    BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://p2s-wp-api-d6bhbbbzewd9gfc5.westus-01.azurewebsites.net/',   //https://p2s-wp-api-d6bhbbbzewd9gfc5.westus-01.azurewebsites.net/
    
    // API endpoints
    ENDPOINTS: {
      LOGIN: '/login',
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
      USERS_SAME_GROUP: '/users/same-group', // keep for future
      // Added endpoints from FastAPI main.py, now as functions for path params
      CONTACT_BY_ID: contactId => `/contacts/${contactId}`,
      CONTACTS: '/contacts',
      MILESTONES_ACTIVE_ALL: '/milestones/active-all',
      MILESTONES_PROJECT: projectNumber => `/milestones/project/${projectNumber}`,
      MILESTONE_BY_ID: milestoneId => `/milestones/${milestoneId}`,
      OPPORTUNITY_BY_NUMBER: opportunityNumber => `/opportunities/number/${opportunityNumber}`,
      OPPORTUNITIES: '/opportunities',
      OPPORTUNITY_BY_ID: opportunityId => `/opportunities/${opportunityId}`,
      MILESTONE_PROJECTIONS: '/milestone-projections',
      MILESTONE_PROJECTION_BY_ID: raId => `/milestone-projections/${raId}`,
      CONTACT_MILESTONE_PROJECTIONS: contactId => `/contacts/${contactId}/milestone-projections`,
      MILESTONE_PROJECTIONS_BATCH: '/milestone-projections/batch',
      OPPORTUNITY_PROJECTIONS: '/opportunity-projections',
      OPPORTUNITY_PROJECTION_BY_ID: raId => `/opportunity-projections/${raId}`,
      CONTACT_OPPORTUNITY_PROJECTIONS: contactId => `/contacts/${contactId}/opportunity-projections`,
      OPPORTUNITY_PROJECTIONS_BATCH: '/opportunity-projections/batch'
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