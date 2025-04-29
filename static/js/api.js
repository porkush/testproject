// API utility functions for making requests to the backend

const API_BASE_URL = '/api';

// Function to handle API errors
function handleApiError(error) {
    console.error('API Error:', error);
    let errorMessage = 'An error occurred. Please try again.';
    
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        
        if (error.response.data && typeof error.response.data === 'object') {
            // Format error messages from the API
            errorMessage = Object.entries(error.response.data)
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                .join('\n');
        } else if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
        }
    } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your connection.';
    }
    
    return errorMessage;
}

// Function to get the CSRF token from cookies
function getCsrfToken() {
    const name = 'csrftoken';
    let cookieValue = null;
    
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    
    return cookieValue;
}

// Function to make API requests with proper headers
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
    };
    
    // Add authorization header if token exists
    const token = localStorage.getItem('access_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method,
        headers,
        credentials: 'same-origin'
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        
        // Handle 401 Unauthorized (token expired)
        if (response.status === 401) {
            // Try to refresh the token
            const refreshed = await refreshToken();
            if (refreshed) {
                // Retry the request with the new token
                return apiRequest(endpoint, method, data);
            } else {
                // If refresh failed, redirect to login
                window.location.href = '/login';
                throw new Error('Authentication required');
            }
        }
        
        // Parse the JSON response
        let responseData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }
        
        // Check if the response is ok (status in the range 200-299)
        if (!response.ok) {
            throw { response: { data: responseData, status: response.status } };
        }
        
        return responseData;
    } catch (error) {
        const errorMessage = handleApiError(error);
        throw new Error(errorMessage);
    }
}

// Function to refresh the access token
async function refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
        return false;
    }
    
    try {
        const response = await fetch('/api/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({ refresh: refreshToken })
        });
        
        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }
        
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        return true;
    } catch (error) {
        console.error('Error refreshing token:', error);
        return false;
    }
}

// API functions for specific endpoints
const api = {
    // Auth endpoints
    register: (userData) => apiRequest('/auth/register/', 'POST', userData),
    login: (credentials) => apiRequest('/auth/login/', 'POST', credentials),
    
    // Event endpoints
    getEvents: () => apiRequest('/events/'),
    getEvent: (id) => apiRequest(`/events/${id}/`),
    createEvent: (eventData) => apiRequest('/events/', 'POST', eventData),
    registerForEvent: (eventId) => apiRequest(`/events/${eventId}/register/`, 'POST'),
    
    // User events
    getUserEvents: (userId) => apiRequest(`/users/${userId}/events/`),
    cancelRegistration: (eventId, userId) => apiRequest(`/events/${eventId}/cancel/${userId}/`, 'DELETE')
};
