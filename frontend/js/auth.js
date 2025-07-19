import { authAPI } from './api';

// Store token in localStorage
const storeToken = (token) => {
  localStorage.setItem('mindfulTherapyToken', token);
};

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('mindfulTherapyToken');
};

// Remove token from localStorage
const removeToken = () => {
  localStorage.removeItem('mindfulTherapyToken');
};

// Check if user is authenticated
const isAuthenticated = () => {
  return !!getToken();
};

// Register user
const register = async (userData) => {
  try {
    const response = await authAPI.register(userData);
    storeToken(response.token);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Login user
const login = async (credentials) => {
  try {
    const response = await authAPI.login(credentials);
    storeToken(response.token);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Logout user
const logout = () => {
  removeToken();
  window.location.href = '/index.html';
};

// Get current user
const getCurrentUser = async () => {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await authAPI.getMe(token);
    return response.data;
  } catch (error) {
    removeToken();
    return null;
  }
};

export default {
  storeToken,
  getToken,
  removeToken,
  isAuthenticated,
  register,
  login,
  logout,
  getCurrentUser,
};