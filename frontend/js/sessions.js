document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  if (!await checkAuth()) {
    window.location.href = 'index.html';
    return;
  }

  // Load sessions
  await loadSessions();

  // Set up logout button
  document.getElementById('logout-btn').addEventListener('click', logout);
});

async function loadSessions() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/bookings', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }

    const bookings = await response.json();
    displaySessions(bookings.data);
  } catch (error) {
    console.error('Error loading sessions:', error);
    alert('Failed to load sessions. Please try again.');
  } finally {
    document.getElementById('upcoming-loading').style.display = 'none';
    document.getElementById('past-loading').style.display = 'none';
  }
}

function displaySessions(bookings) {
  const now = new Date();
  const upcomingList = document.getElementById('upcoming-sessions');
  const pastList = document.getElementById('past-sessions');

  // Clear existing content
  upcomingList.innerHTML = '';
  pastList.innerHTML = '';

  if (bookings.length === 0) {
    upcomingList.innerHTML = '<li class="session-item"><p>No sessions booked yet.</p></li>';
    return;
  }

  bookings.forEach(booking => {
    const sessionDate = new Date(booking.date);
    const isPast = sessionDate < now || booking.status === 'completed' || booking.status === 'cancelled';
    
    const sessionItem = document.createElement('li');
    sessionItem.className = 'session-item';
    
    sessionItem.innerHTML = `
      <div class="session-details">
        <h4>Session with ${booking.therapist.name}</h4>
        <p>${formatDate(booking.date)} at ${formatTime(booking.time)}</p>
        ${booking.concern ? `<p>Concern: ${booking.concern}</p>` : ''}
        <p>Status: ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</p>
      </div>
      <div class="session-actions">
        ${!isPast ? `<button class="btn view-details" data-id="${booking._id}">View Details</button>` : ''}
        ${!isPast ? `<button class="btn cancel-btn" data-id="${booking._id}">Cancel</button>` : ''}
      </div>
    `;

    if (isPast) {
      pastList.appendChild(sessionItem);
    } else {
      upcomingList.appendChild(sessionItem);
    }
  });

  // Add event listeners to buttons
  document.querySelectorAll('.view-details').forEach(btn => {
    btn.addEventListener('click', viewSessionDetails);
  });

  document.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', cancelSession);
  });
}

async function viewSessionDetails(e) {
  const bookingId = e.target.getAttribute('data-id');
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch session details');
    }

    const booking = await response.json();
    showSessionModal(booking.data);
  } catch (error) {
    console.error('Error viewing session details:', error);
    alert('Failed to load session details. Please try again.');
  }
}

function showSessionModal(booking) {
  const modal = document.getElementById('session-modal');
  document.getElementById('modal-therapist-name').textContent = `Session with ${booking.therapist.name}`;
  document.getElementById('modal-session-date').textContent = `Date: ${formatDate(booking.date)}`;
  document.getElementById('modal-session-time').textContent = `Time: ${formatTime(booking.time)}`;
  
  if (booking.concern) {
    document.getElementById('modal-session-concern').textContent = `Primary Concern: ${booking.concern}`;
  } else {
    document.getElementById('modal-session-concern').textContent = '';
  }
  
  if (booking.notes) {
    document.getElementById('modal-session-notes').innerHTML = `<h4>Notes:</h4><p>${booking.notes}</p>`;
  } else {
    document.getElementById('modal-session-notes').innerHTML = '';
  }

  // Set up cancel button
  document.getElementById('cancel-session-btn').setAttribute('data-id', booking._id);
  document.getElementById('cancel-session-btn').onclick = cancelSession;

  // Set up join button (would link to video session in real app)
  document.getElementById('join-session-btn').onclick = () => {
    alert('This would launch the video session in a real application');
  };

  // Set up close button
  document.querySelector('.close-modal').onclick = () => {
    modal.style.display = 'none';
  };

  modal.style.display = 'block';
}

async function cancelSession(e) {
  const bookingId = e.target.getAttribute('data-id');
  
  if (!confirm('Are you sure you want to cancel this session?')) {
    return;
  }

  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`/api/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to cancel session');
    }

    alert('Session cancelled successfully');
    loadSessions();
    document.getElementById('session-modal').style.display = 'none';
  } catch (error) {
    console.error('Error cancelling session:', error);
    alert('Failed to cancel session. Please try again.');
  }
}

// Helper functions
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  return new Date(dateString).toLocaleDateString('en-IN', options);
}

function formatTime(timeString) {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}