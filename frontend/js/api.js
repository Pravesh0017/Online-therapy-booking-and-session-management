const API_BASE_URL = 'http://localhost:5000/api';

// Generic API request function
async function makeRequest(url, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${url}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// Auth API
export const authAPI = {
  register: (userData) => makeRequest('/auth/register', 'POST', userData),
  login: (credentials) => makeRequest('/auth/login', 'POST', credentials),
  getMe: (token) => makeRequest('/auth/me', 'GET', null, token),
};

// Booking API
export const bookingAPI = {
  getBookings: (token) => makeRequest('/bookings', 'GET', null, token),
  createBooking: (bookingData, token) => makeRequest('/bookings', 'POST', bookingData, token),
  updateBooking: (id, bookingData, token) => makeRequest(`/bookings/${id}`, 'PUT', bookingData, token),
  deleteBooking: (id, token) => makeRequest(`/bookings/${id}`, 'DELETE', null, token),
  getAvailableSlots: (therapistId, date, token) => 
    makeRequest(`/bookings/availability/${therapistId}?date=${date}`, 'GET', null, token),
};

// Therapist API
export const therapistAPI = {
  getTherapists: () => makeRequest('/therapists'),
  getTherapist: (id) => makeRequest(`/therapists/${id}`),
  getTherapistsBySpecialty: (specialty) => makeRequest(`/therapists/specialty/${specialty}`),
};

// Contact API
export const contactAPI = {
  sendMessage: (messageData) => makeRequest('/contact', 'POST', messageData),
};

// User API
export const userAPI = {
  updateDetails: (userData, token) => makeRequest('/users/update-details', 'PUT', userData, token),
  updatePassword: (passwordData, token) => makeRequest('/users/update-password', 'PUT', passwordData, token),
};