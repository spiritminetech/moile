import { useAuth } from '../context/AuthContext';

export default function PermissionGuard({ permission, children }) {
  const { permissions = [] } = useAuth();

  if (!permissions.includes(permission)) return null;

  return children;
}
