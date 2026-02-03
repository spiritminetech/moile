# Technology Stack and Development Guidelines

## Frontend (Mobile App)

### Core Technologies
- **Framework**: React Native with Expo SDK ~54.0
- **Language**: TypeScript for type safety and better developer experience
- **Navigation**: React Navigation v7 (Stack and Bottom Tab navigators)
- **State Management**: React Context API with useReducer pattern
- **HTTP Client**: Axios for API communication with interceptors
- **Local Storage**: AsyncStorage for offline data and token storage

### Key Dependencies
- **Location Services**: expo-location for GPS tracking and geofencing
- **Camera Integration**: expo-image-picker for photo capture and gallery access
- **Document Handling**: expo-document-picker for file attachments
- **Network Detection**: @react-native-community/netinfo for connectivity monitoring
- **Date/Time Pickers**: @react-native-community/datetimepicker for form inputs

### Testing Framework
- **Unit Testing**: Jest with React Native Testing Library
- **Property-Based Testing**: fast-check for comprehensive test coverage
- **Test Environment**: jest-expo for Expo-specific testing setup

## Backend (API Server)

### Core Technologies
- **Runtime**: Node.js with ES modules
- **Framework**: Express.js with modular route organization
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with refresh token support
- **File Uploads**: Multer for multipart form handling

### Key Dependencies
- **Security**: bcryptjs for password hashing, CORS for cross-origin requests
- **Notifications**: Firebase Admin SDK for push notifications
- **Email**: Nodemailer for SMTP email delivery
- **Validation**: Custom validation utilities with centralized error handling

## Development Commands

### Mobile App Commands
```bash
# Development
npm start              # Start Expo development server
npm run android        # Run on Android device/emulator
npm run ios           # Run on iOS device/simulator
npm run web           # Run on web browser

# Testing
npm test              # Run Jest tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate test coverage report

# Code Quality
npm run lint          # Run ESLint
npm run type-check    # Run TypeScript compiler check
```

### Backend Commands
```bash
# Development
npm start             # Start production server
npm run dev           # Start development server with nodemon

# Testing
npm test              # Run Jest tests
npm run test:watch    # Run tests in watch mode

# Database Migrations
npm run migrate:mobile-fields    # Add mobile-specific fields
npm run migrate:project-geofence # Add geofence structure
```

## Build and Deployment

### Mobile App Build Process
- **Development**: Expo development builds for testing
- **Production**: EAS Build for app store deployment
- **Environment**: Separate configurations for dev/staging/production

### Backend Deployment
- **Environment Variables**: Comprehensive .env configuration
- **Process Management**: PM2 or similar for production deployment
- **Static Files**: Express static middleware for uploaded files
- **Health Checks**: Built-in health check endpoints

## Code Organization Patterns

### Mobile App Structure
- **Screens**: Organized by user role (worker/, supervisor/, driver/)
- **Components**: Reusable UI components with construction-specific theming
- **Services**: API integration layer with error handling
- **Utils**: Validation, formatting, and utility functions
- **Types**: Centralized TypeScript type definitions

### Backend Structure
- **Modules**: Feature-based organization (auth/, worker/, attendance/, etc.)
- **Middleware**: Authentication, validation, and upload handling
- **Config**: Centralized configuration management
- **Utils**: Shared utilities for validation, JWT, and geofencing

## Performance Considerations

- **Image Optimization**: Automatic image compression for uploads
- **Caching Strategy**: AsyncStorage for offline data persistence
- **Bundle Size**: Tree shaking and code splitting for optimal app size
- **API Efficiency**: Pagination and selective data loading
- **Memory Management**: Proper cleanup of listeners and subscriptions