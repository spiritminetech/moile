# Task Card Collapsible Implementation Guide

## Overview
This document outlines the implementation of collapsible TaskCard functionality to match the detailed workflow specification.

## Implementation Strategy

### Phase 1: Add Collapsible State to TaskCard
- Add `isExpanded` and `onToggleExpand` props
- Create collapsed (summary) view
- Create expanded (full detail) view
- Add expand/collapse icon indicator

### Phase 2: Update TodaysTasksScreen
- Add state to track which task is expanded
- Pass expand/collapse handlers to TaskCard
- Ensure only one task can be expanded at a time

### Phase 3: Add Missing Features
- Supervisor contact buttons (Call/Message)
- Navigate to site button
- Prominent geo-fence status indicator
- Nature of Work section (conditional on task status)
- End of day submission form

### Phase 4: Progressive Disclosure
- Show different sections based on task status
- BEFORE START: Basic info only
- AFTER START: Add Nature of Work, Progress tracking
- READY TO SUBMIT: Add submission form

## Changes Required

### 1. TaskCard Component (`ConstructionERPMobile/src/components/cards/TaskCard.tsx`)

**Add Props:**
```typescript
interface TaskCardProps {
  // ... existing props
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}
```

**Collapsed View (Summary):**
- Task name + priority badge
- Project name
- Activity type
- Daily target (quantity only)
- Status badge
- Quick action button
- Expand indicator (▼)

**Expanded View (Full Details):**
- All collapsed view content
- Assigned Project section (collapsible)
- Work Location with Map/Navigate buttons
- Reporting Supervisor with Call/Message buttons
- Nature of Work (visible after START)
- Daily Target with progress tracking
- Supervisor Instructions with attachments
- Task Status section (dynamic)
- Action buttons
- Expand indicator (▲)

### 2. TodaysTasksScreen Component (`ConstructionERPMobile/src/screens/worker/TodaysTasksScreen.tsx`)

**Add State:**
```typescript
const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
```

**Add Handler:**
```typescript
const handleToggleExpand = (taskId: number) => {
  setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
};
```

**Update renderTaskItem:**
```typescript
<TaskCard
  task={item}
  isExpanded={expandedTaskId === item.assignmentId}
  onToggleExpand={() => handleToggleExpand(item.assignmentId)}
  // ... other props
/>
```

## User Flow

### Morning - Before Work
1. Worker opens TodaysTasksScreen
2. Sees 2 collapsed task cards (summary only)
3. Taps TASK 1 card → Expands inline
4. Reviews all sections (scrolls within expanded card)
5. Clicks [▶ START TASK]
6. Nature of Work section appears
7. Daily Target section shows progress

### During Work
1. Task card remains expanded (or can collapse to save space)
2. Worker clicks [➕ UPDATE PROGRESS]
3. Progress updates in Daily Target section
4. Can upload photos, report issues

### End of Day
1. Submission form appears in expanded card
2. Worker enters completed units, remarks
3. Clicks [✅ SUBMIT REPORT]
4. Card collapses and shows "Completed" status

## Benefits

1. ✅ Minimal code changes (enhance existing component)
2. ✅ Faster implementation
3. ✅ Better UX for multiple tasks
4. ✅ Maintains existing architecture
5. ✅ All required features fit inline
6. ✅ No navigation complexity
7. ✅ Easier to maintain

## Next Steps

1. Implement collapsible UI in TaskCard
2. Add missing features (supervisor contact, navigate, etc.)
3. Implement progressive disclosure logic
4. Update TodaysTasksScreen to manage expand/collapse state
5. Test with multiple tasks
6. Verify all workflow scenarios

## Status: IN PROGRESS
