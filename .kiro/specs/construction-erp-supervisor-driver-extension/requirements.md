# Requirements Document

## Introduction

This document specifies the requirements for extending the existing Construction ERP Mobile Application to support Supervisor and Driver roles. The application currently serves Workers and needs to be extended with role-specific functionality while maintaining compatibility with existing Worker modules. The extension integrates with the existing backend system through predefined APIs and provides role-based access to construction management features including team oversight, task assignment, transportation management, and approval workflows.

## Glossary

- **Mobile_App**: The React Native construction ERP mobile application
- **Backend_System**: The existing external server hosting construction ERP APIs
- **Worker**: Construction site worker user role with basic operational access (EXISTING)
- **Supervisor**: Construction site supervisor user role with management and oversight access (NEW)
- **Driver**: Transportation driver user role with logistics and transport access (NEW)
- **Geofence**: Geographic boundary around construction site for location validation
- **JWT_Token**: JSON Web Token used for user authentication
- **Task_Assignment**: Specific work assigned to a worker with dependencies and sequence
- **Attendance_Session**: Time-tracked work session with login/logout events
- **Daily_Report**: Worker's end-of-day work summary with photos and descriptions
- **Transport_Task**: Driver's assigned pickup/dropoff route with worker manifest
- **Approval_Workflow**: Supervisor's process for reviewing and approving worker requests
- **Team_Management**: Supervisor's oversight of assigned workers and their activities

## Requirements

### Requirement 1: Extended Role-Based Navigation and Access Control

**User Story:** As a supervisor or driver, I want to access role-specific features and screens, so that I can perform my job functions without seeing irrelevant worker-only features.

#### Acceptance Criteria

1. WHEN a Supervisor logs in, THE Mobile_App SHALL display supervisor-specific navigation tabs (Dashboard, Team, Tasks, Reports, Approvals, Profile)
2. WHEN a Driver logs in, THE Mobile_App SHALL display driver-specific navigation tabs (Dashboard, Transport, Trips, Attendance, Vehicle, Profile)
3. WHEN role permissions change, THE Mobile_App SHALL update available navigation options accordingly
4. WHEN unauthorized access is attempted, THE Mobile_App SHALL prevent access and display appropriate messages
5. WHEN existing Worker navigation is accessed, THE Mobile_App SHALL maintain full compatibility with existing functionality

### Requirement 2: Supervisor Dashboard and Team Overview

**User Story:** As a supervisor, I want to see my team's daily work overview on the dashboard, so that I can quickly understand project status, workforce allocation, and pending issues.

#### Acceptance Criteria

1. WHEN a supervisor accesses the dashboard, THE Mobile_App SHALL display assigned projects and workforce count from the Backend_System
2. WHEN dashboard loads, THE Mobile_App SHALL show attendance summary with present/absent/late worker counts
3. WHEN displaying team status, THE Mobile_App SHALL indicate pending approvals count and priority alerts
4. WHEN showing project progress, THE Mobile_App SHALL display overall completion percentage and daily targets
5. WHEN alerts exist, THE Mobile_App SHALL display safety incidents, geofence violations, and urgent requests

### Requirement 3: Supervisor Attendance Monitoring and Management

**User Story:** As a supervisor, I want to monitor my team's attendance and handle attendance issues, so that I can ensure proper workforce allocation and address attendance problems.

#### Acceptance Criteria

1. WHEN viewing attendance monitoring, THE Mobile_App SHALL display real-time worker list with check-in status from the Backend_System
2. WHEN attendance issues occur, THE Mobile_App SHALL show late arrivals, early departures, and geofence violations
3. WHEN geofence violations are detected, THE Mobile_App SHALL display worker location and distance from site
4. WHEN manual attendance requests exist, THE Mobile_App SHALL allow supervisors to approve or reject attendance corrections
5. WHEN attendance data is updated, THE Mobile_App SHALL submit supervisor decisions to the Backend_System

### Requirement 4: Supervisor Task Assignment and Progress Management

**User Story:** As a supervisor, I want to assign tasks to workers and monitor progress, so that I can ensure work is completed efficiently and on schedule.

#### Acceptance Criteria

1. WHEN assigning tasks, THE Mobile_App SHALL allow supervisors to create task assignments with worker selection from the Backend_System
2. WHEN updating job targets, THE Mobile_App SHALL allow modification of daily targets and work specifications
3. WHEN reassigning workers, THE Mobile_App SHALL validate worker availability and skill requirements through the Backend_System
4. WHEN tracking completion, THE Mobile_App SHALL display real-time task progress and completion status
5. WHEN task issues arise, THE Mobile_App SHALL allow supervisors to update task priorities and reassign work

### Requirement 5: Supervisor Daily Progress Reporting and Oversight

**User Story:** As a supervisor, I want to create comprehensive daily progress reports, so that I can document project status and communicate with management.

#### Acceptance Criteria

1. WHEN creating progress reports, THE Mobile_App SHALL collect manpower utilization and productivity metrics from the Backend_System
2. WHEN documenting progress, THE Mobile_App SHALL allow input of completion percentages and milestone updates
3. WHEN adding visual documentation, THE Mobile_App SHALL provide photo and video capture for progress documentation
4. WHEN reporting issues, THE Mobile_App SHALL allow detailed issue logging with severity classification and safety incident reporting
5. WHEN tracking resources, THE Mobile_App SHALL document material consumption and tool usage from Backend_System data

### Requirement 6: Supervisor Request and Approval Management

**User Story:** As a supervisor, I want to review and approve worker requests, so that I can maintain operational efficiency and ensure proper resource allocation.

#### Acceptance Criteria

1. WHEN reviewing leave requests, THE Mobile_App SHALL display pending requests with worker details and request justification
2. WHEN processing material requests, THE Mobile_App SHALL show item specifications, quantities, and project requirements
3. WHEN handling tool requests, THE Mobile_App SHALL validate tool availability and approve allocations
4. WHEN escalating issues, THE Mobile_App SHALL allow forwarding of complex requests to higher management
5. WHEN approval decisions are made, THE Mobile_App SHALL submit decisions to the Backend_System and notify requesting workers

### Requirement 7: Supervisor Materials and Tools Management

**User Story:** As a supervisor, I want to manage materials and tools allocation, so that I can ensure workers have necessary resources and track usage.

#### Acceptance Criteria

1. WHEN requesting materials, THE Mobile_App SHALL allow supervisors to submit material requests with project specifications
2. WHEN acknowledging deliveries, THE Mobile_App SHALL provide material receipt confirmation with quantity verification
3. WHEN processing returns, THE Mobile_App SHALL handle material return documentation and inventory updates
4. WHEN tracking tool usage, THE Mobile_App SHALL maintain tool allocation logs and usage tracking
5. WHEN managing inventory, THE Mobile_App SHALL display current material and tool availability from the Backend_System

### Requirement 8: Driver Dashboard and Transport Overview

**User Story:** As a driver, I want to see my daily transport assignments on the dashboard, so that I can understand my routes, schedules, and worker pickup requirements.

#### Acceptance Criteria

1. WHEN a driver accesses the dashboard, THE Mobile_App SHALL display today's transport tasks and assigned vehicle from the Backend_System
2. WHEN showing pickup information, THE Mobile_App SHALL display pickup times, locations, and worker count
3. WHEN displaying routes, THE Mobile_App SHALL show dormitory pickup locations and site drop-off points
4. WHEN worker confirmation is required, THE Mobile_App SHALL provide worker manifest with check-in capabilities
5. WHEN task status updates are needed, THE Mobile_App SHALL allow drivers to update transport task progress

### Requirement 9: Driver Transport Task Management

**User Story:** As a driver, I want to manage transport tasks efficiently, so that I can ensure timely worker transportation and accurate record keeping.

#### Acceptance Criteria

1. WHEN viewing pickup lists, THE Mobile_App SHALL display dormitory pickup locations with worker manifests from the Backend_System
2. WHEN navigating routes, THE Mobile_App SHALL show site drop locations on map view with GPS navigation integration
3. WHEN confirming workers, THE Mobile_App SHALL provide worker check-in functionality with photo verification
4. WHEN updating task status, THE Mobile_App SHALL allow real-time status updates (en route, pickup complete, drop complete)
5. WHEN tasks are completed, THE Mobile_App SHALL submit completion confirmation to the Backend_System

### Requirement 10: Driver Trip Updates and Reporting

**User Story:** As a driver, I want to provide trip updates and handle issues, so that supervisors are informed of transport status and any problems are documented.

#### Acceptance Criteria

1. WHEN pickup is completed, THE Mobile_App SHALL allow drivers to confirm pickup completion with worker count verification
2. WHEN drop-off is completed, THE Mobile_App SHALL provide drop completion confirmation with location verification
3. WHEN delays occur, THE Mobile_App SHALL allow delay reporting with reason codes and estimated arrival updates
4. WHEN breakdowns happen, THE Mobile_App SHALL provide breakdown reporting with location and assistance request
5. WHEN photo documentation is needed, THE Mobile_App SHALL allow optional photo uploads for incident documentation

### Requirement 11: Driver Attendance and Trip History

**User Story:** As a driver, I want to track my work attendance and view trip history, so that I can maintain accurate work records and review past assignments.

#### Acceptance Criteria

1. WHEN logging attendance, THE Mobile_App SHALL provide driver login/logout functionality with location validation
2. WHEN viewing trip history, THE Mobile_App SHALL display past transport assignments with completion status
3. WHEN accessing work records, THE Mobile_App SHALL show daily, weekly, and monthly trip summaries
4. WHEN reviewing performance, THE Mobile_App SHALL display on-time performance and completion statistics
5. WHEN attendance data is recorded, THE Mobile_App SHALL submit driver attendance to the Backend_System

### Requirement 12: Driver Vehicle Information and Management

**User Story:** As a driver, I want to access vehicle information and log vehicle-related data, so that I can ensure proper vehicle maintenance and compliance.

#### Acceptance Criteria

1. WHEN viewing vehicle details, THE Mobile_App SHALL display assigned vehicle information and specifications
2. WHEN logging fuel usage, THE Mobile_App SHALL provide optional fuel log entry with odometer readings
3. WHEN maintenance alerts exist, THE Mobile_App SHALL display upcoming maintenance requirements and schedules
4. WHEN vehicle issues occur, THE Mobile_App SHALL allow vehicle problem reporting with severity classification
5. WHEN vehicle data is updated, THE Mobile_App SHALL submit vehicle logs to the Backend_System for fleet management

### Requirement 13: Extended API Integration for Supervisor and Driver Roles

**User Story:** As a system administrator, I want the mobile app to integrate with supervisor and driver API endpoints, so that role-specific data and functionality are properly supported.

#### Acceptance Criteria

1. WHEN making supervisor API calls, THE Mobile_App SHALL use supervisor-specific Backend_System endpoints for team management
2. WHEN making driver API calls, THE Mobile_App SHALL use driver-specific Backend_System endpoints for transport management
3. WHEN API errors occur, THE Mobile_App SHALL display exact error messages returned by the Backend_System for each role
4. WHEN validation fails, THE Mobile_App SHALL rely on Backend_System validation responses for supervisor and driver operations
5. WHEN JWT tokens are used, THE Mobile_App SHALL maintain role-based permissions and access control

### Requirement 14: Backward Compatibility and Worker Module Preservation

**User Story:** As a system administrator, I want the extended application to maintain full compatibility with existing Worker functionality, so that current Worker users are not affected by the new role additions.

#### Acceptance Criteria

1. WHEN Worker users access the app, THE Mobile_App SHALL maintain all existing Worker screens and functionality unchanged
2. WHEN Worker API calls are made, THE Mobile_App SHALL continue using existing Worker API endpoints without modification
3. WHEN Worker navigation is used, THE Mobile_App SHALL preserve existing navigation structure and behavior
4. WHEN Worker data is accessed, THE Mobile_App SHALL maintain existing data models and state management
5. WHEN Worker features are updated, THE Mobile_App SHALL ensure no breaking changes to existing Worker workflows

### Requirement 15: Enhanced Profile Management for All Roles

**User Story:** As a supervisor or driver, I want to access role-appropriate profile information and settings, so that I can manage my account and view relevant personal data.

#### Acceptance Criteria

1. WHEN accessing profile information, THE Mobile_App SHALL display role-specific profile data from the Backend_System
2. WHEN viewing team assignments, THE Mobile_App SHALL show supervisor's assigned workers and projects
3. WHEN displaying vehicle assignments, THE Mobile_App SHALL show driver's assigned vehicles and routes
4. WHEN managing certifications, THE Mobile_App SHALL display role-relevant certifications and expiry alerts
5. WHEN updating profile data, THE Mobile_App SHALL submit changes to appropriate Backend_System endpoints

### Requirement 16: Notification Placeholders for Future Implementation

**User Story:** As a supervisor or driver, I want to see notification placeholders in the interface, so that future notification features can be easily integrated.

#### Acceptance Criteria

1. WHEN accessing notification screens, THE Mobile_App SHALL display placeholder interfaces for supervisor notifications
2. WHEN viewing driver notifications, THE Mobile_App SHALL show placeholder interfaces for transport-related alerts
3. WHEN notification features are implemented, THE Mobile_App SHALL have prepared interfaces for easy integration
4. WHEN role-specific notifications are needed, THE Mobile_App SHALL have separate notification handling for each role
5. WHEN notification settings are accessed, THE Mobile_App SHALL provide placeholder settings for future notification preferences