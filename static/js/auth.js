
function isAuthenticated() {
    return localStorage.getItem('access_token') !== null;
}

function getCurrentUserId() {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    return userData.id;
}

function getCurrentUsername() {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    return userData.username;
}

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
            
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            
            const userData = {
                username: username,
                id: parseJwt(data.access).user_id
            };
            localStorage.setItem('user_data', JSON.stringify(userData));
            
            showAlert('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });
}
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

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    
    showAlert('You have been logged out.', 'info');
    setTimeout(() => {
        window.location.href = '/';
    }, 1000);
}

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
    
    setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => {
            alertContainer.removeChild(alertElement);
        }, 300);
    }, 5000);
}

function checkAuth() {
    const protectedPages = ['/my-events', '/create-event'];
    const currentPath = window.location.pathname;
    
    if (protectedPages.includes(currentPath) && !isAuthenticated()) {
        showAlert('Please login to access this page.', 'warning');
        window.location.href = '/login';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthNav();
    setupLoginForm();
    setupRegisterForm();
    checkAuth();
});
