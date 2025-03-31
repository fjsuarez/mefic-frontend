// Get the API base URL from environment variables
// Default to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper function to build API URLs
export const buildApiUrl = (path: string): string => {
  // Make sure path starts with a slash
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${formattedPath}`;
}; 