document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        initializeBookingForm();
    }

    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
});

const API_BASE_URL = 'http://localhost:6001/api'; // Changed from 6003 to 6001
let vacationPeriods = [];

async function fetchVacations() {
    try {
        const response = await fetch(`${API_BASE_URL}/vacances`);
        if (!response.ok) {
            throw new Error(`Erreur de chargement des vacances: ${response.statusText}`);
        }
        vacationPeriods = await response.json();
    } catch (error) {
        console.error("Erreur lors de la récupération des vacances:", error);
    }
}

function initializeBookingForm() {
    fetchVacations().then(() => {
        setupCalendar();
        setupFormNavigation();
        setupServiceSelection();
        bookingForm.addEventListener('submit', handleFormSubmission);
    });
}

function setupCalendar() {
    const monthYearElement = document.getElementById('currentMonthYear');
    const calendarDaysElement = document.getElementById('calendarDays');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
    const appointmentDateInput = document.getElementById('appointment-date');

    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        monthYearElement.textContent = `${date.toLocaleString('fr-FR', { month: 'long' })} ${year}`;
        calendarDaysElement.innerHTML = '';

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; 

        for (let i = 0; i < startDayOfWeek; i++) {
            calendarDaysElement.innerHTML += `<div class="calendar-day empty"></div>`;
        }

        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const dayDate = new Date(year, month, day);
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.textContent = day;
            dayElement.dataset.date = dayDate.toISOString().split('T')[0];

            const isPast = dayDate < today;
            const isSunday = dayDate.getDay() === 0;
            const vacationReason = isDateInVacation(dayDate);

            if (isPast || isSunday || vacationReason) {
                dayElement.classList.add('disabled');
                if (vacationReason) {
                    dayElement.setAttribute('title', vacationReason);
                }
            } else {
                dayElement.addEventListener('click', () => {
                    document.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
                    dayElement.classList.add('selected');
                    appointmentDateInput.value = dayElement.dataset.date;
                    updateAvailableTimeSlots(dayElement.dataset.date);
                });
            }
            calendarDaysElement.appendChild(dayElement);
        }
    }

    function isDateInVacation(date) {
        for (const period of vacationPeriods) {
            const start = new Date(period.startDate);
            const end = new Date(period.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            if (date >= start && date <= end) {
                return period.reason || 'Fermé';
            }
        }
        return null;
    }

    prevMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    nextMonthButton.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

    renderCalendar(currentDate);
}

async function updateAvailableTimeSlots(selectedDate) {
    const timeSlotsContainer = document.querySelector('.time-slots');
    timeSlotsContainer.innerHTML = `<div class="loading-slots">Chargement des créneaux...</div>`;

    try {
        const response = await fetch(`${API_BASE_URL}/available-slots/${selectedDate}`);
        if (!response.ok) {
            throw new Error(`Erreur ${response.status}`);
        }
        const availableSlots = await response.json();

        timeSlotsContainer.innerHTML = '';
        if (availableSlots.length === 0) {
            timeSlotsContainer.innerHTML = `<div class="no-slots">Aucun créneau disponible pour cette date.</div>`;
            return;
        }

        availableSlots.forEach(slot => {
            const label = document.createElement('label');
            label.classList.add('time-slot');
            label.innerHTML = `
                <input type="radio" name="time" value="${slot}" required>
                <span>${slot}</span>
            `;
            timeSlotsContainer.appendChild(label);
        });

    } catch (error) {
        console.error("Erreur lors de la récupération des créneaux:", error);
        timeSlotsContainer.innerHTML = `<div class="error-message">Erreur lors de la récupération des disponibilités.</div>`;
    }
}

function setupFormNavigation() {
    const steps = [...document.querySelectorAll('.form-step')];
    const progressSteps = [...document.querySelectorAll('.progress-step')];
    let currentStep = 1;

    window.nextStep = async () => { // Make nextStep async
        if (await validateStep(currentStep)) { // Await the validation
            if (currentStep < steps.length) {
                if (currentStep === 4) {
                    updateSummary();
                }
                currentStep++;
                updateFormStep();
            }
        }
    };

    window.prevStep = () => {
        if (currentStep > 1) {
            currentStep--;
            updateFormStep();
        }
    };

    function updateFormStep() {
        steps.forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step) === currentStep);
        });
        progressSteps.forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.toggle('active', stepNum <= currentStep);
        });
        document.querySelector('.progress-fill').style.width = `${((currentStep - 1) / (steps.length - 1)) * 100}%`;
    }

    async function validateStep(step) {
        const currentStepElement = steps[step - 1];
        const inputs = [...currentStepElement.querySelectorAll('input[required], select[required], textarea[required]')];
        let isValid = true;
        inputs.forEach(input => {
            if (!input.checkValidity()) {
                isValid = false;
                input.classList.add('invalid');
            } else {
                input.classList.remove('invalid');
            }
        });

        // Specific validation for step 3 (Vos informations)
        if (step === 3) {
            const phoneInput = document.getElementById('phone');
            const emailInput = document.getElementById('email');
            if (phoneInput && emailInput) {
                const clientStatus = await checkClientStatus(emailInput.value, phoneInput.value);
                if (clientStatus === 'blocked' || clientStatus === 'blacklisted') {
                    showBlockedModal();
                    isValid = false;
                }
            }
        }
        return isValid;
    }
}

function setupServiceSelection() {
    document.querySelectorAll('.service-option input[name="service"]').forEach(radio => {
        radio.addEventListener('change', () => {
            document.querySelectorAll('.service-card-form').forEach(card => card.classList.remove('selected'));
            if (radio.checked) {
                radio.closest('.service-card-form').classList.add('selected');
            }
        });
    });
}

function getServiceName(value) {
    if (!value) return 'Non spécifié';
    const serviceInput = document.querySelector(`input[name="service"][value="${value}"]`);
    if (serviceInput) {
        // The h4 is in the next sibling div of the input
        const card = serviceInput.nextElementSibling;
        if (card) {
            const title = card.querySelector('h4');
            return title ? title.textContent : 'Service';
        }
    }
    return 'Non spécifié';
}

function updateSummary() {
    try {
        const formData = new FormData(document.getElementById('bookingForm'));
        const data = Object.fromEntries(formData.entries());

        const serviceElement = document.getElementById('summary-service');
        if (serviceElement) {
            serviceElement.textContent = getServiceName(data.service);
        }

        const datetimeElement = document.getElementById('summary-datetime');
        if (datetimeElement) {
            if (data.date && data.time) {
                const date = new Date(data.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                datetimeElement.textContent = `${date} à ${data.time}`;
            } else {
                datetimeElement.textContent = 'Non sélectionné';
            }
        }

        const contactElement = document.getElementById('summary-contact');
        if (contactElement) {
            contactElement.innerHTML = `${data.firstName || ''} ${data.lastName || ''}<br>${data.phone || ''}<br>${data.email || ''}`;
        }

        const vehicleElement = document.getElementById('summary-vehicle');
        if (vehicleElement) {
            vehicleElement.innerHTML = `${data.brand || ''} ${data.model || ''} (${data.year || ''})<br>Immat: ${data.license || ''}`;
        }

        const insuranceElement = document.getElementById('summary-insurance');
        if (insuranceElement) {
            const insuranceSelect = document.getElementById('insurance');
            let insuranceText = 'Non spécifiée';
            if (insuranceSelect && insuranceSelect.selectedIndex >= 0) {
                insuranceText = insuranceSelect.options[insuranceSelect.selectedIndex].text;
            }
            insuranceElement.innerHTML = `Assurance: ${insuranceText}<br>Police: ${data.policyNumber || 'N/A'}`;
        }
    } catch (e) {
        console.error("Erreur lors de la mise à jour du récapitulatif:", e);
        alert("Une erreur est survenue. Veuillez vérifier les informations saisies.");
    }
}

async function handleFormSubmission(event) {
    event.preventDefault();
    const formData = new FormData(bookingForm);

    // Le nom complet sera construit côté serveur, pas besoin de le faire ici.

    try {
        const response = await fetch(`${API_BASE_URL}/rendezvous`, {
            method: 'POST',
            body: formData // Envoyer l'objet FormData directement
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erreur ${response.status}`);
        }

        const result = await response.json();
        
        // Signaler au dashboard admin qu'un nouveau rendez-vous a été ajouté
        localStorage.setItem('newAppointmentAdded', JSON.stringify({
            timestamp: Date.now(),
            appointmentData: result
        }));
        
        // Clear the form and display the confirmation message
        bookingForm.innerHTML = ''; // Clear existing form content
        bookingForm.classList.add('booking-confirmation-message'); // Add the class for styling

        const confirmationHeader = document.createElement('div');
        confirmationHeader.className = 'confirmation-header';
        confirmationHeader.innerHTML = `
            <i class="fas fa-check-circle confirmation-icon"></i>
            <h3>Rendez-vous confirmé !</h3>
        `;

        const confirmationText1 = document.createElement('p');
        confirmationText1.className = 'confirmation-text';
        confirmationText1.innerHTML = `Merci <strong>${result.name}</strong>, votre rendez-vous a bien été enregistré.`;

        const confirmationText2 = document.createElement('p');
        confirmationText2.className = 'confirmation-text';
        confirmationText2.innerHTML = `Un email de confirmation détaillé vous a été envoyé à <strong>${result.email}</strong>.`;

        const importantInfoBox = document.createElement('div');
        importantInfoBox.className = 'important-info-box';
        importantInfoBox.innerHTML = `
            <h4><i class="fas fa-info-circle"></i> Informations importantes pour votre rendez-vous :</h4>
            <ul>
                <li>Veuillez vous présenter <strong>10 minutes avant</strong> l'heure de votre rendez-vous.</li>
                <li>N'oubliez pas d'apporter votre <strong>carte grise</strong> et votre <strong>attestation d'assurance</strong>.</li>
            </ul>
        `;

        const warningInfoBox = document.createElement('div');
        warningInfoBox.className = 'warning-info-box';
        warningInfoBox.innerHTML = `
            <h4><i class="fas fa-exclamation-triangle"></i> Avertissement :</h4>
            <p>Tout rendez-vous non honoré ou non annulé au moins <strong>24 heures à l'avance</strong> entraînera l'inscription de votre profil sur notre liste noire. Cela vous rendra impossible la réservation de futurs rendez-vous avec nos services. Nous vous remercions de votre compréhension et de votre coopération.</p>
        `;

        const returnButton = document.createElement('button');
        returnButton.type = 'button';
        returnButton.className = 'btn-return-home';
        returnButton.innerHTML = `Retour à l'accueil <i class="fas fa-home"></i>`;
        returnButton.onclick = () => window.location.href = 'index.html';

        bookingForm.appendChild(confirmationHeader);
        bookingForm.appendChild(confirmationText1);
        bookingForm.appendChild(confirmationText2);
        bookingForm.appendChild(importantInfoBox);
        bookingForm.appendChild(warningInfoBox);
        bookingForm.appendChild(returnButton);

        document.querySelector('.form-progress').style.display = 'none';

    } catch (error) {
        alert(`Erreur lors de la prise de rendez-vous : ${error.message}`);
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

async function checkClientStatus(email, phone) {
    try {
        const response = await fetch(`${API_BASE_URL}/client-status?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`);
        if (!response.ok) {
            throw new Error(`Erreur lors de la vérification du statut du client: ${response.statusText}`);
        }
        const data = await response.json();
        return data.status;
    } catch (error) {
        console.error("Erreur lors de la vérification du statut du client:", error);
        return 'error'; // Handle error gracefully
    }
}

function showBlockedModal() {
    const modal = document.getElementById('blocked-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}
