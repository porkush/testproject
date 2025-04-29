function setMinimumEventDate() {
    const dateInput = document.getElementById('date');
    if (!dateInput) return;
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    dateInput.setAttribute('min', formattedDate);
}

function setupCreateEventForm() {
    const createEventForm = document.getElementById('create-event-form');
    if (!createEventForm) return;
    
    createEventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!isAuthenticated()) {
            showAlert('You must be logged in to create an event.', 'warning');
            window.location.href = '/login';
            return;
        }
        
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const date = document.getElementById('date').value;
        
        try {
            await api.createEvent({
                title,
                description,
                date
            });
            
            showAlert('Event created successfully!', 'success');
            
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
        window.location.href = '/login';
        return;
    }
    
    setMinimumEventDate();
    setupCreateEventForm();
});
