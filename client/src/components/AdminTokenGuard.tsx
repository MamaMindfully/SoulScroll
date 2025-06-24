import React, { useEffect, useState } from 'react';
import { Shield, Lock } from 'lucide-react';

interface AdminTokenGuardProps {
  children: React.ReactNode;
}

export default function AdminTokenGuard({ children }: AdminTokenGuardProps) {
  const [accessGranted, setAccessGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  });

  const checkAdminAccess = () => {
    const token = localStorage.getItem('soul_admin_token');
    const VALID_TOKEN = process.env.REACT_APP_ADMIN_TOKEN || 'scrollmaster2025';

    if (token === VALID_TOKEN) {
      setAccessGranted(true);
      setLoading(false);
    } else {
      requestToken();
    }
  };

  const requestToken = () => {
    const input = prompt('🔒 Admin Access Required\n\nEnter admin token:');
    const VALID_TOKEN = process.env.REACT_APP_ADMIN_TOKEN || 'scrollmaster2025';

    if (input === VALID_TOKEN) {
      localStorage.setItem('soul_admin_token', input);
      setAccessGranted(true);
    } else if (input !== null) {
      alert('Access denied. Invalid token.');
      window.location.href = '/';
      return;
    } else {
      // User cancelled
      window.location.href = '/';
      return;
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!accessGranted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">Access Denied</p>
          <p className="text-gray-400 text-sm mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}