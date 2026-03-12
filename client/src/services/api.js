import axios from 'axios';

// Base instance
const API = axios.create({
  // Use relative path - Vite proxy will handle the redirect to backend
  baseURL: '/api', 
});

// Request Interceptor to add the JWT token to headers if available
API.interceptors.request.use(
  (config) => {
    // We will store the full User object containing the token in localStorage
    const userInfo = localStorage.getItem('userInfo');

    if (userInfo) {
      const parsedUser = JSON.parse(userInfo);
      if (parsedUser.token) {
        config.headers.Authorization = `Bearer ${parsedUser.token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
