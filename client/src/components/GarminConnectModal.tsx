import { useState } from 'react';
import { useConnectGarmin } from '../hooks/useGarmin';
import { Button } from './Button';

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
    <div 
      className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-soft-lg max-w-md w-full transform animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-7 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-soft">
              <span className="text-2xl">⌚</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Connect Garmin</h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-600 active:scale-95"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-6">
          <div>
            <label htmlFor="garmin-username" className="block text-sm font-semibold text-gray-700 mb-2.5">
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
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="garmin-password" className="block text-sm font-semibold text-gray-700 mb-2.5">
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
              className="input-field"
            />
          </div>

          {connectError && (
            <div className="bg-rose-50/80 backdrop-blur-sm border border-rose-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-rose-500 text-lg">⚠️</span>
                <p className="text-sm text-rose-800 leading-relaxed">
                  {connectError instanceof Error ? connectError.message : 'Failed to connect'}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isConnecting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isConnecting}
              className="flex-1"
            >
              Connect
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
