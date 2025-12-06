import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../hooks/useAuth';
import { Button } from '../components/Button';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const navigate = useNavigate();
  
  const { mutate: register, isPending, error } = useRegister();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    register(
      { email, password, role },
      {
        onSuccess: (data) => {
          if (data.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-3xl mb-6 shadow-soft-lg">
            <span className="text-4xl">💪</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Get Started</h1>
          <p className="text-gray-500 text-lg">Create your account and start tracking</p>
        </div>

        <div className="card p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Account Type
              </label>
              <div className="flex gap-3">
                <label className="flex-1 relative group">
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={role === 'user'}
                    onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                    className="peer sr-only"
                  />
                  <div className="card p-5 cursor-pointer peer-checked:ring-2 peer-checked:ring-primary-400 peer-checked:border-primary-400 peer-checked:bg-primary-50/50 group-hover:border-gray-300 transition-all">
                    <div className="text-center">
                      <span className="text-3xl mb-2 block">👤</span>
                      <span className="text-sm font-semibold text-gray-700">User</span>
                    </div>
                  </div>
                </label>
                <label className="flex-1 relative group">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={role === 'admin'}
                    onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                    className="peer sr-only"
                  />
                  <div className="card p-5 cursor-pointer peer-checked:ring-2 peer-checked:ring-primary-400 peer-checked:border-primary-400 peer-checked:bg-primary-50/50 group-hover:border-gray-300 transition-all">
                    <div className="text-center">
                      <span className="text-3xl mb-2 block">👑</span>
                      <span className="text-sm font-semibold text-gray-700">Admin</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50/80 backdrop-blur-sm border border-rose-200 rounded-xl p-4 animate-slide-up">
                <div className="flex items-start gap-3">
                  <span className="text-rose-500 text-lg">⚠️</span>
                  <p className="text-sm text-rose-800 leading-relaxed">
                    {error instanceof Error ? error.message : 'Registration failed'}
                  </p>
                </div>
              </div>
            )}

            <Button type="submit" isLoading={isPending} size="lg">
              Create Account
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
