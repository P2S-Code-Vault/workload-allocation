# Project Structure Documentation

## Overview
This is a React-based Workload Projection UI application built for Legence, designed to manage and visualize resource allocation across projects, milestones, and opportunities. The application serves different user roles including Project Managers (PM), Group Leaders (GL), Team Leaders, and individual contributors.

## Technology Stack
- **Frontend**: React 18.3.1 with functional components and hooks
- **Build Tool**: Create React App with react-scripts 5.0.1
- **Styling**: CSS with component-specific stylesheets
- **State Management**: React useState and useEffect hooks
- **Date Handling**: date-fns library for date manipulation
- **Data Processing**: Papa Parse for CSV handling
- **Icons**: React Icons
- **HTTP Client**: Native fetch API

## Project Structure

```
workload-allocation/
├── package.json                    # Project dependencies and scripts
├── README.md                      # Setup instructions
├── public/                        # Static assets
│   ├── index.html                # Main HTML template
│   ├── favicon.ico               # Application favicon
│   ├── logo192.png              # PWA icons
│   ├── logo512.png
│   ├── manifest.json            # PWA manifest
│   ├── robots.txt              # SEO robots file
│   ├── Project_Data.csv        # Sample project data
│   ├── Projects.csv            # Sample projects
│   ├── RA_Summary.csv         # Resource allocation summary
│   ├── SF_Labor Grades.xlsx   # Labor grade reference
│   └── data/                  # Sample data files
│       ├── Milestones.csv
│       ├── Opportunities.csv
│       └── Staff.csv
├── src/                          # Source code
│   ├── App.js                   # Main application component
│   ├── App.css                 # Global application styles
│   ├── index.js                # React application entry point
│   ├── index.css               # Global CSS reset and base styles
│   ├── P2S_Legence_Logo_White.png  # Company logo
│   ├── components/             # Reusable React components
│   │   ├── GLPage.js          # Group Leader dashboard page
│   │   ├── GLView.css         # GL specific styles
│   │   ├── LeadershipPage.js  # Leadership view component
│   │   ├── LeadershipPage.css # Leadership page styles
│   │   ├── Login.js           # Authentication component
│   │   ├── Login.css          # Login page styles
│   │   ├── PMPage.js          # Project Manager dashboard
│   │   ├── SLPage.js          # Studio Leader page
│   │   ├── TeamLeaderPage.js  # Team leader view
│   │   ├── WeekPicker.js      # Date range selection
│   │   ├── WeekPicker.css     # Week picker styles
│   │   ├── NewWeekPicker.js   # Enhanced date picker
│   │   ├── NewWeekPicker.css  # New picker styles
│   │   ├── QuarterPicker.js   # Quarter selection component
│   │   ├── TableRow.js        # Data table row component
│   │   ├── TableRow.css       # Table row styles
│   │   ├── TeamEdit.js        # Team editing interface
│   │   ├── TeamEdit.css       # Team edit styles
│   │   ├── TeamMemberPanel.js # Team member management
│   │   ├── TeamMemberPanel.css # Panel styles
│   │   ├── TeamMemberSelector.js # Member selection UI
│   │   ├── TeamMemberSelector.css # Selector styles
│   │   ├── UserSelector.js    # User selection component
│   │   └── OpportunityRow.js  # Opportunity display component
│   ├── data/                   # Mock data and test data
│   │   └── mockStaffData.js   # Sample staff information
│   ├── services/              # API service layer
│   │   ├── apiConfig.js       # API configuration and endpoints
│   │   ├── PMDashboardService.js # PM dashboard data service
│   │   ├── ProjectDataService.js # Project data management
│   │   ├── ProjectSearchService.js # Project search functionality
│   │   ├── WorkloadPreloadService.js # Workload data preloading
│   │   ├── UserService.js     # User authentication and management
│   │   ├── GLService.js       # Group Leader services
│   │   ├── GLDataService.js   # GL data operations
│   │   ├── GLTeamService.js   # GL team management
│   │   ├── StaffService.js    # Staff data management
│   │   ├── AllStaffService.js # Company-wide staff operations
│   │   ├── ScheduledHoursService.js # Hours calculation service
│   │   ├── SummaryDataService.js # Data aggregation service
│   │   ├── RateSchedule.js    # Rate and billing logic
│   │   └── test-*.js          # Testing utilities
│   ├── utils/                 # Utility functions
│   │   ├── csvParser.js       # CSV parsing utilities
│   │   ├── dateUtils.js       # Date manipulation helpers
│   │   ├── monthlyPayloadUtils.js # Monthly data processing
│   │   └── rateUtils.js       # Rate calculation utilities
│   └── styles/                # Additional stylesheets
│       ├── UserSelector.css   # User selector styles
│       └── components/        # Component-specific styles
│           └── PMDashboard.css # PM dashboard styles
└── documentation/             # Project documentation
    ├── project_structure.md  # This file
    ├── frontend.md           # Frontend architecture guide
    └── endpoints.md          # Backend API documentation
```

## Key Directories Explained

### `/src/components/`
Contains all React components organized by functionality:
- **Authentication**: `Login.js` - handles user authentication
- **Navigation**: Main navigation and routing logic in `App.js`
- **Dashboards**: Role-specific dashboard components (`PMPage.js`, `LeadershipPage.js`, etc.)
- **UI Components**: Reusable components like pickers, selectors, and table rows
- **Data Display**: Components for showing workload, project, and opportunity data

### `/src/services/`
API service layer that abstracts backend communication:
- **Configuration**: `apiConfig.js` centralizes all API endpoints and settings
- **Data Services**: Service classes for different data domains (PM, GL, Projects, etc.)
- **Authentication**: `UserService.js` manages user sessions and permissions
- **Testing**: Test utilities for development and debugging

### `/src/utils/`
Utility functions for common operations:
- **Date Operations**: Quarter calculations, date formatting, working day calculations
- **Data Processing**: CSV parsing, data transformation, payload preparation
- **Business Logic**: Rate calculations, workload computations

### `/public/data/`
Sample data files used for development and testing:
- **Projects**: Project information and metadata
- **Milestones**: Project milestone data
- **Staff**: Employee and resource information
- **Opportunities**: Sales opportunity data

## Architectural Patterns

### Component Structure
- **Functional Components**: All components use React hooks
- **State Management**: Local state with useState, shared state passed via props
- **Side Effects**: useEffect for API calls and lifecycle management
- **Custom Hooks**: Reusable logic abstracted into custom hooks where appropriate

### Service Layer Pattern
- Services encapsulate all API communication
- Static methods for stateless operations
- Consistent error handling and response transformation
- Built-in fallback data for development

### Data Flow
1. **Authentication**: User logs in via `Login.js` → `UserService.js`
2. **Navigation**: `App.js` manages routing between different views
3. **Data Fetching**: Components call service methods to retrieve data
4. **State Updates**: Components update local state and re-render
5. **User Actions**: Form submissions and interactions trigger API calls

## Environment Configuration

### Development Setup
- Uses Create React App development server
- API base URL configurable via `REACT_APP_API_BASE_URL` environment variable
- Fallback to production API if not configured

### Build Configuration
- Production builds use `CI=false` to bypass warnings as errors
- Cross-platform compatibility with `cross-env`
- Optimized builds for Azure deployment

### Development Tools
- **CRACO**: Enhanced configuration for Create React App
- **ES6+ Features**: Modern JavaScript with async/await, destructuring
- **CSS Modules**: Component-scoped styling

## Key Features by Module

### Project Management
- Project dashboard with milestone tracking
- Resource allocation across projects
- Project manager assignment and filtering

### Resource Planning
- Quarterly and monthly resource allocation
- Workload visualization and planning
- Team capacity planning and utilization tracking

### Opportunity Management
- Sales opportunity tracking
- Proposal champion assignment
- Probability-based resource planning

### Team Management
- Group leader team oversight
- Studio-based organization
- Individual contributor workload management

## Development Guidelines

### Code Organization
- One component per file with matching CSS file
- Services grouped by business domain
- Utilities shared across multiple components
- Constants and configuration centralized

### Naming Conventions
- **Components**: PascalCase (e.g., `PMPage.js`)
- **Services**: PascalCase with "Service" suffix
- **Utilities**: camelCase with descriptive names
- **CSS Classes**: kebab-case with component prefixes

### Error Handling
- Service layer handles API errors with fallback data
- Component-level error boundaries for UI errors
- Console logging for debugging in development
- User-friendly error messages in production

This structure supports a scalable, maintainable application that serves multiple user roles while maintaining clean separation of concerns between UI, business logic, and data access layers.
