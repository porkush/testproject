async function loadMyEvents() {
    const eventsContainer = document.getElementById('my-events-container');
    if (!eventsContainer) return;
    
    if (!isAuthenticated()) {
        window.location.href = '/login';
        return;
    }
    
    try {
        eventsContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        
        const userId = getCurrentUserId();
        
        const events = await api.getUserEvents(userId);
        
        if (events.length === 0) {
            eventsContainer.innerHTML = '<div class="col-12"><div class="alert alert-info">You haven\'t registered for any events yet.</div></div>';
            return;
        }
        
        eventsContainer.innerHTML = '';
        
        events.forEach(event => {
            const eventCard = createMyEventCard(event);
            eventsContainer.appendChild(eventCard);
        });
    } catch (error) {
        eventsContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger">Error loading your events: ${error.message}</div></div>`;
    }
}

function createMyEventCard(event) {
    const col = document.createElement('div');
    col.className = 'col-md-4 mb-4';
    
    const card = document.createElement('div');
    card.className = 'card';
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    const eventDate = new Date(event.date).toLocaleDateString();
    
    cardBody.innerHTML = `
        <h5 class="card-title">${event.title}</h5>
        <h6 class="card-subtitle mb-2 text-muted">${eventDate}</h6>
        <p class="card-text">${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
        <button class="btn btn-primary view-event" data-id="${event.id}">View Details</button>
        <button class="btn btn-danger cancel-registration ms-2" data-id="${event.id}">Cancel Registration</button>
    `;
    
    const cardFooter = document.createElement('div');
    cardFooter.className = 'card-footer text-muted';
    cardFooter.textContent = `Created by: ${event.created_by}`;
    
    card.appendChild(cardBody);
    card.appendChild(cardFooter);
    col.appendChild(card);
    
    col.querySelector('.view-event').addEventListener('click', () => viewEventDetails(event.id));
    col.querySelector('.cancel-registration').addEventListener('click', () => cancelMyRegistration(event.id));
    
    return col;
}

async function cancelMyRegistration(eventId) {
    try {
        const userId = getCurrentUserId();
        await api.cancelRegistration(eventId, userId);
        showAlert('Your registration has been cancelled.', 'info');
        
        loadMyEvents();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function viewEventDetails(eventId) {
    showAlert(`Viewing details for event ${eventId}. This feature is coming soon!`, 'info');
}

document.addEventListener('DOMContentLoaded', () => {
    loadMyEvents();
});
