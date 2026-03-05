// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PermissionRoute from "./guards/PermissionRoute";

// Pages
import LoginPage from "./features/Login/LoginPage.js";
import Unauthorized from "./features/Unauthorized/Unauthorized.jsx";
import NotFound from "./features/Not found/NotFound.js";
import ExecutiveDashboard from "./features/boss/Dashboard/ExecutiveDashboard.jsx";
import HomePage from "./features/Home/HomePage.js";
// import Dashboard from "./pages/Dashboard";
import ProjectLists from "./features/boss/Projects/ProjectLists.jsx";
import ProjectOverview from "./features/boss/Projects/ProjectOverview.jsx";
//import ReportsDashboard from "./pages/boss/ReportsDashboard";
import AttendanceToday from "./features/boss/Attendance/AttendanceToday.jsx";
import ProjectWorkerAttendance from "./features/boss/Attendance/ProjectWorkerAttendance.jsx";
import BossProgressReports from './features/boss/ProgressReports/BossProgressReports.jsx';
import ProjectMaster from "./features/ProjectMaster/ProjectMaster.jsx";
import ProjectList from './features/ProjectMaster/ProjectList.jsx';
import DailyManpowerDeployment from './features/admin/execution/taskManagement/DailyManpowerDeployment';
import ProgressReportDashboard from './features/Progress/ProgressReportDashboard.jsx';
import ProjectProgressDashboard from './features/Progress/ProjectProgressDashboard.jsx';
import EmployeesPage from './features/Employee/EmployeesPage.jsx';
import EmployeeList from './features/Employee/EmployeeList.jsx';
import VehiclesPage from './features/vehicle/VehiclesPage.jsx';
import AdminDashboard from "./features/admin/Dashboard/AdminDashboard.jsx";
import DriversPage from './features/Driver/DriversPage.jsx';
import FleetTasksPage from './features/Fleet Task/FleetTasksPage.jsx';
import TaskPage from './features/Task/TaskPage.jsx';
import WorkerPage from './features/worker/WorkerPage';
import ManagerDashboard from "./features/manager/ManagerDashboard";
import ProjectManagerTasks from "./features/manager/ProjectManagerTasks";
import TransportAssignment from "./features/transport/TransportAssignment";
import DriverTasksPage from "./features/transport/DriverTasksPage";
import AdminAttendanceToday from "./features/admin/Attendance/AdminAttendanceToday.jsx";
import ClientsPage from "./features/client/ClientsPage.jsx";
import CompaniesPage from "./features/Company/CompaniesPage.jsx";
import RolesPage from "./features/admin/Role/RolesPage.jsx";

 import UserManagementPage from "./features/admin/User/UserManagementPage.jsx";
import PermissionManagementPage from "./features/admin/Permission/PermissionManagementPage.jsx";
// ... import other pages

import TopHeader from "./components/TopHeader/TopHeader.js";
import SideNav from "./components/sidenav/SideNav.js";
 import RolePermissionMappingPage from "./features/admin/RolePermission/RolePermissionMappingPage.jsx";
 import DailyProgressList from "./features/manager/ManagerDailyProgressApproval/DailyProgressList";
 import PayrollPreview from "./features/payroll/PayrollPreview";
import QuotationTermsPage from "./features/quotation/QuotationTermsPage.jsx";
import QuotationListPage from "./features/quotation/QuotationListPage.jsx";
import QuotationListPageWireframe from "./features/quotation/QuotationListPageWireframe.jsx";
import QuotationFormPage from "./features/quotation/QuotationFormPage.jsx";
import QuotationFormPageWireframe from "./features/quotation/QuotationFormPageWireframe.jsx";
import QuotationViewPage from "./features/quotation/QuotationViewPage.jsx";
import CostBreakdownPage from "./features/costBreakdown/CostBreakdownPage.jsx";

// Layout
function AppLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(true);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const closeSidebar = () => setSidebarCollapsed(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${sidebarCollapsed ? "" : "opacity-70 bg-gray-800 bg-opacity-20"}`}>
        <TopHeader onToggleSidebar={toggleSidebar} />
      </div>
      <div className="p-4 flex">
        <SideNav collapsed={sidebarCollapsed} onClose={closeSidebar} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

// Routes Component
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes */}


      <Route
        path="/"
        element={
          <PermissionRoute permission="HOME_VIEW">
            <AppLayout>
              <HomePage />
            </AppLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/boss/dashboard"
        element={
          <PermissionRoute permission="DASHBOARD_VIEW">
            <AppLayout>
              <ExecutiveDashboard />
            </AppLayout>
          </PermissionRoute>
        }
      />
      {/* Protected Routes */}
      <Route
        path="/boss/dashboard"
        element={
          <PermissionRoute permission="DASHBOARD_VIEW">
            <AppLayout>
              <ExecutiveDashboard />
            </AppLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/boss/projects"
        element={
          <PermissionRoute permission="PROJECT_OVERVIEW_VIEW">
            <AppLayout>
              <ProjectLists />
            </AppLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/boss/projects/:projectId"
        element={
          <PermissionRoute permission="PROJECT_OVERVIEW_VIEW">
            <AppLayout>
              <ProjectOverview />
            </AppLayout>
          </PermissionRoute>
        }
      />
        
      <Route
        path="/boss/progress-reports"
        element={
          <PermissionRoute permission="BOSS_PROGRESS_VIEW">
            <AppLayout>
              <BossProgressReports />
            </AppLayout>
          </PermissionRoute>
        }
      />

     

      <Route
        path="/attendance/today"
        element={
          <PermissionRoute permission="ATTENDANCE_VIEW">
            <AppLayout>
              <AttendanceToday />
            </AppLayout>
          </PermissionRoute>
        }
      />

      <Route
        path="/attendance/projects/:projectId"
        element={
          <PermissionRoute permission="ATTENDANCE_VIEW">
            <AppLayout>
              <ProjectWorkerAttendance />
            </AppLayout>
          </PermissionRoute>
        }
      />


      {/* <Route
        path="/dashboard"
        element={
          <PermissionRoute permission="DASHBOARD_VIEW">
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </PermissionRoute>
        }
      /> */}
      <Route
        path="/project"
        element={
          <PermissionRoute permission="PROJECT_VIEW">
            <AppLayout>
              <ProjectList />
            </AppLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/project-master"
        element={
          <PermissionRoute permission="PROJECT_VIEW">
            <AppLayout>
              <ProjectMaster />
            </AppLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/execution/task-management/daily-worker-deployment"
        element={
          <PermissionRoute permission="DEPLOYMENT_VIEW">
            <AppLayout>
              <DailyManpowerDeployment />
            </AppLayout>
          </PermissionRoute>
        }
      />

      <Route
        path="/progress-dashboard"
        element={
          <PermissionRoute permission="DEPLOYMENT_VIEW">
            <AppLayout>
              <ProjectProgressDashboard />
            </AppLayout>
          </PermissionRoute>
        }
      />

      <Route
        path="/progress-report"
        element={
          <PermissionRoute permission="PROGRESS_REPORT_VIEW">
            <AppLayout>
              <ProgressReportDashboard />
            </AppLayout>
          </PermissionRoute>
        }
      />

      <Route
        path="/employees/create"
        element={
          <PermissionRoute permission="EMPLOYEE_VIEW">
            <AppLayout>
              <EmployeesPage />
            </AppLayout>
          </PermissionRoute>
        }
      />
       <Route
        path="/employees/:id"
        element={
          <PermissionRoute permission="EMPLOYEE_VIEW">
            <AppLayout>
              <EmployeesPage />
            </AppLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <PermissionRoute permission="EMPLOYEE_VIEW">
            <AppLayout>
              <EmployeeList />
            </AppLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/vehicles"
        element={
          <PermissionRoute permission="VEHICLE_VIEW">
            <AppLayout>
              <VehiclesPage />
            </AppLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <PermissionRoute permission="ADMIN_DASHBOARD_VIEW">
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          </PermissionRoute>
        }
      />
      <Route
        path="/drivers"
        element={
          <PermissionRoute permission="DRIVER_VIEW">
            <AppLayout>
              <DriversPage />
            </AppLayout>
          </PermissionRoute>
        }
      />

       <Route
        path="/fleet-tasks"
        element={
          <PermissionRoute permission="FLEET_TASK_VIEW">
            <AppLayout>
              <FleetTasksPage />
            </AppLayout>
          </PermissionRoute>
        }
      />

       <Route
        path="tasks"
        element={
          <PermissionRoute permission="TASK_VIEW">
            <AppLayout>
              <TaskPage />
            </AppLayout>
          </PermissionRoute>
        }
      />

      <Route
  path="/workers"
  element={
    <PermissionRoute permission="WORKER_VIEW">
      <AppLayout>
        <WorkerPage />
      </AppLayout>
    </PermissionRoute>
  }
/>


<Route
          path="/manager/dashboard"
          element={
            <PermissionRoute permission="MANAGER_DASHBOARD_VIEW">
              <AppLayout>
                <ManagerDashboard />
              </AppLayout>
            </PermissionRoute>
          }
        />
        <Route
          path="/manager/tasks"
          element={
            <PermissionRoute permission="TASK_MANAGEMENT_VIEW">
              <AppLayout>
                <ProjectManagerTasks />
              </AppLayout>
            </PermissionRoute>
          }
        />
         <Route
          path="/manager/daily-progress"
          element={
            <PermissionRoute permission="DAILY_PROGRESS_APPROVAL_VIEW">
              <AppLayout>
                <DailyProgressList />
              </AppLayout>
            </PermissionRoute>
          }
        />
         <Route
          path="/transport/assignment"
          element={
            <PermissionRoute permission="TRANSPORT_ASSIGNMENT_VIEW">
              <AppLayout>
                <TransportAssignment />
              </AppLayout>
            </PermissionRoute>
          }
        />


        <Route
  path="/transport/driver-tasks"
  element={
    <PermissionRoute permission="TRANSPORT_TASK_VIEW">
      <AppLayout>
        <DriverTasksPage />
      </AppLayout>
    </PermissionRoute>
  }
/>


 <Route
  path="/admin/attendance/today"
  element={
    <PermissionRoute permission="ADMIN_ATTENDANCE_VIEW">
      <AppLayout>
        <AdminAttendanceToday />
      </AppLayout>
    </PermissionRoute>
  }
/>
 <Route
  path="/clients"
  element={
    <PermissionRoute permission="CLIENT_VIEW">
      <AppLayout>
        <ClientsPage />
      </AppLayout>
    </PermissionRoute>
  }
/>
 <Route
  path="/companies"
  element={
    <PermissionRoute permission="CLIENT_VIEW">
      <AppLayout>
        <CompaniesPage />
      </AppLayout>
    </PermissionRoute>
  }
/>
 <Route
  path="/admin/roles"
  element={
    <PermissionRoute permission="ADMIN_DASHBOARD_VIEW">
      <AppLayout>
        <RolesPage />
      </AppLayout>
    </PermissionRoute>
  }
/>

 <Route
  path="/admin/user-management"
  element={
    <PermissionRoute permission="ADMIN_DASHBOARD_VIEW">
      <AppLayout>
        <UserManagementPage />
      </AppLayout>
    </PermissionRoute>
  }
/>
 <Route
  path="/admin/permission-management"
  element={
    <PermissionRoute permission="ADMIN_DASHBOARD_VIEW">
      <AppLayout>
        <PermissionManagementPage />
      </AppLayout>
    </PermissionRoute>
  }
/>

<Route
  path="/role-permissions"
  element={
    <PermissionRoute permission="ADMIN_DASHBOARD_VIEW">
      <AppLayout>
        <RolePermissionMappingPage />
      </AppLayout>
    </PermissionRoute>
  }
/>

<Route
  path="/payroll"
  element={
    <PermissionRoute permission="PAYROLL_VIEW">
      <AppLayout>
        <PayrollPreview />
      </AppLayout>
    </PermissionRoute>
  }
/>

<Route
  path="/quotation-terms"
  element={
    <PermissionRoute permission="QUOTATION_VIEW">
      <AppLayout>
        <QuotationTermsPage />
      </AppLayout>
    </PermissionRoute>
  }
/>

<Route
  path="/quotation-terms/:quotationId"
  element={
    <PermissionRoute permission="QUOTATION_VIEW">
      <AppLayout>
        <QuotationTermsPage />
      </AppLayout>
    </PermissionRoute>
  }
/>

<Route
  path="/quotations"
  element={
    <PermissionRoute permission="QUOTATION_VIEW">
      <AppLayout>
        <QuotationListPageWireframe />
      </AppLayout>
    </PermissionRoute>
  }
/>

<Route
  path="/quotations/new"
  element={
    <PermissionRoute permission="QUOTATION_VIEW">
      <AppLayout>
        <QuotationFormPageWireframe />
      </AppLayout>
    </PermissionRoute>
  }
/>

<Route
  path="/quotations/:id"
  element={
    <PermissionRoute permission="QUOTATION_VIEW">
      <AppLayout>
        <QuotationViewPage />
      </AppLayout>
    </PermissionRoute>
  }
/>

<Route
  path="/quotations/:id/edit"
  element={
    <PermissionRoute permission="QUOTATION_VIEW">
      <AppLayout>
        <QuotationFormPageWireframe />
      </AppLayout>
    </PermissionRoute>
  }
/>

<Route
  path="/quotations/:id/terms"
  element={
    <PermissionRoute permission="QUOTATION_VIEW">
      <AppLayout>
        <QuotationTermsPage />
      </AppLayout>
    </PermissionRoute>
  }
/>

<Route
  path="/cost-breakdown"
  element={
    <PermissionRoute permission="QUOTATION_VIEW">
      <AppLayout>
        <CostBreakdownPage />
      </AppLayout>
    </PermissionRoute>
  }
/>



 

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// Top-level App
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}


