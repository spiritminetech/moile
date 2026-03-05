// sidebarConfig.js
import {
  HomeOutlined,
  TeamOutlined,
  ProjectOutlined,
  CheckSquareOutlined,
  DeploymentUnitOutlined,
  ScheduleOutlined,
  DashboardOutlined,
  CarOutlined,
  UserOutlined,
  FileTextOutlined,
  SafetyOutlined,
  SecurityScanOutlined,
  FileProtectOutlined,
  DollarOutlined,
  PlusOutlined,
} from '@ant-design/icons';

export const SIDEBAR_CONFIG = [
  // Home
  {
    key: '/',
    label: 'Home',
    icon: HomeOutlined,
    permission: 'HOME_VIEW',
    path: '/',
  },
  {
  key: '/boss/dashboard',
  label: ' Dashboard',
  icon: DashboardOutlined,
  permission: 'DASHBOARD_VIEW',
  path: '/boss/dashboard',
},

{
  key: '/payroll',
  label: ' Payroll',
  icon: DashboardOutlined,
  permission: 'PAYROLL_VIEW',
  path: '/payroll',
},

// Quotations - Wireframe Based Structure
{
  key: 'quotations',
  label: 'Quotations',
  permission: 'QUOTATION_VIEW',
  icon: FileTextOutlined,
  children: [
    {
      key: '/quotations',
      label: 'Quotation List',
      icon: FileTextOutlined,
      permission: 'QUOTATION_VIEW',
      path: '/quotations',
    },
    {
      key: '/quotations/new',
      label: 'Create Quotation',
      icon: PlusOutlined,
      permission: 'QUOTATION_VIEW',
      path: '/quotations/new',
    },
    // {
    //   key: '/quotation-terms',
    //   label: 'Terms Manager',
    //   icon: FileProtectOutlined,
    //   permission: 'QUOTATION_VIEW',
    //   path: '/quotation-terms',
    // },
    // {
    //   key: '/cost-breakdown',
    //   label: 'Cost Breakdown',
    //   icon: DollarOutlined,
    //   permission: 'QUOTATION_VIEW',
    //   path: '/cost-breakdown',
    // },
  ],
},
  
// Quotations
// {
//   key: 'quotations',
//   label: 'Quotations',
//   permission: 'QUOTATION_VIEW',
//   icon: FileTextOutlined,
//   children: [
//     {
//       key: '/quotations',
//       label: 'Quotation List',
//       icon: FileTextOutlined,
//       permission: 'QUOTATION_VIEW',
//       path: '/quotations',
//     },
//     {
//       key: '/quotations/new',
//       label: 'Create Quotation',
//       icon: FileTextOutlined,
//       permission: 'QUOTATION_CREATE',
//       path: '/quotations/new',
//     },
//     {
//       key: '/quotation-terms',
//       label: 'Quotation Terms',
//       icon: FileProtectOutlined,
//       permission: 'QUOTATION_VIEW',
//       path: '/quotation-terms',
//     },
//   ],
// },
// // {
//   key: '/boss/projects/:projectId',
//   label: 'Project Details',
//   icon: ProjectOutlined,
//   path: '/boss/projects/1',
//   permission:'PROJECT_OVERVIEW_VIEW',
//   //permissions: ['PROJECT_OVERVIEW_VIEW', 'PROJECT_PROGRESS_VIEW', 'AI_RISK_VIEW'],
// },
{
  key: '/boss/projects',
  label: 'Projects',
  icon: ProjectOutlined,
  path: '/boss/projects',
  permission: 'PROJECT_OVERVIEW_VIEW'
},

// {
//     key: '/boss/reports',
//     label: 'Reports Dashboard',
//     icon: FileTextOutlined,
//     path: '/boss/reports',
//     permission: 'REPORT_VIEW'
//   },
  {
    key: 'Company',
    label: 'Company Setup',
    permission: 'COMPANY_VIEW',
    icon: TeamOutlined,
    children: [
      {
        key: '/companies',
        label: 'Company master',
                icon: TeamOutlined, 
        permission: 'COMPANY_VIEW',
        path: '/companies',
      },
      {
        key: '/clients',
        label: 'Client Master',
        icon: UserOutlined,
        permission: 'CLIENT_VIEW',
        path: '/clients',
      }
     
    ],
  },
{
  key: '/attendance/today',
  label: 'Attendance',
  icon: CheckSquareOutlined,
  permission: 'ATTENDANCE_VIEW',
  path: '/attendance/today',
},
   {
    key: '/boss/progress-reports',
    label: 'Progress Reports',
    icon: FileTextOutlined,
    permission: 'BOSS_PROGRESS_VIEW',
    path: '/boss/progress-reports',
  },
  {
  key: '/admin/attendance/today',
  label: 'Attendance',
  icon: CheckSquareOutlined,
  permission: 'ADMIN_ATTENDANCE_VIEW',
  path: '/admin/attendance/today',
},
  
// {
//       key: '/attendance/projects',
//       label: 'Worker Attendance',
//       path: '/attendance/projects/:projectId',
//       icon:  CheckSquareOutlined, // 🔑 prefix match
//       permission: 'ATTENDANCE_VIEW',
//       hidden: true, // 👈 IMPORTANT
//     },


{
  key: '/admin/dashboard',
  label: ' Dashboard',
  icon: DashboardOutlined,
  permission: 'ADMIN_DASHBOARD_VIEW',
  path: '/admin/dashboard',
},

{
  key: 'admin-settings',
  label: 'Admin Settings',
  permission: 'ADMIN_DASHBOARD_VIEW',
  icon: SafetyOutlined,
  children: [
    {
      key: '/admin/roles',
      label: 'Role Management',
      icon: SafetyOutlined,
      permission: 'ADMIN_DASHBOARD_VIEW',
      path: '/admin/roles',
    },
    {
      key: '/admin/user-management',
      label: 'User Management',
      icon: UserOutlined,
      permission: 'ADMIN_DASHBOARD_VIEW',
      path: '/admin/user-management',
    },
    {
      key: '/admin/permission-management',
      label: 'Permission Management',
      icon: SecurityScanOutlined,
      permission: 'ADMIN_DASHBOARD_VIEW',
      path: '/admin/permission-management',
    },
    {
      key: '/admin/role-permission-mapping',
      label: 'Role Permission Mapping',
      icon: TeamOutlined,
      permission: 'ADMIN_DASHBOARD_VIEW',
      path: '/role-permissions',
    },
  ],
},

{
  key: '/transport/driver-tasks',
  label: 'Driver Tasks',
  icon: CarOutlined,
  permission: 'TRANSPORT_TASK_VIEW',
  path: '/transport/driver-tasks',
},
{
  key: "/transport/assignment",
  label: "Transport Assignment",
  icon: CarOutlined,
  permission: "TRANSPORT_ASSIGNMENT_VIEW",
  path: "/transport/assignment"
},




  // Execution
  {
    key: 'execution',
    label: ' Deployment Planning',
    permission: 'DEPLOYMENT_VIEW',
    icon: DeploymentUnitOutlined,
    children: [
      {
        key: '/execution/task-management/daily-worker-deployment',
        label: 'Daily Worker Deployment List',
         icon: CheckSquareOutlined,
        permission: 'DEPLOYMENT_VIEW',
        path: '/execution/task-management/daily-worker-deployment',
      },
      {
        key: '/execution/task-management/daily-manpower-status',
        label: 'Assign Workers (Next Day)',
        icon: UserOutlined, 
        permission: 'DEPLOYMENT_VIEW',
        path: '/execution/task-management/daily-worker-deployment',
      },
    ],
  },

   {
    key: '/workers',
    label: 'Workers',
    icon: UserOutlined ,
    permission: 'WORKER_VIEW',
    path: '/workers'
  },
  
   {
    key: '/manager/dashboard',
    label: 'Manager Dashboard',
    icon: DashboardOutlined,
    permission: 'MANAGER_DASHBOARD_VIEW', // your permission system
    path: '/manager/dashboard',
  },
  {
    key: '/manager/tasks',
    label: 'Task Management',
    icon: ScheduleOutlined,
    permission: 'TASK_MANAGEMENT_VIEW',
    path: '/manager/tasks',
  },
   {
    key: '/manager/daily-progress',
    label: 'Daily Progress Approval',
    icon: ScheduleOutlined,
    permission: 'DAILY_PROGRESS_APPROVAL_VIEW',
    path: '/manager/daily-progress',
  },

  // Projects
  // {
  //   key: 'projects',
  //   label: 'Projects',
  //   icon: ProjectOutlined,
  //   children: [
  //     {
  //       key: '/project',
  //       label: 'Project',
  //    //   permission: 'PROJECT_VIEW',
  //       path: '/project',
  //     },
  //   ],
  // },

  {
    key: 'projects',
    label: 'Projects',
     permission: 'PROJECT_VIEW',
    icon: ProjectOutlined,
    children: [
      {
        key: '/project',
        label: 'Project',
        icon: ProjectOutlined,
        permission: 'PROJECT_VIEW',
        path: '/project',
      },
    
    ],
  },

  // Progress
  {
    key: 'progress',
    label: 'Progress',
    permission: 'PROGRESS_DASHBOARD_VIEW',
    icon: DashboardOutlined,
    children: [
      {
        key: '/progress-dashboard',
        label: 'Progress Dashboard',
          icon: DashboardOutlined,
        permission: 'PROGRESS_DASHBOARD_VIEW',
        path: '/progress-dashboard',
      },
      {
        key: '/progress-report',
        label: 'Progress Report',
        icon: FileTextOutlined, 
        permission: 'PROGRESS_REPORT_VIEW',
        path: '/progress-report',
      },
    ],
  },

  // Organization
  {
    key: 'Employees',
    label: 'Employees',
    permission: 'EMPLOYEE_VIEW',
    icon: TeamOutlined,
    children: [
     
      {
        key: '/employees',
        label: 'Employees List',
         icon: TeamOutlined,
        permission: 'EMPLOYEE_VIEW',
        path: '/employees',
      },
       {
        key: '/employees/create',
        label: 'Add Employee',
         icon: TeamOutlined,
        permission: 'EMPLOYEE_VIEW',
        path: '/employees/create',
      },
     
    ],
  },

 

   

  // Fleet
  {
    key: 'fleet',
    label: 'Fleet',
    permission: 'VEHICLE_VIEW',
    icon: CarOutlined,
    children: [
      {
        key: '/vehicles',
        label: 'Vehicles',
                icon: CarOutlined, 
        permission: 'VEHICLE_VIEW',
        path: '/vehicles',
      },
      {
        key: '/drivers',
        label: 'Drivers',
        icon: UserOutlined,
        permission: 'DRIVER_VIEW',
        path: '/drivers',
      },
      {
        key: '/fleet-tasks',
        label: 'Fleet Tasks',
        icon: CheckSquareOutlined, // added
        permission: 'FLEET_TASK_VIEW',
        path: '/fleet-tasks',
      },
    ],
  },

  // Tasks
  {
    key: 'tasks',
    label: 'Tasks',
    permission: 'TASK_VIEW',
    icon: ScheduleOutlined,
    children: [
      {
        key: '/tasks',
        label: 'Tasks',
         icon: ScheduleOutlined,
        permission: 'TASK_VIEW',
        path: '/tasks',
      },
     
     
    ],
  },
];





