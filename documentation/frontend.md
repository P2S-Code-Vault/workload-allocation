# Frontend Application Architecture

## Overview
The Workload Allocation frontend is a React-based single-page application (SPA) that provides role-based dashboards for managing resource allocation across projects, milestones, and opportunities. The application serves four primary user roles with distinct interfaces and capabilities.

## Application Structure

### Main Application (`App.js`)
The root component that orchestrates the entire application with role-based routing and navigation.

#### Navigation Header
- **Logo**: Legence P2S branding
- **Dynamic Title**: Changes based on current view
- **Navigation Buttons**: Role-based navigation with disabled state management
- **User Actions**: Logout functionality

#### View Management
The application uses a state-based routing system with the following views:
- `resource` - Main workload projection view (default)
- `pm` - Project Manager dashboard
- `leadership` - Group Leader dashboard  
- `teamedit` - Team management interface

```javascript
const [currentView, setCurrentView] = useState(() => {
  return localStorage.getItem('workload-app-view') || 'resource';
});
```

## User Roles and Views

### 1. Main View (`currentView === "resource"`)
**Primary Users**: Individual contributors, team members
**Purpose**: Personal workload management and project allocation, landing page for Workload projection.

#### Features:
- **Personal Workload Grid**: Individual's project assignments and hours
- **Quarter Selection**: Filter data by fiscal quarters (Q1, Q2, Q3, Q4)
- **Project Search**: Find and add projects/opportunities to personal workload
- **Hour Allocation**: Distribute working hours across projects by month
- **Utilization Tracking**: Monitor capacity utilization and availability

#### Key Components:
- `QuarterPicker` - Quarter and year selection
- `TableRow` - Individual project/milestone rows with hour inputs
- `TeamMemberSelector` - Project team member management
- `OpportunityRow` - Opportunity-specific data display

#### Data Sources:
- Personal milestone projections
- Personal opportunity allocations
- Available projects and opportunities
- Team member information

### 2. Project Manager View (`currentView === "pm"`)
**Primary Users**: Project Managers, Principal Engineers
**Purpose**: Project-level resource planning and oversight

#### Features:
- **Project Portfolio**: All projects under PM's management
- **Resource Allocation**: View team assignments across projects
- **Project Dashboard**: Aggregated project metrics and status
- **Milestone Management**: Track milestone progress and resource needs
- **Team Workload**: Monitor team member utilization across projects

#### Sub-Views:
- **Projects Tab**: Traditional project-based workload (milestones)
- **Opportunities Tab**: Sales opportunity resource planning
- **All Projects Tab**: Comprehensive view of all active projects

#### Key Components:
- `PMPage` - Main PM dashboard container
- `CollapsibleProject` - Expandable project cards with resource details
- `PMSelector` - Project manager filter selection
- **Resource Tables**: Detailed monthly hour breakdowns by team member

#### Data Flow:
```javascript
// PM Dashboard Data Fetching
PMDashboardService.getPMDashboardData(quarter, year, pmName, showAllMilestones)
// Returns project summaries with resource allocations
```

### 3. Group Leader View (`currentView === "leadership"`)
**Primary Users**: Group Leaders, Studio Leaders, Department Managers
**Purpose**: Team and group-level resource management and strategic planning

#### Features:
- **Team Overview**: Complete team workload and utilization
- **Studio Management**: Studio-based team organization
- **Capacity Planning**: Long-term resource capacity analysis
- **Group Metrics**: Aggregated team performance indicators
- **Resource Balancing**: Redistribute workload across team members

#### View Modes:
- **Hierarchy View**: Organized by studio and team structure
- **Flat View**: All team members in a single list
- **Monthly View**: Month-by-month resource breakdown

#### Key Components:
- `LeadershipPage` - Main leadership dashboard
- `TeamMemberPanel` - Individual team member workload panels
- **Studio Sections**: Collapsible studio-based organization
- **Utilization Charts**: Visual capacity utilization indicators

#### Data Sources:
- Team member workload data
- Studio assignments and structure
- Scheduled hours and capacity calculations
- Group-level project assignments

<!-- ### 4. Team Edit View (`currentView === "teamedit"`)
**Primary Users**: Group Leaders, HR Administrators
**Purpose**: Team structure management and member assignment

#### Features:
- **Team Structure Editing**: Add/remove team members from studios
- **Role Assignment**: Assign studio leaders and group managers
- **Contact Management**: Update member contact information
- **Studio Organization**: Create and modify studio structures

#### Key Components:
- `TeamEdit` - Main team editing interface
- **Member Cards**: Individual team member editing interfaces
- **Studio Assignment**: Drag-and-drop or selection-based assignment
- **Role Management**: Permission and role assignment controls -->

## Navigation and State Management

### Route Management
The application uses a custom routing system based on React state rather than React Router:

```javascript
const navigateToView = (view) => {
  if (view !== currentView) {
    setCurrentView(view);
    localStorage.setItem('workload-app-view', view);
  }
};
```

### State Persistence
- **View State**: Current view persisted in localStorage
- **Filter State**: Quarter, year, and other filters maintained across sessions
- **User Preferences**: Column widths, sort orders, and display preferences

### Authentication Flow
1. **Login Check**: Application checks for existing authentication on load
2. **User Context**: Current user information stored in UserService
3. **Role Detection**: User role determines available views and features
4. **Permission Checks**: Feature access controlled by user role and group membership

## Component Architecture

### Higher-Order Components
- **App.js**: Root container managing global state and routing
- **Header**: Navigation and user context display
- **Main Content**: Dynamic content area based on current view

### Shared Components

#### `QuarterPicker`
Quarter and year selection component used across all views
```javascript
<QuarterPicker
  selectedQuarter={selectedQuarter}
  selectedYear={selectedYear}
  onQuarterChange={setSelectedQuarter}
  onYearChange={setSelectedYear}
/>
```

#### `TableRow`
Reusable data row component for workload display
- **Props**: Project data, editable hours, handlers
- **Features**: Inline editing, validation, save/cancel actions
- **Styling**: Consistent row styling across views

#### `TeamMemberSelector`
Team member selection and assignment component
- **Multi-select**: Choose multiple team members
- **Search**: Filter team members by name or role
- **Role Display**: Show labor categories and studio assignments

### Data Display Patterns

#### Collapsible Sections
Many views use collapsible sections for organizing large datasets:
```javascript
const [isExpanded, setIsExpanded] = useState(false);
// Used in PMPage, LeadershipPage for project/studio sections
```

#### Monthly Breakdown Tables
Consistent table structure for displaying monthly hour allocations:
- **Columns**: Resource, Labor Grade, Month 1, Month 2, Month 3, Total
- **Formatting**: Number formatting, currency display, percentage calculations
- **Interaction**: Inline editing for hour values

## Data Flow Architecture

### Service Layer Integration
Each view integrates with specific service classes:

```javascript
// PM View
import PMDashboardService from '../services/PMDashboardService';

// Leadership View  
import { GLTeamService } from '../services/GLTeamService';
import { ScheduledHoursService } from '../services/ScheduledHoursService';

// Resource View
import { ProjectDataService } from '../services/ProjectDataService';
import { WorkloadPreloadService } from '../services/WorkloadPreloadService';
```

### State Management Pattern
Components follow a consistent state management pattern:

```javascript
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

useEffect(() => {
  async function loadData() {
    try {
      setIsLoading(true);
      const result = await SomeService.getData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }
  loadData();
}, [dependencies]);
```

### Event Handling
- **Form Submissions**: Batch updates for efficiency
- **Real-time Updates**: Optimistic UI updates with error rollback
- **Cross-Component Communication**: Parent-child prop passing and callback functions

## UI/UX Design Principles

### Responsive Design
- **Desktop-First**: Optimized for desktop workflow
- **Flexible Layouts**: CSS Grid and Flexbox for adaptable layouts
- **Minimum Widths**: Ensures data readability on smaller screens

### Visual Hierarchy
- **Color Coding**: 
  - Blue: Primary actions and navigation
  - Green: Success states and positive metrics
  - Red: Errors and over-allocation warnings
  - Gray: Disabled states and secondary information

### Loading States
- **Skeleton Loading**: Placeholder content during data fetching
- **Progressive Enhancement**: Show available data while loading additional content
- **Error Boundaries**: Graceful error handling with fallback UI

### Accessibility
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **ARIA Labels**: Screen reader support for data tables and interactive elements
- **Color Contrast**: Sufficient contrast ratios for text readability
- **Focus Management**: Clear focus indicators and logical tab order

## Performance Considerations

### Data Loading Strategies
- **Lazy Loading**: Load data as needed for active views
- **Caching**: Service-level caching for frequently accessed data
- **Pagination**: Large datasets split into manageable chunks
- **Debounced Search**: Prevent excessive API calls during search

### Component Optimization
- **Memoization**: React.memo for expensive renders
- **Callback Optimization**: useCallback and useMemo for expensive calculations
- **Virtual Scrolling**: For large data lists (planned enhancement)

### Bundle Optimization
- **Code Splitting**: Route-based code splitting (planned)
- **Tree Shaking**: Remove unused code from production bundle
- **Asset Optimization**: Compressed images and optimized fonts

This frontend architecture provides a scalable, maintainable foundation for the workload allocation application while delivering role-specific functionality through a consistent, user-friendly interface.
