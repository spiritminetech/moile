import React from 'react';

export const buildMenuItems = (config, permissions = [], role = null) => {
  return config
    .map(item => {
      const canView =
        (!item.permission || permissions.includes(item.permission)) &&
        (!item.roles || item.roles.includes(role));

      if (!canView) return null;

      const children = item.children?.length
        ? buildMenuItems(item.children, permissions, role)
        : undefined;

      return {
        key: item.key,
        icon: item.icon ? <item.icon /> : null,
        label: item.label,
        children,
        defaultPath: item.defaultPath || item.path,
      };
    })
    .filter(Boolean);
};
