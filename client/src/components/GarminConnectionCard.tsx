import { useGarminStatus, useDisconnectGarmin } from '../hooks/useGarmin';
import { Button } from './Button';
import { Loading } from './Loading';

interface GarminConnectionCardProps {
  onConnectClick: () => void;
}

export const GarminConnectionCard = ({ onConnectClick }: GarminConnectionCardProps) => {
  const { data: status, isLoading, error } = useGarminStatus();
  const { mutate: disconnect, isPending: isDisconnecting } = useDisconnectGarmin();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  // Treat errors as "not connected" state to allow user to proceed
  const isConnected = status?.isConnected ?? false;
  const showError = error && !isLoading;

  return (
    <div className="card p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-soft">
          <span className="text-3xl">⌚</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Garmin Connect</h2>
          <p className="text-sm text-gray-500 mt-0.5">Sync your fitness data seamlessly</p>
        </div>
      </div>
      
      {isLoading ? (
        <Loading message="Loading connection status..." size="md" />
      ) : (
        <>
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Connection Status</span>
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse-soft' : 'bg-gray-400'}`}></div>
                <span className={`text-sm font-bold ${isConnected ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {isConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>

            {isConnected && status && (
              <div className="space-y-3 p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl border border-blue-100/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Connected At</span>
                  <span className="text-sm font-semibold text-gray-900">{formatDate(status.connectedAt)}</span>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Last Sync</span>
                  <span className="text-sm font-semibold text-gray-900">{formatDate(status.lastSyncAt)}</span>
                </div>
              </div>
            )}

            {showError && (
              <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200 rounded-2xl p-5">
                <div className="flex gap-3">
                  <span className="text-amber-500 text-xl">⚠️</span>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    Unable to verify connection status. You can still connect your account.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            {isConnected ? (
              <Button 
                variant="danger"
                onClick={handleDisconnect} 
                isLoading={isDisconnecting}
              >
                Disconnect
              </Button>
            ) : (
              <Button 
                variant="primary"
                onClick={onConnectClick}
              >
                Connect Garmin Account
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
