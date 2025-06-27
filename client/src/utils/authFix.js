// Temporary auth fix for development
export function initDevAuth() {
  // Mock authentication for development
  if (process.env.NODE_ENV === 'development') {
    const mockUser = {
      id: 'dev-user-123',
      email: 'dev@example.com',
      firstName: 'Dev',
      lastName: 'User'
    };
    
    localStorage.setItem('userId', mockUser.id);
    localStorage.setItem('userProfile', JSON.stringify(mockUser));
    localStorage.setItem('isAuthenticated', 'true');
    
    console.log('Development auth initialized');
  }
}