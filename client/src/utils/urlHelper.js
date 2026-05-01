export const resolveImageUrl = (path, defaultImage = null) => {
  if (!path) return defaultImage;
  
  if (path.startsWith('http')) return path;

  const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
  let normalizedPath = path;
  
  if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
  }

  const isApiPath = normalizedPath.startsWith('/api/');
  const isUploadPath = normalizedPath.startsWith('/uploads/');

  let finalUrl;
  
  if (isApiPath || isUploadPath) {
      const origin = baseUrl.endsWith('/api') ? baseUrl.slice(0, -4) : baseUrl.endsWith('/api/') ? baseUrl.slice(0, -5) : baseUrl;
      
      const cleanOrigin = (origin === "/api" || origin === "/api/") ? "" : origin;
      finalUrl = `${cleanOrigin}${normalizedPath}`;
  } else {
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      finalUrl = `${cleanBase}${normalizedPath}`;
  }

  console.log(`[URL Helper] Resolved: ${path} -> ${finalUrl}`);
  return finalUrl;
};


