import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Backend API URL
const API_URL = 'https://frelanci-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  checkUsername: (username) => api.get(`/auth/check-username/${username}`),
  checkEmail: (email) => api.get(`/auth/check-email/${encodeURIComponent(email)}`),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getFreelancer: (id) => api.get(`/users/freelancer/${id}`),
  getPublicProfile: (userId) => api.get(`/users/profile/${userId}`),
  getFreelancerWorks: (userId, params) => api.get(`/users/works/${userId}`, { params }),
};

// Job APIs
export const jobAPI = {
  create: (jobData) => api.post('/jobs', jobData),
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  getByFreelancer: (freelancerId) => api.get(`/jobs/freelancer/${freelancerId}`),
  getCategories: () => api.get('/jobs/categories/list'),
};

// Order APIs
export const orderAPI = {
  create: (orderData) => api.post('/orders', orderData),
  getMy: () => api.get('/orders/my'),
  getAll: () => api.get('/orders/all'),
  getPaymentStats: () => api.get('/orders/payment-stats'),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  addReview: (id, review) => api.post(`/orders/${id}/review`, review),
  sendMessage: (id, messageData) => api.post(`/orders/${id}/message`, messageData),
  approvePayment: (id) => api.post(`/orders/${id}/approve-payment`),
  delete: (id) => api.delete(`/orders/${id}`),
};

// Rating APIs
export const ratingAPI = {
  rate: (ratingData) => api.post('/ratings/rate', ratingData),
  getFreelancerRatings: (freelancerId, params) => api.get(`/ratings/freelancer/${freelancerId}`, { params }),
  getMyRatings: () => api.get('/ratings/my-ratings'),
  checkEligibility: (orderId) => api.get(`/ratings/check/${orderId}`),
  canRateFromProfile: (freelancerId) => api.get(`/ratings/can-rate/${freelancerId}`),
};

// Admin APIs
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  approveUser: (id) => api.put(`/admin/users/${id}/approve`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getOrders: () => api.get('/orders/all'),
  getJobs: () => api.get('/admin/jobs'),
  getDashboardStats: () => api.get('/admin/stats/dashboard'),
  getMonthlyRevenue: () => api.get('/admin/stats/revenue'),
  getMonthlyComparison: () => api.get('/admin/stats/comparison'),
};

// Maintenance APIs
export const maintenanceAPI = {
  getSettings: () => api.get('/maintenance/settings'),
  updateSettings: (settings) => api.put('/maintenance/settings', settings),
  getErrors: () => api.get('/maintenance/errors'),
  clearErrors: () => api.delete('/maintenance/errors'),
  getStats: () => api.get('/maintenance/stats'),
};

// Support APIs
export const supportAPI = {
  createMessage: (data) => api.post('/support/messages', data),
  getMyMessages: (params) => api.get('/support/my-messages', { params }),
  getMessagesByRecipient: (recipient, params) => api.get(`/support/messages/${recipient}`, { params }),
  updateStatus: (id, status) => api.put(`/support/messages/${id}/status`, { status }),
  addResponse: (id, response) => api.post(`/support/messages/${id}/response`, { response }),
  addMessageToThread: (id, text) => api.post(`/support/messages/${id}/add-message`, { text }),
  deleteMessage: (id) => api.delete(`/support/messages/${id}`),
  getStatistics: () => api.get('/support/statistics'),
};

export default api;