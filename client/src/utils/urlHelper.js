export const resolveImageUrl = (path, defaultImage = null) => {
  if (!path) return defaultImage;
  
  if (path.startsWith('http')) return path;

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

  if (path.startsWith('/api')) {
      const cleanBase = baseUrl.replace(/\/api$/, '');
      const cleanPath = path.replace(/^\/api/, '');
      return `${cleanBase}${cleanPath}`;
  }

  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
