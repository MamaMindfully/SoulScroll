import { useUser } from '@/hooks/useUser';

export async function restoreSession() {
  try {
    const stored = localStorage.getItem('supabase_session');
    if (!stored) return null;

    const session = JSON.parse(stored);
    
    // Validate session structure
    if (!session?.user?.id || !session?.access_token) {
      localStorage.removeItem('supabase_session');
      return null;
    }

    // Check if session is expired
    const expiresAt = session.expires_at || session.user.expires_at;
    if (expiresAt && new Date(expiresAt * 1000) < new Date()) {
      localStorage.removeItem('supabase_session');
      return null;
    }

    // Validate with backend
    const response = await fetch('/api/auth/validate-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session })
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      localStorage.removeItem('supabase_session');
      return null;
    }

  } catch (error) {
    console.error('Session restoration failed:', error);
    localStorage.removeItem('supabase_session');
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem('supabase_session');
  localStorage.removeItem('user_cache');
  localStorage.removeItem('insight_today');
  localStorage.removeItem('arc_prompt_today');
}