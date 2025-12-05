import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../hooks/useAuth';

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
    <div>
      <div>Register</div>
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
        <div>
          <label>Role:</label>
          <div>
            <label>
              <input
                type="radio"
                name="role"
                value="user"
                checked={role === 'user'}
                onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
              />
              user
            </label>
            <label>
              <input
                type="radio"
                name="role"
                value="admin"
                checked={role === 'admin'}
                onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
              />
              admin
            </label>
          </div>
        </div>
        <button type="submit" disabled={isPending}>
          {isPending ? 'Registering...' : 'Register'}
        </button>
      </form>
      <div>
        <Link to="/login">Already have an account? Login</Link>
      </div>
      {error && (
        <div>
          {error instanceof Error ? error.message : 'Registration failed'}
        </div>
      )}
    </div>
  );
};
