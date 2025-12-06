import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { GarminConnectionCard } from '../components/GarminConnectionCard';
import { GarminConnectModal } from '../components/GarminConnectModal';
import { ActivityList } from '../components/ActivityList';
import { useGarminStatus } from '../hooks/useGarmin';

export const UserDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { data: connectionStatus, refetch: refetchStatus } = useGarminStatus();

  const handleLogout = () => {
    clearAuth();
  };

  const handleConnectClick = () => {
    setShowConnectModal(true);
  };

  const handleConnectSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    refetchStatus();
  };

  const handleRefresh = () => {
    refetchStatus();
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div>
      <div>
        <div>Dashboard</div>
        <div>
          <span>{user?.email}</span>
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div>
        <GarminConnectionCard onConnectClick={handleConnectClick} />

        {connectionStatus?.isConnected && (
          <div>
            <button onClick={handleRefresh}>
              Refresh Activities
            </button>
          </div>
        )}

        {connectionStatus?.isConnected && (
          <ActivityList refreshTrigger={refreshTrigger} />
        )}
      </div>

      <GarminConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={handleConnectSuccess}
      />
    </div>
  );
};
