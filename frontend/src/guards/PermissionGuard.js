// src/guards/PermissionGuard.jsx
import React from "react";
import { Navigate } from "react-router-dom";

// children: component to render
// permission: string or array of permissions
export default function PermissionGuard({ permission, children }) {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];
  const role = user.role;

  // Admin bypasses permission check
  if (role === "ADMIN") return children;

  // Support single permission or array
  if (permission) {
    if (Array.isArray(permission)) {
      const hasPermission = permission.some((p) => permissions.includes(p));
      if (!hasPermission) return <Navigate to="/unauthorized" replace />;
    } else {
      if (!permissions.includes(permission)) return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}


