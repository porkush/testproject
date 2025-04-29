async function loadEvents() {
    const eventsContainer = document.getElementById('events-container');
    if (!eventsContainer) return;
    
    try {
        eventsContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        
        const events = await api.getEvents();
        
        if (events.length === 0) {
            eventsContainer.innerHTML = '<div class="col-12"><div class="alert alert-info">No upcoming events found.</div></div>';
            return;
        }
        
        eventsContainer.innerHTML = '';
        
        events.forEach(event => {
            const eventCard = createEventCard(event);
            eventsContainer.appendChild(eventCard);
        });
    } catch (error) {
        eventsContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger">Error loading events: ${error.message}</div></div>`;
    }
}

function createEventCard(event) {
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
    `;
    
    if (isAuthenticated()) {
        const actionButton = document.createElement('button');
        
        if (event.is_registered) {
            actionButton.className = 'btn btn-danger cancel-registration ms-2';
            actionButton.textContent = 'Cancel Registration';
            actionButton.addEventListener('click', () => cancelRegistration(event.id));
        } else {
            actionButton.className = 'btn btn-success register-event ms-2';
            actionButton.textContent = 'Register';
            actionButton.addEventListener('click', () => registerForEvent(event.id));
        }
        
        cardBody.appendChild(actionButton);
    }
    
    const cardFooter = document.createElement('div');
    cardFooter.className = 'card-footer text-muted';
    cardFooter.textContent = `Created by: ${event.created_by}`;
    
    card.appendChild(cardBody);
    card.appendChild(cardFooter);
    col.appendChild(card);
    
    col.querySelector('.view-event').addEventListener('click', () => viewEventDetails(event.id));
    
    return col;
}

async function registerForEvent(eventId) {
    try {
        await api.registerForEvent(eventId);
        showAlert('You have successfully registered for this event!', 'success');
        
        loadEvents();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function cancelRegistration(eventId) {
    try {
        const userId = getCurrentUserId();
        await api.cancelRegistration(eventId, userId);
        showAlert('Your registration has been cancelled.', 'info');
        
        loadEvents();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function viewEventDetails(eventId) {
    showAlert(`Viewing details for event ${eventId}. This feature is coming soon!`, 'info');
}

document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
});
