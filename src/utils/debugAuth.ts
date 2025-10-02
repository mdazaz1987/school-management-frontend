// Temporary debug utility to check authentication
export const debugAuth = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('=== AUTH DEBUG ===');
  console.log('Token exists:', !!token);
  console.log('Token:', token ? token.substring(0, 50) + '...' : 'N/A');
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('User:', userData);
      console.log('Roles:', userData.roles);
      console.log('Has ROLE_ADMIN:', userData.roles?.includes('ROLE_ADMIN'));
      console.log('Has ADMIN:', userData.roles?.includes('ADMIN'));
    } catch (e) {
      console.error('Error parsing user:', e);
    }
  }
  
  // Decode JWT token
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('JWT Payload:', payload);
      console.log('JWT Roles:', payload.roles || payload.authorities);
    } catch (e) {
      console.error('Error decoding token:', e);
    }
  }
  
  console.log('==================');
};

// Auto-run on import during development
if (process.env.NODE_ENV === 'development') {
  debugAuth();
}
