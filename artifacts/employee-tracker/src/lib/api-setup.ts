export function setupFetchInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async (...args) => {
    const [resource, config] = args;
    const url = typeof resource === 'string' ? resource : resource instanceof Request ? resource.url : '';

    if (url.startsWith('/api')) {
      const token = localStorage.getItem('auth_token');
      const newConfig: RequestInit = { ...(config || {}) };
      
      if (token) {
        newConfig.headers = {
          ...newConfig.headers,
          'Authorization': `Bearer ${token}`
        };
      }

      const response = await originalFetch(resource, newConfig);

      if (response.status === 401 && !url.includes('/api/auth/login') && !url.includes('/api/auth/quick-login') && !url.includes('/api/auth/employees-public')) {
        localStorage.removeItem('auth_token');
        window.dispatchEvent(new Event('auth_unauthorized'));
      }

      return response;
    }

    return originalFetch(...args);
  };
}
