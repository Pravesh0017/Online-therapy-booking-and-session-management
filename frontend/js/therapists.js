document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  if (!await checkAuth()) {
    window.location.href = 'index.html';
    return;
  }

  // Load therapists
  await loadTherapists();

  // Set up search and filter
  document.getElementById('therapist-search').addEventListener('input', filterTherapists);
  document.getElementById('specialty-filter').addEventListener('change', filterTherapists);

  // Set up logout button
  document.getElementById('logout-btn').addEventListener('click', logout);
});

let allTherapists = [];

async function loadTherapists() {
  try {
    const response = await fetch('/api/therapists');
    
    if (!response.ok) {
      throw new Error('Failed to fetch therapists');
    }

    const data = await response.json();
    allTherapists = data.data;
    displayTherapists(allTherapists);
  } catch (error) {
    console.error('Error loading therapists:', error);
    alert('Failed to load therapists. Please try again.');
  } finally {
    document.getElementById('therapists-loading').style.display = 'none';
  }
}

function displayTherapists(therapists) {
  const therapistsList = document.getElementById('therapists-list');
  
  // Clear existing content
  therapistsList.innerHTML = '';

  if (therapists.length === 0) {
    therapistsList.innerHTML = '<p>No therapists found matching your criteria.</p>';
    return;
  }

  therapists.forEach(therapist => {
    const therapistCard = document.createElement('div');
    therapistCard.className = 'therapist-card';
    
    therapistCard.innerHTML = `
      <img src="${therapist.photo || 'assets/therapist-default.jpg'}" alt="${therapist.name}" class="therapist-img">
      <div class="therapist-info">
        <h3>${therapist.name}</h3>
        <p class="therapist-specialty">${therapist.qualification}</p>
        <p class="therapist-specialty">Specialties: ${therapist.specialty.join(', ')}</p>
        <button class="btn view-profile" data-id="${therapist._id}">View Profile</button>
        <a href="booking.html?therapist=${therapist._id}" class="btn">Book Session</a>
      </div>
    `;

    therapistsList.appendChild(therapistCard);
  });

  // Add event listeners to view profile buttons
  document.querySelectorAll('.view-profile').forEach(btn => {
    btn.addEventListener('click', viewTherapistProfile);
  });
}

function filterTherapists() {
  const searchTerm = document.getElementById('therapist-search').value.toLowerCase();
  const specialtyFilter = document.getElementById('specialty-filter').value;

  const filtered = allTherapists.filter(therapist => {
    // Search by name or specialty
    const matchesSearch = therapist.name.toLowerCase().includes(searchTerm) || 
                         therapist.specialty.some(s => s.toLowerCase().includes(searchTerm));
    
    // Filter by specialty
    const matchesSpecialty = !specialtyFilter || therapist.specialty.includes(specialtyFilter);
    
    return matchesSearch && matchesSpecialty;
  });

  displayTherapists(filtered);
}

async function viewTherapistProfile(e) {
  const therapistId = e.target.getAttribute('data-id');
  const therapist = allTherapists.find(t => t._id === therapistId);
  
  if (therapist) {
    showTherapistModal(therapist);
  }
}

function showTherapistModal(therapist) {
  const modal = document.getElementById('therapist-modal');
  
  // Set modal content
  document.getElementById('modal-therapist-img').src = therapist.photo || 'assets/therapist-default.jpg';
  document.getElementById('modal-therapist-img').alt = therapist.name;
  document.getElementById('modal-therapist-name').textContent = therapist.name;
  document.getElementById('modal-therapist-qualification').textContent = therapist.qualification;
  document.getElementById('modal-therapist-specialty').textContent = `Specialties: ${therapist.specialty.join(', ')}`;
  document.getElementById('modal-therapist-bio').textContent = therapist.bio;
  document.getElementById('modal-therapist-experience').textContent = `${therapist.experience} years of experience`;
  
  // Set up book button to pass therapist ID
  document.getElementById('book-with-therapist').href = `booking.html?therapist=${therapist._id}`;

  // Set up close button
  document.querySelector('.close-modal').onclick = () => {
    modal.style.display = 'none';
  };

  modal.style.display = 'block';
}

// Close modal when clicking outside of it
window.onclick = function(event) {
  const therapistModal = document.getElementById('therapist-modal');
  const sessionModal = document.getElementById('session-modal');
  
  if (event.target === therapistModal) {
    therapistModal.style.display = 'none';
  }
  
  if (event.target === sessionModal) {
    sessionModal.style.display = 'none';
  }
};