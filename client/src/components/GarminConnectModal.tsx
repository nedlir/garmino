import { useState } from 'react';
import { useConnectGarmin } from '../hooks/useGarmin';

interface GarminConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GarminConnectModal = ({ isOpen, onClose, onSuccess }: GarminConnectModalProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { mutate: connect, isPending: isConnecting, error: connectError } = useConnectGarmin();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    connect(
      { username, password },
      {
        onSuccess: () => {
          setUsername('');
          setPassword('');
          onSuccess();
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
    onClose();
  };

  return (
    <div onClick={handleClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <div>
          <div>Connect Garmin Account</div>
          <button
            onClick={handleClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="garmin-username">
              Garmin Username
            </label>
            <input
              id="garmin-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="Enter your Garmin username"
              disabled={isConnecting}
            />
          </div>

          <div>
            <label htmlFor="garmin-password">
              Garmin Password
            </label>
            <input
              id="garmin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your Garmin password"
              disabled={isConnecting}
            />
          </div>

          {connectError && (
            <div>
              {connectError instanceof Error ? connectError.message : 'Failed to connect'}
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isConnecting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
