import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../hooks/useAuth';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  
  const { mutate: login, isPending, error } = useLogin();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    login(
      { email, password },
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
    <div>
      <div>Login</div>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={isPending}>
          {isPending ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div>
        <Link to="/register">Don't have an account? Register</Link>
      </div>
      {error && (
        <div>
          {error instanceof Error ? error.message : 'Login failed'}
        </div>
      )}
    </div>
  );
};
