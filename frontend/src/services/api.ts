import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: { name: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
};

// Events API
export const eventsAPI = {
  getEvents: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    upcoming?: boolean;
  }) => api.get('/events', { params }),
  getEvent: (id: string) => api.get(`/events/${id}`),
  createEvent: (eventData: FormData) =>
    api.post('/events', eventData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateEvent: (id: string, eventData: FormData) =>
    api.put(`/events/${id}`, eventData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteEvent: (id: string) => api.delete(`/events/${id}`),
  getEventStats: (id: string) => api.get(`/events/${id}/stats`),
  getUserEvents: () => api.get('/events/user/my-events'),
};

// Registrations API
export const registrationsAPI = {
  registerForEvent: (eventId: string) =>
    api.post(`/events/${eventId}/register`),
  cancelRegistration: (eventId: string) =>
    api.delete(`/events/${eventId}/register`),
  getUserRegistrations: (status?: string) =>
    api.get('/events/user/my-registrations', { params: { status } }),
  checkIn: (eventId: string, regId: string) =>
    api.post(`/events/${eventId}/registrations/${regId}/check-in`),
  getEventAttendees: (eventId: string, params?: { page?: number; limit?: number; status?: string }) =>
    api.get(`/events/${eventId}/registrations`, { params }),
  exportAttendees: (eventId: string) =>
    api.get(`/events/${eventId}/export`, { responseType: 'blob' }),
};

export default api;
