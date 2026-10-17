import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // Send session cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for responses to handle common errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If backend returns a structured message
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    const status = error.response?.status;

    return Promise.reject({
      status,
      message,
      data: error.response?.data,
    });
  }
);

export default api;
