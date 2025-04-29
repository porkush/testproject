
const API_BASE_URL = '/api';

function handleApiError(error) {
    console.error('API Error:', error);
    let errorMessage = 'An error occurred. Please try again.';
    
    if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        
        if (error.response.data && typeof error.response.data === 'object') {
            errorMessage = Object.entries(error.response.data)
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                .join('\n');
        } else if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
        }
    } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
    }
    
    return errorMessage;
}

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

async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
    };
    
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
        
        if (response.status === 401) {
            const refreshed = await refreshToken();
            if (refreshed) {
                return apiRequest(endpoint, method, data);
            } else {
                window.location.href = '/login';
                throw new Error('Authentication required');
            }
        }
        
        let responseData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }
        
        if (!response.ok) {
            throw { response: { data: responseData, status: response.status } };
        }
        
        return responseData;
    } catch (error) {
        const errorMessage = handleApiError(error);
        throw new Error(errorMessage);
    }
}

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
const api = {
    register: (userData) => apiRequest('/auth/register/', 'POST', userData),
    login: (credentials) => apiRequest('/auth/login/', 'POST', credentials),
    
    getEvents: () => apiRequest('/events/'),
    getEvent: (id) => apiRequest(`/events/${id}/`),
    createEvent: (eventData) => apiRequest('/events/', 'POST', eventData),
    registerForEvent: (eventId) => apiRequest(`/events/${eventId}/register/`, 'POST'),
    
    getUserEvents: (userId) => apiRequest(`/users/${userId}/events/`),
    cancelRegistration: (eventId, userId) => apiRequest(`/events/${eventId}/cancel/${userId}/`, 'DELETE')
};
