import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { GarminConnectionCard } from '../components/GarminConnectionCard';
import { GarminConnectModal } from '../components/GarminConnectModal';
import { ActivityList } from '../components/ActivityList';
import { useGarminStatus } from '../hooks/useGarmin';
import { Button } from '../components/Button';

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
    <div className="min-h-screen animate-fade-in">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100/50 sticky top-0 z-10 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-soft">
                <span className="text-2xl">🏃</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="space-y-8">
          {/* Connection Card */}
          <div className="animate-slide-up">
            <GarminConnectionCard onConnectClick={handleConnectClick} />
          </div>

          {connectionStatus?.isConnected && (
            <div className="flex justify-end animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <Button onClick={handleRefresh} className="inline-flex">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Activities
              </Button>
            </div>
          )}

          {connectionStatus?.isConnected && (
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <ActivityList refreshTrigger={refreshTrigger} />
            </div>
          )}
        </div>
      </main>

      <GarminConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSuccess={handleConnectSuccess}
      />
    </div>
  );
};
