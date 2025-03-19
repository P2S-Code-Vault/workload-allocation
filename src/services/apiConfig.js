const API_CONFIG = {
    // base url
    BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
    
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
      GL_BATCH_UPDATE: '/gl/batch-update'
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