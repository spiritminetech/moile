---
inclusion: always
---

# Tech Stack

## Backend

- Node.js with Express.js
- MongoDB with Mongoose ODM
- ES Modules (type: "module")
- JWT authentication with bcrypt
- Firebase Admin SDK for push notifications
- Multer for file uploads

## Frontend

- React Native with Expo (~54.0.0)
- TypeScript
- React Navigation (stack + bottom tabs)
- Axios for API calls
- AsyncStorage for local persistence
- Expo Location, Image Picker, Document Picker

## Testing

- Jest for both backend and frontend
- fast-check for property-based testing
- React Testing Library for component tests
- Babel for transpilation

## Common Commands

### Backend

```bash
npm start              # Start production server
npm run dev            # Start with nodemon
npm test               # Run Jest tests
npm run test:watch     # Watch mode
npm run db:validate    # Validate collections
npm run db:fix-null-ids # Fix null ID issues
```

### Frontend

```bash
npm start              # Start Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS
npm test               # Run Jest tests
npm run test:watch     # Watch mode
npm run test:coverage  # Generate coverage report
npm run lint           # Run ESLint
npm run type-check     # TypeScript check
```

## Environment Variables

Backend requires `.env` with:
- MONGODB_URI
- JWT_SECRET
- Firebase credentials

Frontend uses Expo config for environment-specific settings.
