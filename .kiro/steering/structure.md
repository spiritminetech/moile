# Project Structure and Organization

## Repository Layout

```
├── backend/                    # Node.js Express API server
├── ConstructionERPMobile/      # React Native mobile application
└── .kiro/                      # Kiro configuration and specs
    ├── specs/                  # Feature specifications
    └── steering/               # Development guidelines
```

## Mobile App Structure (`ConstructionERPMobile/`)

### Source Code Organization (`src/`)

```
src/
├── components/                 # Reusable UI components
│   ├── common/                # Generic components (Button, Input, Card, etc.)
│   ├── forms/                 # Form-specific components (PhotoManager, AttachmentViewer)
│   ├── cards/                 # Data display cards (TaskCard, ProjectInfoCard)
│   ├── dashboard/             # Dashboard-specific components
│   ├── notifications/         # Notification-related components
│   └── debug/                 # Development and debugging components
├── screens/                   # Screen components organized by user role
│   ├── auth/                  # Authentication screens (LoginScreen)
│   ├── worker/                # Worker-specific screens (Dashboard, Attendance, Tasks)
│   ├── supervisor/            # Supervisor-specific screens (Dashboard, Reports)
│   └── driver/                # Driver-specific screens (Dashboard, Fleet)
├── navigation/                # Navigation configuration
│   ├── AppNavigator.tsx       # Main app navigation
│   ├── WorkerNavigator.tsx    # Worker role navigation
│   ├── SupervisorNavigator.tsx # Supervisor role navigation
│   └── DriverNavigator.tsx    # Driver role navigation
├── services/                  # External service integrations
│   ├── api/                   # API service layer with typed endpoints
│   ├── location/              # GPS and geofencing services
│   ├── camera/                # Camera and photo services
│   └── notifications/         # Push notification handling
├── store/                     # State management
│   ├── context/               # React Context providers (Auth, Offline, Location)
│   ├── reducers/              # State reducers for complex state logic
│   └── types/                 # State-related TypeScript definitions
├── utils/                     # Utility functions and helpers
│   ├── validation/            # Input validation helpers
│   ├── formatting/            # Data formatting utilities
│   ├── constants/             # Application constants
│   ├── theme/                 # Construction-optimized theme
│   └── errorHandling/         # Error handling utilities
└── types/                     # Global TypeScript type definitions
```

### Key Files
- `App.tsx` - Main application entry point
- `index.ts` - Expo entry point
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration

## Backend Structure (`backend/`)

### Source Code Organization (`src/`)

```
src/
├── config/                    # Configuration management
│   ├── app.config.js          # Centralized app configuration
│   └── database.js            # Database connection setup
├── middleware/                # Express middleware
│   ├── authMiddleware.js      # JWT authentication
│   ├── upload.js              # File upload handling
│   └── notificationAuthMiddleware.js # Notification security
├── modules/                   # Feature-based modules
│   ├── auth/                  # Authentication (login, JWT, refresh tokens)
│   ├── worker/                # Worker management and APIs
│   ├── attendance/            # Attendance tracking and validation
│   ├── task/                  # Task management and assignments
│   ├── notification/          # Push notifications and alerts
│   ├── project/               # Project and site management
│   ├── supervisor/            # Supervisor-specific features
│   ├── driver/                # Driver and fleet management
│   └── leaveRequest/          # Leave and request management
├── routes/                    # Route definitions
└── utils/                     # Shared utilities
    ├── jwtUtil.js             # JWT token utilities
    ├── geofenceUtil.js        # Geofencing calculations
    └── validationUtil.js      # Input validation
```

### Module Structure Pattern
Each module follows a consistent structure:
```
module/
├── Model.js                   # Mongoose model definition
├── moduleController.js        # Request handlers and business logic
├── moduleRoutes.js           # Express route definitions
├── moduleService.js          # Business logic and external integrations
└── submodules/               # Related sub-features
```

### Key Files
- `index.js` - Main server entry point
- `package.json` - Dependencies and scripts
- `.env` - Environment configuration
- `migrations/` - Database migration scripts

## File Naming Conventions

### Mobile App
- **Components**: PascalCase (e.g., `AttendanceScreen.tsx`, `TaskCard.tsx`)
- **Utilities**: camelCase (e.g., `validation.ts`, `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Types**: PascalCase with descriptive suffixes (e.g., `UserTypes.ts`, `ApiTypes.ts`)

### Backend
- **Models**: PascalCase (e.g., `User.js`, `WorkerTaskAssignment.js`)
- **Controllers**: camelCase with suffix (e.g., `workerController.js`)
- **Routes**: camelCase with suffix (e.g., `workerRoutes.js`)
- **Utilities**: camelCase with suffix (e.g., `jwtUtil.js`, `geofenceUtil.js`)

## Testing Structure

### Mobile App Tests
```
src/
├── components/
│   └── __tests__/             # Component tests
├── services/
│   └── __tests__/             # Service layer tests
├── utils/
│   └── __tests__/             # Utility function tests
└── navigation/
    └── __tests__/             # Navigation tests
```

### Backend Tests
- **Unit Tests**: Co-located with source files (e.g., `authService.test.js`)
- **Integration Tests**: Separate test files for API endpoints
- **Property-Based Tests**: Using fast-check for comprehensive validation

## Configuration Files

### Mobile App Configuration
- `tsconfig.json` - TypeScript compiler configuration
- `jest.config.js` - Jest testing configuration
- `eslint.config.js` - ESLint code quality rules
- `app.json` - Expo application configuration

### Backend Configuration
- `babel.config.cjs` - Babel transpilation configuration
- `jest.config.cjs` - Jest testing configuration
- `.env` - Environment variables (not committed)

## Asset Organization

### Mobile App Assets
```
assets/
├── adaptive-icon.png          # App icon for Android
├── icon.png                   # App icon for iOS
├── favicon.png                # Web favicon
└── splash-icon.png            # Splash screen icon
```

### Backend Uploads
```
uploads/
├── tasks/                     # Task-related photos
├── drivers/                   # Driver documentation
├── leave/                     # Leave request attachments
├── pickup/                    # Pickup confirmation photos
└── dropoff/                   # Dropoff confirmation photos
```