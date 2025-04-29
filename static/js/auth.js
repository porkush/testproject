// Authentication related functionality

// Check if user is authenticated
function isAuthenticated() {
    return localStorage.getItem('access_token') !== null;
}

// Get the current user ID
function getCurrentUserId() {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    return userData.id;
}

// Get the current username
function getCurrentUsername() {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    return userData.username;
}

// Update the navigation based on authentication status
function updateAuthNav() {
    const authNav = document.getElementById('auth-nav');
    if (!authNav) return;
    
    if (isAuthenticated()) {
        const username = getCurrentUsername();
        authNav.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="/my-events">My Events</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="/create-event">Create Event</a>
            </li>
            <li class="nav-item">
                <span class="nav-link">Welcome, ${username}</span>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" id="logout-btn">Logout</a>
            </li>
        `;
        
        // Add logout event listener
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    } else {
        authNav.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="/login">Login</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="/register">Register</a>
            </li>
        `;
    }
}

// Handle login form submission
function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                throw new Error('Login failed. Please check your credentials.');
            }
            
            const data = await response.json();
            
            // Store tokens and user data
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            
            // Store basic user info
            const userData = {
                username: username,
                id: parseJwt(data.access).user_id
            };
            localStorage.setItem('user_data', JSON.stringify(userData));
            
            // Show success message and redirect
            showAlert('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });
}

// Handle registration form submission
function setupRegisterForm() {
    const registerForm = document.getElementById('register-form');
    if (!registerForm) return;
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const first_name = document.getElementById('first_name').value;
        const last_name = document.getElementById('last_name').value;
        const password = document.getElementById('password').value;
        const password2 = document.getElementById('password2').value;
        
        // Validate passwords match
        if (password !== password2) {
            showAlert('Passwords do not match!', 'danger');
            return;
        }
        
        try {
            const response = await api.register({
                username,
                email,
                first_name,
                last_name,
                password,
                password2
            });
            
            showAlert('Registration successful! Please login.', 'success');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });
}

// Logout function
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    
    showAlert('You have been logged out.', 'info');
    setTimeout(() => {
        window.location.href = '/';
    }, 1000);
}

// Parse JWT token to get user information
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error parsing JWT token:', error);
        return {};
    }
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alertElement);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => {
            alertContainer.removeChild(alertElement);
        }, 300);
    }, 5000);
}

// Check if user is authenticated for protected pages
function checkAuth() {
    const protectedPages = ['/my-events', '/create-event'];
    const currentPath = window.location.pathname;
    
    if (protectedPages.includes(currentPath) && !isAuthenticated()) {
        showAlert('Please login to access this page.', 'warning');
        window.location.href = '/login';
    }
}

// Initialize auth functionality
document.addEventListener('DOMContentLoaded', () => {
    updateAuthNav();
    setupLoginForm();
    setupRegisterForm();
    checkAuth();
});
