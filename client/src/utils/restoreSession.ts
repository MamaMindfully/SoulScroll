export async function restoreSession() {
  try {
    const response = await fetch('/api/auth/user', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const userData = await response.json();
      
      if (userData.user) {
        // Session restored successfully
        console.log('Session restored for user:', userData.user.id);
        
        // Get premium status
        try {
          const premiumResponse = await fetch('/api/user/premium-status', {
            credentials: 'include'
          });
          
          if (premiumResponse.ok) {
            const premiumData = await premiumResponse.json();
            console.log('Premium status:', premiumData.isPremium);
          }
        } catch (error) {
          console.warn('Failed to get premium status:', error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to restore session:', error);
  }
}