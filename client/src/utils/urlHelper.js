export const resolveImageUrl = (path, defaultImage = null) => {
  if (!path) return defaultImage;
  
  if (path.startsWith('http')) return path;

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

  let normalizedPath = path;
  
  if (normalizedPath.startsWith('/api/')) {
      normalizedPath = normalizedPath.slice(4);
  } else if (normalizedPath.startsWith('api/')) {
      normalizedPath = normalizedPath.slice(3);
  }

  if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
  }

  let finalUrl;
  if (baseUrl.endsWith('/api')) {
      finalUrl = `${baseUrl}${normalizedPath}`;
  } else if (baseUrl.endsWith('/api/')) {
      finalUrl = `${baseUrl.slice(0, -1)}${normalizedPath}`;
  } else if (baseUrl.startsWith('http')) {
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      finalUrl = `${cleanBase}/api${normalizedPath}`;
  } else {
      finalUrl = `${baseUrl}${normalizedPath}`;
  }

  return finalUrl;
};
