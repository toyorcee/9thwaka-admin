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

  // If it's an upload path, it usually lives at the root of the server, not under /api
  const isUpload = normalizedPath.startsWith('/uploads/');
  
  let finalUrl;
  if (isUpload && baseUrl.endsWith('/api')) {
      const rootUrl = baseUrl.slice(0, -4);
      finalUrl = `${rootUrl}${normalizedPath}`;
  } else if (isUpload && baseUrl.endsWith('/api/')) {
      const rootUrl = baseUrl.slice(0, -5);
      finalUrl = `${rootUrl}${normalizedPath}`;
  } else if (baseUrl.endsWith('/api')) {
      finalUrl = `${baseUrl}${normalizedPath}`;
  } else if (baseUrl.endsWith('/api/')) {
      finalUrl = `${baseUrl.slice(0, -1)}${normalizedPath}`;
  } else if (baseUrl.startsWith('http')) {
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      // For uploads, don't add /api
      if (isUpload) {
          finalUrl = `${cleanBase}${normalizedPath}`;
      } else {
          finalUrl = `${cleanBase}/api${normalizedPath}`;
      }
  } else {
      finalUrl = `${baseUrl}${normalizedPath}`;
  }

  return finalUrl;
};

