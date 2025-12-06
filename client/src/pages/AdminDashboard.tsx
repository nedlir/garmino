import { useUsers } from '../hooks/useAuth';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/Button';

export const AdminDashboard = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { data: users, error, isLoading } = useUsers();

  const handleLogout = () => {
    clearAuth();
  };

  return (
    <div>
      <div>Admin Dashboard</div>
      
      {isLoading && <div>Loading users...</div>}
      
      {error && (
        <div>
          Error: {error instanceof Error ? error.message : 'Failed to load users'}
        </div>
      )}
      
      {!isLoading && !error && users && (
        <div>
          <div>Users:</div>
          <ul>
            {users.map((user) => (
              <li key={user.userId}>{user.email}</li>
            ))}
          </ul>
        </div>
      )}
      
      <Button onClick={handleLogout}>Logout</Button>
    </div>
  );
};
