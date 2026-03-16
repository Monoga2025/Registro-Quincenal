/**
 * Intercepts global fetch to automatically inject the Authorization header
 * and handle routing of API requests based on auth state.
 */
export function setupFetchInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async (...args) => {
    const [resource, config] = args;
    const url = typeof resource === 'string' ? resource : resource instanceof Request ? resource.url : '';

    if (url.startsWith('/api')) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const newConfig = config || {};
        newConfig.headers = {
          ...newConfig.headers,
          'Authorization': `Bearer ${token}`
        };
        
        const response = await originalFetch(resource, newConfig);
        
        // Handle global 401 Unauthorized
        if (response.status === 401 && !url.includes('/api/auth/login')) {
          localStorage.removeItem('auth_token');
          window.dispatchEvent(new Event('auth_unauthorized'));
        }
        
        return response;
      }
    }
    
    return originalFetch(...args);
  };
}
