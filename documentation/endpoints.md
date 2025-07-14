# Backend API Endpoints Documentation

## Overview
The Workload Projection Tool API is a FastAPI-based REST service that manages workload projections for milestones, opportunities, and projects. The API provides comprehensive endpoints for user authentication, data management, and reporting across multiple organizational levels.

**Base URL**: `https://p2s-wp-api-d6bhbbbzewd9gfc5.westus-01.azurewebsites.net/`
**API Version**: 1.0.0
**OpenAPI Version**: 3.1.0

## Authentication

### POST `/login`
User authentication endpoint that validates email and returns user details.

**Request Body:**
```json
{
  "email": "user@company.com"
}
```

**Response:**
```json
{
  "contact_id": 123,
  "name": "John Doe",
  "email": "user@company.com",
  "title": "Senior Engineer",
  "labor_category": "Engineering",
  "scheduled_hours": 40.0,
  "group_manager": "Jane Smith",
  "GroupName": "Engineering Team",
  "is_group_manager": false
}
```

## Contact Management

### GET `/contacts`
Search for contacts by name, email, or group manager.

**Query Parameters:**
- `search` (optional): Search term for name or email
- `group_manager` (optional): Filter by group manager name

**Response:** Array of contact objects

### GET `/contacts/{contact_id}`
Get a specific contact by ID.

**Path Parameters:**
- `contact_id`: Integer contact identifier

### GET `/contacts/email/{email}`
Get contact information by email address.

**Path Parameters:**
- `email`: URL-encoded email address

### GET `/contacts/{contact_id}/same-group`
Get all contacts from the same group as the specified contact.

### GET `/contacts/by-email/{email}/same-group`
Get all contacts from the same group as the specified email.

## Milestone Management

### GET `/milestones/active-all`
Retrieve all active milestones across the organization.

**Response:** Array of milestone objects with project information

### GET `/milestones/project/{project_number}`
Get milestones for a specific project.

**Path Parameters:**
- `project_number`: Project number identifier

### GET `/milestones`
Search milestones with filtering options.

**Query Parameters:**
- `search` (optional): Search in project number, name, or milestone name
- `project_manager` (optional): Filter by project manager
- `active_only` (boolean, default: true): Include only active milestones
- `limit` (integer, default: 10): Maximum results to return

### GET `/milestones/{milestone_id}`
Get a specific milestone by ID.

## Opportunity Management

### GET `/opportunities/all-opportunities`
Get all opportunities with optional filtering.

**Query Parameters:**
- `proposal_champion` (optional): Filter by proposal champion

**Response:**
```json
{
  "opportunities": [
    {
      "opportunity_id": 456,
      "opportunity_number": "OP-2025-001",
      "opportunity_name": "New Client Engagement",
      "estimated_fee_proposed": 150000.0,
      "probability": 75,
      "proposal_champion": "John Smith",
      "champion_email": "john.smith@company.com"
    }
  ],
  "summary": {
    "total_opportunities": 25,
    "total_estimated_value": 2500000.0
  }
}
```

### GET `/opportunities/number/{opportunity_number}`
Get opportunity by opportunity number.

### GET `/opportunities`
Search opportunities with filtering.

**Query Parameters:**
- `search` (optional): Search term
- `min_probability` (integer, default: 50): Minimum probability threshold
- `champion_email` (optional): Filter by champion email
- `limit` (integer, default: 10): Maximum results

### GET `/opportunities/{opportunity_id}`
Get a specific opportunity by ID.

**Path Parameters:**
- `opportunity_id`: Integer opportunity identifier

## Project Management

### GET `/projects/active-all`
Get all active projects.

### GET `/projects/number/{project_number}`
Get project by project number.

### GET `/projects/managers`
Get list of all project managers.

**Response:**
```json
{
  "project_managers": [
    "Alice Johnson",
    "Bob Wilson",
    "Carol Davis"
  ]
}
```

### GET `/projects/with-milestones`
Get projects with their associated milestones using optional filters.

**Query Parameters:**
- `status` (default: "Active"): Project status filter
- `project_manager` (optional): Filter by project manager
- `include_empty` (boolean, default: true): Include projects without milestones

**Response:**
```json
{
  "projects": [
    {
      "project": {
        "projectId": "PRJ-001",
        "projectName": "Website Redesign",
        "projectNumber": "2025-001",
        "projectManager": "Alice Johnson",
        "projectContractLabor": 50000.0,
        "status": "Active"
      },
      "milestones": [
        {
          "milestoneId": 123,
          "milestoneName": "Design Phase",
          "contractLabor": 15000.0,
          "milestoneStatus": "Active"
        }
      ]
    }
  ],
  "summary": {
    "total_projects": 15,
    "total_milestones": 45,
    "total_contract_value": 750000.0
  }
}
```

### GET `/projects/{project_id}`
Get a specific project by ID.

**Path Parameters:**
- `project_id`: Project identifier

### GET `/projects`
Search for projects by project number, project name, or project manager.

**Query Parameters:**
- `search` (optional): Search term for project number, name, or manager
- `project_manager` (optional): Filter by project manager
- `active_only` (boolean, default: true): Include only active projects
- `limit` (integer, default: 10): Maximum results to return

## Workload Projections

### Milestone Projections

#### POST `/milestone-projections`
Create a new milestone projection.

**Request Body:**
```json
{
  "email": "user@company.com",
  "milestone_id": 123,
  "quarter": "Q1",
  "year": 2025,
  "month": 1,
  "month1": 1,
  "month2": 2,
  "month_hours": 40.0,
  "month_hours1": 35.0,
  "month_hours2": 30.0,
  "remarks": "Initial planning phase"
}
```

#### PUT `/milestone-projections/{ra_id}`
Update an existing milestone projection.

#### DELETE `/milestone-projections/{ra_id}`
Delete a milestone projection.

#### GET `/milestone-projections/{ra_id}`
Get a specific milestone projection.

#### POST `/milestone-projections/batch`
Batch update multiple milestone projections.

**Request Body:**
```json
{
  "allocations": [
    {
      "ra_id": 1,
      "month_hours": 40.0,
      "month_hours1": 35.0,
      "month_hours2": 30.0,
      "remarks": "Updated allocation"
    }
  ]
}
```

### Opportunity Projections

#### POST `/opportunity-projections`
Create a new opportunity projection.

#### PUT `/opportunity-projections/{ra_id}`
Update an existing opportunity projection.

#### DELETE `/opportunity-projections/{ra_id}`
Delete an opportunity projection.

#### POST `/opportunity-projections/batch`
Batch update multiple opportunity projections.

### Project Projections

#### POST `/project-projections`
Create a new project projection.

#### PUT `/project-projections/{ra_id}`
Update an existing project projection.

#### POST `/project-projections/batch`
Batch update multiple project projections.

### Contact Projections

### GET `/contacts/{contact_id}/milestone-projections`
Get all milestone projections for a contact.

**Path Parameters:**
- `contact_id`: Contact ID

**Query Parameters:**
- `year` (optional): Year filter
- `quarter` (optional): Quarter filter

### GET `/contacts/{contact_id}/opportunity-projections`
Get all opportunity projections for a contact.

**Path Parameters:**
- `contact_id`: Contact ID

**Query Parameters:**
- `year` (optional): Year filter
- `quarter` (optional): Quarter filter

### GET `/contacts/{contact_id}/project-projections`
Get all project projections for a contact.

**Path Parameters:**
- `contact_id`: Contact ID

**Query Parameters:**
- `year` (optional): Year filter
- `quarter` (optional): Quarter filter

## Group Leader (GL) Endpoints

### GET `/gl/team-members`
Get all team members for a specific group manager.

**Query Parameters:**
- `group_manager_email` (required): Group manager's email

### GET `/gl/milestones/quarterly`
Get quarterly milestone allocations for a team.

**Query Parameters:**
- `group_manager_email` (required): Group manager's email
- `year` (required): Year (e.g., 2025)
- `quarter` (required): Quarter (Q1, Q2, Q3, Q4)

### GET `/gl/milestones/monthly`
Get monthly milestone allocation breakdown for a quarter.

**Query Parameters:**
- `group_manager_email` (required): Group manager's email
- `year` (required): Year
- `quarter` (required): Quarter

### GET `/gl/opportunities/quarterly`
Get quarterly opportunity allocations for a team.

### GET `/gl/opportunities/monthly`
Get monthly opportunity allocation breakdown.

### GET `/gl/workload/combined`
Get combined workload data (milestones + opportunities) for all team members.

**Response Structure:**
```json
{
  "team_members": [
    {
      "contact_id": 123,
      "name": "John Doe",
      "email": "john.doe@company.com",
      "labor_category": "Senior Engineer",
      "scheduled_hours": 40.0,
      "milestones": [
        {
          "project_name": "Website Redesign",
          "milestone_name": "Design Phase",
          "month_hours": 20.0,
          "month_hours1": 18.0,
          "month_hours2": 15.0
        }
      ],
      "opportunities": [
        {
          "opportunity_name": "New Client",
          "month_hours": 10.0,
          "month_hours1": 12.0,
          "month_hours2": 15.0
        }
      ]
    }
  ],
  "summary": {
    "total_team_members": 8,
    "total_allocated_hours": 480.0,
    "average_utilization": 0.75
  }
}
```

### POST `/gl/workload/batch-update`
Batch update workload projections for team members.

**Query Parameters:**
- `group_manager_email` (required): For authorization

**Request Body:**
```json
{
  "milestone_updates": [
    {
      "ra_id": 1,
      "month_hours": 25.0,
      "month_hours1": 20.0,
      "month_hours2": 18.0
    }
  ],
  "opportunity_updates": [
    {
      "ra_id": 2,
      "month_hours": 15.0,
      "month_hours1": 12.0,
      "month_hours2": 10.0
    }
  ]
}
```

### GET `/gl/access-check`
Check if a user has group leader access.

**Query Parameters:**
- `email` (required): User's email address

## All Staff Reporting

### GET `/all-staff/workload/quarterly`
Get quarterly workload data for all staff members.

**Query Parameters:**
- `year` (required): Year
- `quarter` (required): Quarter

**Response:**
```json
{
  "managers": {
    "Alice Johnson": {
      "studios": {
        "Engineering Studio A": {
          "members": [
            {
              "contactId": 123,
              "name": "John Doe",
              "utilization": 0.85,
              "directHours": 340.0,
              "availableHours": 60.0
            }
          ],
          "utilization": 0.82
        }
      },
      "utilization": 0.78
    }
  },
  "companyTotals": {
    "totalScheduledHours": 12000.0,
    "totalDirectHours": 9600.0,
    "utilization": 0.80,
    "memberCount": 150
  }
}
```

### GET `/all-staff/workload/monthly`
Get monthly workload breakdown for all staff.

### GET `/all-staff/workload/summary`
Get simplified workload summary for dashboards.

### GET `/all-staff/workload/manager/{manager_name}`
Get detailed workload data for a specific manager's team.

### GET `/all-staff/workload/studios`
Get summary of all studios across all managers.

## Scheduled Hours Management

### GET `/contacts/{contact_id}/scheduled-hours/monthly`
Get monthly scheduled hours for a contact.

**Query Parameters:**
- `year` (required): Year
- `month` (required): Month (1-12)

### GET `/contacts/{contact_id}/scheduled-hours/quarterly`
Get quarterly scheduled hours for a contact.

**Query Parameters:**
- `year` (required): Year
- `quarter` (required): Quarter

**Response:**
```json
{
  "contact_id": 123,
  "name": "John Doe",
  "email": "john.doe@company.com",
  "year": 2025,
  "quarter": "Q1",
  "month1": {
    "month_number": 1,
    "working_days": 21,
    "scheduled_hours": 168.0
  },
  "month2": {
    "month_number": 2,
    "working_days": 20,
    "scheduled_hours": 160.0
  },
  "month3": {
    "month_number": 3,
    "working_days": 22,
    "scheduled_hours": 176.0
  },
  "total_scheduled_hours": 504.0,
  "total_working_days": 63
}
```

### GET `/contacts/by-email/{email}/scheduled-hours/quarterly`
Get quarterly scheduled hours by email address.

### GET `/contacts/{contact_id}/scheduled-hours/summary`
Get a summary of scheduled hours for all quarters in a year.

**Path Parameters:**
- `contact_id`: Contact ID

**Query Parameters:**
- `year` (required): Year

## Project Management Endpoints

### GET `/projects/all-with-milestones`
Get all projects with their associated milestones in a single efficient query.

**Response:**
```json
{
  "projects": [
    {
      "project": {
        "projectId": "PRJ-001",
        "projectName": "Website Redesign",
        "projectNumber": "2025-001"
      },
      "milestones": [
        {
          "milestoneId": 123,
          "milestoneName": "Design Phase"
        }
      ]
    }
  ],
  "summary": {
    "total_projects": 15,
    "total_milestones": 45
  }
}
```

### GET `/projects/by-status/{status}/with-milestones`
Get projects with milestones filtered by specific status.

**Path Parameters:**
- `status`: Project status (e.g., "Active", "Completed", "On Hold")

### GET `/projects/by-manager/{project_manager}/with-milestones`
Get projects with milestones for a specific project manager.

**Path Parameters:**
- `project_manager`: Project manager name

### GET `/projects/with-milestones/summary`
Get a quick summary of projects and milestones without full data.

### GET `/projects/with-milestones/counts`
Get quick counts of projects and milestones for dashboard widgets.

### GET `/projects/{project_id}/projections`
Get all projections for a specific project.

**Path Parameters:**
- `project_id`: Project ID

**Query Parameters:**
- `year` (optional): Year filter
- `quarter` (optional): Quarter filter

## PM Dashboard Endpoints

### GET `/workload/pm/dashboard`
Get PM dashboard data filtered by quarter/year/PM.

**Query Parameters:**
- `quarter` (optional): Quarter (Q1, Q2, Q3, Q4)
- `year` (optional): Year (2020-2030)
- `month` (optional): Month (1-12) for monthly view
- `pm_name` (optional): Project Manager name filter

### GET `/workload/pm/project-managers`
Get list of project managers for filtering.

### GET `/workload/pm/projects/dashboard`
Get project-based PM dashboard (from ContactProjects table).

### GET `/workload/pm/opportunities/dashboard`
Get opportunities-based PM dashboard.

**Query Parameters:**
- `quarter` (optional): Quarter filter
- `year` (optional): Year filter
- `champion_name` (optional): Proposal Champion filter

### GET `/workload/pm/opportunities/proposal-champions`
Get list of proposal champions for filtering.

## Group and Recommendation Endpoints

### GET `/contacts/by-email/{email}/group-projects`
Get projects managed by PMs in the same group as the user.

### GET `/contacts/by-email/{email}/group-opportunities`
Get opportunities managed by champions in the same group as the user.

### GET `/contacts/by-email/{email}/recommended-projects`
Get recommended projects for a user based on group membership.

**Query Parameters:**
- `limit` (1-100, default: 20): Maximum projects to return

### GET `/contacts/by-email/{email}/recommended-opportunities`
Get recommended opportunities for a user.

### GET `/contacts/by-email/{email}/group-resources`
Get combined group resources (projects and opportunities).

**Query Parameters:**
- `include_projects` (boolean, default: true): Include projects
- `include_opportunities` (boolean, default: true): Include opportunities
- `limit_per_type` (1-50, default: 10): Max items per type

### GET `/contacts/by-email/{email}/scheduled-hours/monthly`
Get monthly scheduled hours by email address.

**Path Parameters:**
- `email`: Contact email address

**Query Parameters:**
- `year` (required): Year
- `month` (required): Month (1-12)

## Enhanced PM Dashboard Endpoints

### GET `/workload/pm/projects/managers`
Get list of project managers from Projects table for filtering.

### GET `/workload/pm/projects/by-manager/{pm_name}`
Get all projects managed by a specific project manager.

**Path Parameters:**
- `pm_name`: Project manager name

### GET `/workload/pm/projects/{project_id}/summary`
Get detailed workload summary for a specific project.

**Path Parameters:**
- `project_id`: Project ID

**Query Parameters:**
- `quarter` (optional): Quarter filter
- `year` (optional): Year filter

### GET `/workload/pm/projects/dashboard/export`
Export PM Projects dashboard data in JSON or CSV format.

**Query Parameters:**
- `quarter` (optional): Quarter
- `year` (optional): Year
- `month` (optional): Month filter
- `pm_name` (optional): PM name filter
- `format` (optional): Export format (json or csv, default: json)

### GET `/workload/pm/projects/dashboard/comparison`
Compare PM Projects dashboard data between two quarters.

**Query Parameters:**
- `base_quarter` (required): Base quarter for comparison
- `base_year` (required): Base year for comparison
- `compare_quarter` (required): Comparison quarter
- `compare_year` (required): Comparison year
- `pm_name` (optional): PM name filter

### GET `/workload/pm/projects/stats`
Get statistical overview of PM Projects workload data.

**Query Parameters:**
- `year` (optional): Year filter
- `pm_name` (optional): PM name filter

## Opportunities Dashboard Endpoints

### GET `/workload/opportunities/dashboard`
Get opportunities-based dashboard data.

**Query Parameters:**
- `quarter` (optional): Quarter (Q1, Q2, Q3, Q4)
- `year` (optional): Year
- `month` (optional): Month (1-12) for monthly view
- `champion_name` (optional): Proposal Champion name filter

### GET `/workload/opportunities/champions`
Get list of proposal champions for filtering.

## Enhanced Opportunities Dashboard Endpoints

### GET `/workload/pm/opportunities/by-champion/{champion_name}`
Get all opportunities managed by a specific proposal champion.

**Path Parameters:**
- `champion_name`: Proposal champion name

### GET `/workload/pm/opportunities/{opportunity_id}/summary`
Get detailed workload summary for a specific opportunity.

**Path Parameters:**
- `opportunity_id`: Opportunity ID

**Query Parameters:**
- `quarter` (optional): Quarter filter
- `year` (optional): Year filter

### GET `/workload/pm/opportunities/dashboard/export`
Export PM Opportunities dashboard data in JSON or CSV format.

**Query Parameters:**
- `quarter` (optional): Quarter
- `year` (optional): Year
- `month` (optional): Month filter
- `champion_name` (optional): Champion name filter
- `format` (optional): Export format (json or csv, default: json)

### GET `/workload/pm/opportunities/stats`
Get statistical overview of PM Opportunities workload data.

**Query Parameters:**
- `year` (optional): Year filter
- `champion_name` (optional): Champion name filter

## Enhanced Group Leader Endpoints

### GET `/gl/projects/quarterly`
Get quarterly project allocation for all team members under a group manager.

**Query Parameters:**
- `group_manager_email` (required): Group manager's email
- `year` (required): Year
- `quarter` (required): Quarter

### GET `/gl/projects/monthly`
Get monthly project allocation breakdown for a quarter for all team members.

**Query Parameters:**
- `group_manager_email` (required): Group manager's email
- `year` (required): Year
- `quarter` (required): Quarter

### GET `/gl/workload/combined-with-projects`
Get combined workload data (milestones + opportunities + projects) for all team members.

**Query Parameters:**
- `group_manager_email` (required): Group manager's email
- `year` (required): Year
- `quarter` (required): Quarter

### POST `/gl/workload/batch-update-with-projects`
Batch update workload projections (milestones, opportunities, and projects) for team members.

**Query Parameters:**
- `group_manager_email` (required): For authorization

**Request Body:**
```json
{
  "milestone_updates": [
    {
      "ra_id": 1,
      "month_hours": 25.0,
      "month_hours1": 20.0,
      "month_hours2": 18.0
    }
  ],
  "opportunity_updates": [
    {
      "ra_id": 2,
      "month_hours": 15.0,
      "month_hours1": 12.0,
      "month_hours2": 10.0
    }
  ],
  "project_updates": [
    {
      "ra_id": 3,
      "month_hours": 20.0,
      "month_hours1": 18.0,
      "month_hours2": 16.0
    }
  ]
}
```

## Enhanced All Staff Reporting

### GET `/all-staff/projects/workload/quarterly`
Get quarterly project workload data for all staff members from ContactProjects table.

**Query Parameters:**
- `year` (required): Year
- `quarter` (required): Quarter

### GET `/all-staff/projects/workload/monthly`
Get monthly project workload breakdown for all staff members from ContactProjects table.

**Query Parameters:**
- `year` (required): Year
- `quarter` (required): Quarter

## Extended Group and Recommendation Endpoints

### GET `/contacts/by-email/{email}/group-info`
Get group information for a user including group members and their roles.

**Path Parameters:**
- `email`: User's email address

### GET `/contacts/by-email/{email}/group-projects/extended`
Get extended group project information including group members and project details.

**Path Parameters:**
- `email`: User's email address

**Query Parameters:**
- `include_user_projects` (boolean, default: true): Include projects managed by the user

### GET `/contacts/by-email/{email}/group-opportunities/extended`
Get extended group opportunity information including group members and opportunity details.

**Path Parameters:**
- `email`: User's email address

**Query Parameters:**
- `include_user_opportunities` (boolean, default: true): Include opportunities managed by the user

### GET `/contacts/by-email/{email}/recommended-resources`
Get recommended resources (projects and opportunities) for a user with priority scoring.

**Path Parameters:**
- `email`: User's email address

**Query Parameters:**
- `include_projects` (boolean, default: true): Include projects
- `include_opportunities` (boolean, default: true): Include opportunities
- `limit` (1-100, default: 20): Maximum total resources to return

### GET `/contacts/{contact_id}/group-projects`
Get projects managed by project managers in the same group as the contact.

**Path Parameters:**
- `contact_id`: Contact ID

### GET `/contacts/{contact_id}/group-opportunities`
Get opportunities managed by proposal champions in the same group as the contact.

**Path Parameters:**
- `contact_id`: Contact ID

### GET `/groups/{group_name}/projects`
Get all projects managed by members of a specific group.

**Path Parameters:**
- `group_name`: Name of the group

### GET `/groups/{group_name}/opportunities`
Get all opportunities managed by members of a specific group.

**Path Parameters:**
- `group_name`: Name of the group

## Error Handling

### Standard Error Response
```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### HTTP Status Codes
- **200**: Success
- **400**: Bad Request - Invalid parameters
- **404**: Not Found - Resource doesn't exist
- **422**: Validation Error - Invalid request body
- **500**: Internal Server Error

## Rate Limiting and Performance

### Caching Strategy
- Frequently accessed data (contacts, projects) cached for 30 minutes
- Dashboard data cached for 15 minutes
- User-specific data not cached

### Query Optimization
- Database queries optimized with proper indexing
- JOIN operations minimized for performance
- Pagination implemented for large datasets

### Best Practices
- Use batch endpoints for multiple updates
- Filter data at the API level rather than client-side
- Implement proper error handling for network issues
- Cache responses appropriately in the frontend

This API provides comprehensive functionality for managing workload projections across the organization while maintaining performance and data consistency.
