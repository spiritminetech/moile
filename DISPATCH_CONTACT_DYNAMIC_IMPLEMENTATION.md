# Dispatch Contact - Dynamic Implementation

## What is "Dispatch"?

**Dispatch** is your company's transport coordinator/manager who handles:
- 📋 Route assignments
- 🚨 Emergency situations
- 🔄 Route changes
- 🚗 Vehicle issues
- 👥 Worker coordination
- 📞 Driver support

**Examples of Dispatch Roles:**
- Transport Manager
- Fleet Coordinator
- Operations Manager
- Logistics Supervisor
- Control Room Operator

## Static vs Dynamic Implementation

### ❌ Static (Old Way - Not Good):
```typescript
const dispatchPhone = 'tel:+1234567890'; // Hardcoded number
```

**Problems:**
- Same number for everyone
- Can't change without app update
- No different numbers for shi