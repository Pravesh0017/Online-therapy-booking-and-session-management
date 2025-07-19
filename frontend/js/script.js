import { bookingAPI, therapistAPI, contactAPI } from './api';
import auth from './auth';

document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication state
  const isAuthenticated = auth.isAuthenticated();
  const user = isAuthenticated ? await auth.getCurrentUser() : null;

  // Update UI based on authentication
  updateAuthUI(isAuthenticated, user);

  // Booking Form Handling
  const bookingForm = document.getElementById("booking-form");
  const contactForm = document.getElementById("contact-form");
  const messageElement = document.getElementById("message");
  const upcomingSessionsList = document.getElementById("upcoming-sessions");
  const pastSessionsList = document.getElementById("past-sessions");

  if (bookingForm) {
    // Load therapists for dropdown
    await loadTherapists();

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("date").min = today;

    bookingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      if (!isAuthenticated) {
        messageElement.textContent = "Please login to book a session";
        messageElement.style.color = "red";
        return;
      }

      const therapist = document.getElementById("therapist").value;
      const concern = document.getElementById("concern").value;
      const date = document.getElementById("date").value;
      const time = document.getElementById("time").value;
      const notes = document.getElementById("notes").value;

      try {
        const therapistId = therapist.split(' - ')[0];
        const bookingData = { 
          therapist: therapistId,
          date,
          time,
          concern,
          notes
        };

        const response = await bookingAPI.createBooking(bookingData, auth.getToken());
        
        messageElement.textContent = "Session booked successfully! You'll receive a confirmation email shortly.";
        messageElement.style.color = "green";
        bookingForm.reset();
        
        // Show confirmation for 5 seconds
        setTimeout(() => {
          messageElement.textContent = "";
        }, 5000);
      } catch (error) {
        messageElement.textContent = error.message;
        messageElement.style.color = "red";
      }
    });

    // Load available slots when therapist or date changes
    document.getElementById("therapist").addEventListener("change", async function() {
      const therapistId = this.value.split(' - ')[0];
      const date = document.getElementById("date").value;
      if (therapistId && date) {
        await loadAvailableSlots(therapistId, date);
      }
    });

    document.getElementById("date").addEventListener("change", async function() {
      const therapistId = document.getElementById("therapist").value.split(' - ')[0];
      if (therapistId && this.value) {
        await loadAvailableSlots(therapistId, this.value);
      }
    });
  }

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const name = document.getElementById("contact-name").value;
      const email = document.getElementById("contact-email").value;
      const subject = document.getElementById("contact-subject").value;
      const message = document.getElementById("contact-message").value;
      
      try {
        await contactAPI.sendMessage({ name, email, subject, message });
        alert("Thank you for your message! We'll get back to you within 24 hours.");
        contactForm.reset();
      } catch (error) {
        alert(error.message);
      }
    });
  }

  // Session List Handling
  if (upcomingSessionsList || pastSessionsList) {
    await loadUserSessions();
  }

  // Helper Functions
  async function loadTherapists() {
    try {
      const response = await therapistAPI.getTherapists();
      const therapistSelect = document.getElementById("therapist");
      
      // Clear existing options except the first one
      while (therapistSelect.options.length > 1) {
        therapistSelect.remove(1);
      }

      // Add therapist options
      response.data.forEach(therapist => {
        const option = document.createElement("option");
        option.value = `${therapist._id} - ${therapist.name}`;
        option.textContent = `${therapist.name} - ${therapist.specialty.join(', ')}`;
        therapistSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error loading therapists:", error);
    }
  }

  async function loadAvailableSlots(therapistId, date) {
    try {
      const response = await bookingAPI.getAvailableSlots(therapistId, date, auth.getToken());
      const timeSelect = document.getElementById("time");
      
      // Clear existing options
      timeSelect.innerHTML = '<option value="">Select Time</option>';
      
      // Add available time slots
      response.data.forEach(time => {
        const option = document.createElement("option");
        option.value = time;
        option.textContent = time;
        timeSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error loading available slots:", error);
    }
  }

  async function loadUserSessions() {
    try {
      const response = await bookingAPI.getBookings(auth.getToken());
      const now = new Date();
      
      const upcomingSessions = response.data.filter(session => {
        const sessionDate = new Date(session.date);
        return session.status !== 'completed' && sessionDate > now;
      });
      
      const pastSessions = response.data.filter(session => {
        const sessionDate = new Date(session.date);
        return session.status === 'completed' || sessionDate <= now;
      });
      
      if (upcomingSessionsList) {
        upcomingSessionsList.innerHTML = upcomingSessions.length === 0
          ? "<li class='session-item'><p>No upcoming sessions booked.</p></li>"
          : upcomingSessions.map(session => `
              <li class="session-item">
                <div class="session-details">
                  <h4>Session with ${session.therapist.name}</h4>
                  <p>${formatDate(session.date)} at ${formatTime(session.time)}</p>
                  ${session.concern ? `<p>Concern: ${session.concern}</p>` : ''}
                </div>
                <div class="session-actions">
                  <button class="cancel-btn" data-id="${session._id}">Cancel</button>
                </div>
              </li>
            `).join('');
      }
      
      if (pastSessionsList) {
        pastSessionsList.innerHTML = pastSessions.length === 0
          ? "<li class='session-item'><p>No past sessions yet.</p></li>"
          : pastSessions.map(session => `
              <li class="session-item">
                <div class="session-details">
                  <h4>Session with ${session.therapist.name}</h4>
                  <p>${formatDate(session.date)} at ${formatTime(session.time)}</p>
                  <p>Status: ${session.status === 'completed' ? 'Completed' : 'Missed'}</p>
                </div>
              </li>
            `).join('');
      }
      
      // Add event listeners for cancel buttons
      document.querySelectorAll('.cancel-btn').forEach(button => {
        button.addEventListener('click', async function() {
          const sessionId = this.getAttribute('data-id');
          if (confirm("Are you sure you want to cancel this session?")) {
            try {
              await bookingAPI.deleteBooking(sessionId, auth.getToken());
              alert("Session cancelled successfully.");
              location.reload();
            } catch (error) {
              alert(error.message);
            }
          }
        });
      });
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  }

  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  }
  
  function formatTime(timeString) {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  function updateAuthUI(isAuthenticated, user) {
    const loginLinks = document.querySelectorAll('.login-link');
    const logoutLinks = document.querySelectorAll('.logout-link');
    const userProfile = document.querySelector('.user-profile');
    const protectedLinks = document.querySelectorAll('.protected-link');
    
    if (isAuthenticated) {
      loginLinks.forEach(link => link.style.display = 'none');
      logoutLinks.forEach(link => link.style.display = 'block');
      protectedLinks.forEach(link => link.style.display = 'block');
      
      if (userProfile) {
        userProfile.textContent = `Welcome, ${user.name}`;
        userProfile.style.display = 'block';
      }
    } else {
      loginLinks.forEach(link => link.style.display = 'block');
      logoutLinks.forEach(link => link.style.display = 'none');
      protectedLinks.forEach(link => link.style.display = 'none');
      
      if (userProfile) {
        userProfile.style.display = 'none';
      }
    }
  }

  // Add logout functionality
  document.querySelectorAll('.logout-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      auth.logout();
    });
  });
});