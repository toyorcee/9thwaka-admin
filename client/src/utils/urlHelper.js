export const resolveImageUrl = (path, defaultImage = null) => {
  if (!path) return defaultImage;
  
  if (path.startsWith('http')) return path;

  // Use a reasonable fallback if VITE_API_BASE_URL is not set
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

  // Normalize path: Ensure we don't have double /api if baseUrl also has it
  let normalizedPath = path;
  
  // If path has /api at start, strip it temporarily for assembly
  if (normalizedPath.startsWith('/api/')) {
      normalizedPath = normalizedPath.slice(4);
  } else if (normalizedPath.startsWith('api/')) {
      normalizedPath = normalizedPath.slice(3);
  }

  // Ensure normalizedPath starts with /
  if (!normalizedPath.startsWith('/')) {
      normalizedPath = '/' + normalizedPath;
  }

  // Assembly: baseUrl (which ideally ends in /api) + normalizedPath (which starts with /uploads)
  let finalUrl;
  if (baseUrl.endsWith('/api')) {
      finalUrl = `${baseUrl}${normalizedPath}`;
  } else if (baseUrl.endsWith('/api/')) {
      finalUrl = `${baseUrl.slice(0, -1)}${normalizedPath}`;
  } else if (baseUrl.startsWith('http')) {
      // If baseUrl is absolute but doesn't have /api, we must assume it needs it for static uploads
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      finalUrl = `${cleanBase}/api${normalizedPath}`;
  } else {
      // Fallback for relative paths
      finalUrl = `${baseUrl}${normalizedPath}`;
  }

  return finalUrl;
};
