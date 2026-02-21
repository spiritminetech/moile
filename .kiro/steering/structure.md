---
inclusion: always
---

# Project Structure

## Repository Layout

```
/backend          - Node.js Express API
/frontend         - React Native Expo app
```

## Backend Structure

```
backend/
├── src/
│   ├── config/           - App and database configuration
│   ├── middleware/       - Auth, upload, validation middleware
│   ├── modules/          - Feature modules (domain-driven)
│   │   ├── auth/
│   │   ├── worker/
│   │   ├── supervisor/
│   │   ├── driver/
│   │   ├── attendance/
│   │   ├── notification/
│   │   └── [feature]/
│   │       ├── models/           - Mongoose schemas
│   │       ├── [feature]Controller.js
│   │       ├── [feature]Routes.js
│   │       └── *.test.js         - Jest tests
│   ├── routes/           - Shared/migration routes
│   ├── services/         - Business logic services
│   ├── jobs/             - Scheduled jobs
│   └── utils/            - Utility functions
├── uploads/              - Static file storage
├── migrations/           - Database migrations
├── scripts/              - Utility scripts
├── index.js              - Application entry point
└── package.json
```

## Frontend Structure

```
frontend/
├── src/
│   ├── components/       - Reusable UI components
│   ├── screens/          - Screen components by feature
│   ├── navigation/       - Navigation configuration
│   ├── services/         - API service layer
│   ├── store/
│   │   └── context/      - React Context providers
│   ├── hooks/            - Custom React hooks
│   ├── types/            - TypeScript type definitions
│   ├── utils/            - Utility functions
│   └── config/           - App configuration
├── assets/               - Images and static assets
├── App.tsx               - Root component
└── package.json
```

## Module Pattern (Backend)

Each feature module follows this structure:
- `models/` - Mongoose schemas
- `[feature]Controller.js` - Request handlers
- `[feature]Routes.js` - Express route definitions
- `*.test.js` - Unit and integration tests

Routes are registered in `index.js` with prefix `/api/v1/[feature]`.

## Key Conventions

- ES Modules throughout backend (import/export)
- TypeScript in frontend with strict mode
- Test files colocated with source files
- Context providers wrap App.tsx for global state
- API calls centralized in services layer
- Middleware applied at route level for auth/validation
