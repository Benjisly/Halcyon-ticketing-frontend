import React, { useState, useEffect } from 'react';
import AdminDashboard from './AdminDashboard';
import SubmitForm from './SubmitForm';
import Login from './Login';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const ADMIN_SECRET = process.env.REACT_APP_ADMIN_SECRET || '';

export { API, ADMIN_SECRET };

export default function App() {
  const path = window.location.pathname;
  const isSubmit = path === '/submit';

  const [authed, setAuthed] = useState(() => {
    return sessionStorage.getItem('hmh_authed') === '1';
  });

  function handleLogin(ok) {
    if (ok) { sessionStorage.setItem('hmh_authed', '1'); setAuthed(true); }
  }
  function handleLogout() {
    sessionStorage.removeItem('hmh_authed'); setAuthed(false);
  }

  if (isSubmit) return <SubmitForm />;
  if (!authed) return <Login onLogin={handleLogin} />;
  return <AdminDashboard onLogout={handleLogout} />;
}
