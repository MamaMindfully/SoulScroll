export async function fetchPremiumStatus(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/premium/${userId}`, {
      method: 'GET',
      credentials: 'include', // Include session cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const { isPremium } = await res.json();
    return Boolean(isPremium);
  } catch (err) {
    console.error('fetchPremiumStatus error:', err);
    return false; // Default to free tier on error
  }
}

export async function updatePremiumStatus(userId: string, isPremium: boolean): Promise<boolean> {
  try {
    const res = await fetch(`/api/premium/${userId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isPremium }),
    });
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error('updatePremiumStatus error:', err);
    return false;
  }
}