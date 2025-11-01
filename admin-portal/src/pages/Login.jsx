import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    const ok = await login(email);
    setLoading(false);
    if (ok) navigate(from, { replace: true });
    else setError('Only admin email is allowed.');
  };

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="brand-badge" />
          <div className="text-xl font-extrabold tracking-wide">Admin Sign In</div>
        </div>
        <p className="help mb-3">Enter the administrator email to continue.</p>

        <form onSubmit={onSubmit} className="grid gap-2">
          <input
            className="input"
            type="email"
            placeholder="admin@yourcompany.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          {error && <div className="text-danger text-xs">{error}</div>}
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Verifying…' : 'Continue'}
          </button>
        </form>

        <p className="help mt-3">
          Change allowed email via <code>VITE_ADMIN_EMAIL</code> in <code>.env</code>.
        </p>
      </div>
    </div>
  );
}
