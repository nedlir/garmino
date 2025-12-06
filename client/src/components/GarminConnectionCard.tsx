import { useGarminStatus, useDisconnectGarmin } from '../hooks/useGarmin';

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
    <div>
      <div>Garmin Connection</div>
      
      {isLoading ? (
        <div>
          <span>Loading connection status...</span>
        </div>
      ) : (
        <>
          <div>
            <div>
              <span>Status: </span>
              <span>
                {isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>

            {isConnected && status && (
              <>
                <div>
                  <span>Connected At: </span>
                  <span>{formatDate(status.connectedAt)}</span>
                </div>
                <div>
                  <span>Last Sync: </span>
                  <span>{formatDate(status.lastSyncAt)}</span>
                </div>
              </>
            )}

            {showError && (
              <div>
                <span>
                  Unable to verify connection status. You can still connect your account.
                </span>
              </div>
            )}
          </div>

          <div>
            {isConnected ? (
              <button 
                onClick={handleDisconnect} 
                disabled={isDisconnecting}
              >
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            ) : (
              <button onClick={onConnectClick}>
                Connect Garmin Account
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
