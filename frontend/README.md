# Construction ERP Mobile Application

A React Native mobile application for construction site workers, supervisors, and drivers built with TypeScript.

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (Button, Input, etc.)
│   ├── forms/           # Form-specific components
│   └── cards/           # Data display cards
├── screens/             # Screen components organized by role
│   ├── auth/           # Authentication screens
│   ├── worker/         # Worker-specific screens
│   ├── supervisor/     # Supervisor-specific screens
│   └── driver/         # Driver-specific screens
├── navigation/          # Navigation configuration
├── services/           # API and external service integrations
│   ├── api/           # API service layer
│   ├── location/      # Location services
│   ├── camera/        # Camera services
│   └── notifications/ # Push notification services
├── store/             # State management
│   ├── context/       # React Context providers
│   ├── reducers/      # State reducers
│   └── types/         # TypeScript type definitions
├── utils/             # Utility functions
│   ├── validation/    # Input validation helpers
│   ├── formatting/    # Data formatting utilities
│   └── constants/     # Application constants
└── types/             # Global TypeScript type definitions
```

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript for type safety
- **Navigation**: React Navigation v6
- **HTTP Client**: Axios for API communication
- **Local Storage**: AsyncStorage for offline data
- **State Management**: React Context API with useReducer
- **Testing**: Jest with fast-check for property-based testing

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

- Start the development server:
  ```bash
  npm start
  ```

- Run on Android:
  ```bash
  npm run android
  ```

- Run on iOS:
  ```bash
  npm run ios
  ```

- Run on Web:
  ```bash
  npm run web
  ```

### Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run on web browser
- `npm test` - Run tests
- `npm run type-check` - Run TypeScript type checking

## Features

- **Role-based Access**: Different interfaces for Workers, Supervisors, and Drivers
- **Location Services**: GPS tracking and geofencing for attendance
- **Offline Support**: Works with limited connectivity
- **Construction-Optimized UI**: Large touch targets and high contrast design
- **Real-time Notifications**: Push notifications for task updates
- **Photo Management**: Camera integration for daily reports

## Architecture

The application follows a client-server architecture with:

- **API-First Integration**: All business logic in backend
- **Role-Based Access Control**: UI adapts based on user roles
- **Location-Aware Operations**: GPS and geofencing integration
- **Offline-First Design**: Graceful degradation without connectivity
- **Construction-Optimized UX**: Designed for field conditions

## Development Status

✅ Project setup and core infrastructure complete
- React Native project with TypeScript
- Organized folder structure
- Essential dependencies installed
- Basic type definitions created
- Development environment configured

## Next Steps

1. Implement authentication system
2. Set up role-based navigation
3. Add location services and geofencing
4. Create API service layer
5. Build worker dashboard and features
6. Add testing framework setup

## License

This project is proprietary software for construction ERP management.