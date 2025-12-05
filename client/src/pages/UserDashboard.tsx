import { useAuthStore } from '../store/authStore';

export const UserDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuth();
  };

  return (
    <div>
      <div>hello {user?.email}!</div>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};
