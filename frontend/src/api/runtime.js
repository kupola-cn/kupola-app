export const API_MODE = import.meta.env.VITE_API_MODE || 'mock';
export const USE_HTTP_API = API_MODE === 'http';
