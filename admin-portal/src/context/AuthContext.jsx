import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@yourcompany.com';
const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ isAuthed: false, email: null });

  useEffect(() => {
    const saved = localStorage.getItem('auth');
    if (saved) setState(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('auth', JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => ({
    ...state,
    login: async (email) => {
      const ok = String(email).trim().toLowerCase() === String(ADMIN_EMAIL).toLowerCase();
      if (ok) setState({ isAuthed: true, email });
      return ok;
    },
    logout: () => setState({ isAuthed: false, email: null }),
  }), [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
