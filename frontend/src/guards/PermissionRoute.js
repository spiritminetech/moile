import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PermissionRoute = ({ permission, children }) => {
  const { user, permissions = [] } = useAuth();
  console.log("user",useAuth())
  console.log("permissions",permissions)
  if (!user) return <Navigate to="/login" replace />;
 if (user.permissions.includes(permission)) return children;

  return <Navigate to="/unauthorized" replace />;
};

export default PermissionRoute;
