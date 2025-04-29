function initApp() {
    setupCsrfToken();
    
    updateAuthNav();
    
    setMinDateForInputs();
}

function setupCsrfToken() {
    document.addEventListener('DOMContentLoaded', function() {
        const csrftoken = getCsrfToken();
        
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            if (url.indexOf('http') !== 0 || url.indexOf(window.location.origin) === 0) {
                options.headers = options.headers || {};
                options.headers['X-CSRFToken'] = csrftoken;
            }
            return originalFetch(url, options);
        };
    });
}

function setMinDateForInputs() {
    document.addEventListener('DOMContentLoaded', function() {
        const dateInputs = document.querySelectorAll('input[type="date"]');
        
        if (dateInputs.length > 0) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            
            dateInputs.forEach(input => {
                input.setAttribute('min', formattedDate);
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', initApp);
