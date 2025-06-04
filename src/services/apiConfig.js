const API_CONFIG = {
    // http://localhost:8000
    BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://p2s-wp-api-d6bhbbbzewd9gfc5.westus-01.azurewebsites.net/',   //https://p2s-ra-api.azurewebsites.net
    
    // API endpoints
    ENDPOINTS: {
      LOGIN: '/login',
      CONTACT_BY_ID: contactId => `/contacts/${contactId}`,
      CONTACTS: '/contacts', // for GET /contacts?search=...&group_manager=...
      CONTACT_BY_EMAIL: email => `/contacts/email/${encodeURIComponent(email)}`,
      CONTACTS_SAME_GROUP: contactId => `/contacts/${contactId}/same-group`,
      CONTACTS_SAME_GROUP_BY_EMAIL: email => `/contacts/by-email/${encodeURIComponent(email)}/same-group`,
      MILESTONES_ACTIVE_ALL: '/milestones/active-all',
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
      ALL_STAFF_WORKLOAD_MONTHLY: '/all-staff/workload/monthly', // year, quarter
      ALL_STAFF_WORKLOAD_SUMMARY: '/all-staff/workload/summary', // year, quarter
      ALL_STAFF_WORKLOAD_MANAGER: managerName => `/all-staff/workload/manager/${encodeURIComponent(managerName)}`,
      ALL_STAFF_WORKLOAD_STUDIOS: '/all-staff/workload/studios', // year, quarter
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