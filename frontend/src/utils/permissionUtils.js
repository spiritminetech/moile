// utils/permissionUtils.js
export const hasPermission = (permissions, required) => {
  if (!required) return true;
  return permissions.includes(required);
};

export const hasRole = (userRole, allowedRoles) => {
  if (!allowedRoles) return true;
  return allowedRoles.includes(userRole);
};
