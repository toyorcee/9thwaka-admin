export const resolveImageUrl = (path, defaultImage = null) => {
  if (!path) return defaultImage;
  
  if (path.startsWith('http')) return path;

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

  if (path.startsWith('/api')) {
      if (baseUrl === '/api' || baseUrl === '' || baseUrl.endsWith('/api')) {
          return path;
      }

      const cleanBase = baseUrl.replace(/\/api$/, '');
      return `${cleanBase}${path}`;
  }

  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
