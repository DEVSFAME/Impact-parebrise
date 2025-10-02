// Backend API integration
console.log('admin_script.js loaded and executing.');
class AdminDB {
    constructor() {
        this.appointments = [];
        this.services = []; // Initialize as empty, will be loaded from backend or default
        this.clients = [];
        this.timeSlots = ["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];
        this.vacations = [];
        this.init();
    }

    async init() {
        await this.loadAllData();
    }

    async loadAllData() {
        try {
            const cacheBuster = `?t=${new Date().getTime()}`;
            // Load appointments
            const appointmentsResponse = await fetch(`http://localhost:6001/api/rendezvous${cacheBuster}`);
            if (appointmentsResponse.ok) {
                this.appointments = await appointmentsResponse.json();
            }

            // Load clients
            const clientsResponse = await fetch(`http://localhost:6001/api/clients${cacheBuster}`);
            if (clientsResponse.ok) {
                this.clients = await clientsResponse.json();
            }
            
            // Load blocked clients
            const blockedClientsResponse = await fetch(`http://localhost:6001/api/blocked-clients${cacheBuster}`);
            if (blockedClientsResponse.ok) {
                this.blockedClients = await blockedClientsResponse.json();
            } else {
                this.blockedClients = [];
            }

            // Load time slots
            const timeSlotsResponse = await fetch(`http://localhost:6001/api/creneaux${cacheBuster}`);
            if (timeSlotsResponse.ok) {
                this.timeSlots = await timeSlotsResponse.json();
            }

            // Load vacations
            const vacationsResponse = await fetch(`http://localhost:6001/api/vacances${cacheBuster}`);
            if (vacationsResponse.ok) {
                this.vacations = await vacationsResponse.json();
            }

            // Load services
            const servicesResponse = await fetch(`http://localhost:6001/api/services${cacheBuster}`);
            if (servicesResponse.ok) {
                this.services = await servicesResponse.json();
                // If no services are loaded from backend, initialize with default ones
                if (this.services.length === 0) {
                    this.initializeDefaultServices();
                }
            } else {
                // If fetching services fails, initialize with default ones
                this.initializeDefaultServices();
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            // Fallback to default services if any error occurs during fetch
            this.initializeDefaultServices();
        }
    }

    initializeDefaultServices() {
        this.services = [
            {"id": 1, "name": "Remplacement Pare-brise", "price": 150, "duration": 90, "status": "active", "description": "Remplacement complet avec garantie"},
            {"id": 2, "name": "Réparation Impact", "price": 50, "duration": 30, "status": "active", "description": "Réparation rapide d'impacts et fissures"},
            {"id": 3, "name": "Vitres Latérales", "price": 100, "duration": 60, "status": "active", "description": "Remplacement vitres avant/arrière"},
            {"id": 4, "name": "Lunette Arrière", "price": 120, "duration": 75, "status": "active", "description": "Remplacement lunette chauffante"},
            {"id": 5, "name": "Toit Panoramique", "price": 200, "duration": 120, "status": "active", "description": "Réparation toit ouvrant"},
            {"id": 6, "name": "Rénovation Phares", "price": 40, "duration": 45, "status": "active", "description": "Polissage et rénovation"}
        ];
        this.saveServices(); // Save default services to backend
    }

    async saveServices() {
        try {
            const response = await fetch('http://localhost:6001/api/services', {
                method: 'PUT', // Or POST if creating new, PUT for updating all
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.services)
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors de la sauvegarde des services');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des services:', error);
        }
    }

    async saveTimeSlots() {
        try {
            const response = await fetch('http://localhost:6001/api/creneaux', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.timeSlots)
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors de la sauvegarde des créneaux');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des créneaux:', error);
        }
    }

    async saveVacation(vacation) {
        try {
            const response = await fetch('http://localhost:6001/api/vacances', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(vacation)
            });
            
            if (response.ok) {
                const savedVacation = await response.json();
                this.vacations.push(savedVacation);
                return savedVacation;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la sauvegarde des vacances');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des vacances:', error);
            throw error;
        }
    }

    async deleteVacation(vacationId) {
        try {
            const response = await fetch(`http://localhost:6001/api/vacances/${vacationId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.vacations = this.vacations.filter(v => v.id !== vacationId);
                return true;
            } else {
                throw new Error('Erreur lors de la suppression des vacances');
            }
        } catch (error) {
            console.error('Erreur lors de la suppression des vacances:', error);
            throw error;
        }
    }

    async updateClientStatus(clientId, status) {
        try {
            const response = await fetch(`http://localhost:6001/api/clients/${clientId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!response.ok) {
                throw new Error('Failed to update client status');
            }
            // Reload all data to ensure consistency
            await this.loadAllData();
        } catch (error) {
            console.error('Error updating client status:', error);
        }
    }

    async saveAppointment(appointment) {
        try {
            const response = await fetch('http://localhost:6001/api/rendezvous', {
                method: 'POST', // Assuming POST for new appointments
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(appointment)
            });
            
            if (response.ok) {
                const savedAppointment = await response.json();
                // Update the local appointment list with the saved one (which might have an ID from backend)
                const index = this.appointments.findIndex(a => a.id === appointment.id);
                if (index > -1) {
                    this.appointments[index] = savedAppointment;
                } else {
                    this.appointments.push(savedAppointment);
                }
                return savedAppointment;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la sauvegarde du rendez-vous');
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du rendez-vous:', error);
            throw error;
        }
    }

    async addAppointment(appointment) {
        // Ensure all relevant fields are present before saving
        const newAppointment = {
            id: Date.now(), // Temporary ID, will be replaced by backend ID
            name: appointment.name,
            phone: appointment.phone,
            email: appointment.email || '',
            date: appointment.date,
            time: appointment.time,
            service: appointment.service,
            vehicleMake: appointment.vehicleMake || '',
            vehicleModel: appointment.vehicleModel || '',
            vehicleYear: appointment.vehicleYear || '',
            licensePlate: appointment.licensePlate || '',
            insuranceName: appointment.insuranceName || '',
            message: appointment.message || '',
            status: appointment.status || 'pending', // Default status
            firstVisit: appointment.firstVisit || false
        };
        
        this.appointments.push(newAppointment); // Add to local list immediately for UI responsiveness
        this.updateClient(newAppointment); // Update client stats locally
        this.sendEmailNotification(newAppointment); // Send notification

        try {
            await this.saveAppointment(newAppointment); // Persist to backend
            await this.loadAllData(); // Reload all data to ensure consistency after backend save
        } catch (error) {
            console.error('Failed to add appointment to backend:', error);
            // Optionally, remove from local list if backend save fails
            this.appointments = this.appointments.filter(a => a.id !== newAppointment.id);
            // Revert client update if necessary, or handle error gracefully
        }
    }

    updateClient(appointment) {
        let client = this.clients.find(c => c.phone === appointment.phone);
        if (client) {
            client.reservations++;
            client.lastVisit = appointment.date;
            // Mettre à jour les informations du véhicule si elles sont fournies dans le nouveau RDV
            if (appointment.vehicleMake) client.vehicleMake = appointment.vehicleMake;
            if (appointment.vehicleModel) client.vehicleModel = appointment.vehicleModel;
            if (appointment.vehicleYear) client.vehicleYear = appointment.vehicleYear;
        } else {
            this.clients.push({
                id: Date.now(),
                name: appointment.name,
                phone: appointment.phone,
                email: appointment.email || '',
                reservations: 1,
                lastVisit: appointment.date,
                vehicleMake: appointment.vehicleMake || '',
                vehicleModel: appointment.vehicleModel || '',
                vehicleYear: appointment.vehicleYear || ''
            });
        }
    }

    sendEmailNotification(appointment) {
        console.log(`📧 Email envoyé: Nouveau RDV ${appointment.name} le ${appointment.date} à ${appointment.time}`);
    }

    getStats() {
        const today = new Date().toISOString().split('T')[0];
        const thisWeek = this.getWeekStart(new Date());
        const thisMonth = new Date().toISOString().slice(0, 7);

        return {
            today: this.appointments.filter(a => a.date === today).length,
            week: this.appointments.filter(a => a.date >= thisWeek).length,
            month: this.appointments.filter(a => a.date.startsWith(thisMonth)).length,
            totalClients: this.clients.length
        };
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff)).toISOString().split('T')[0];
    }
}

// Instance globale
const db = new AdminDB();

// Navigation
async function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    document.getElementById(sectionId).classList.add('active');
    event.target.classList.add('active');
    
    // Recharger les données à chaque changement de section depuis le backend
    await db.loadAllData();
    
    if (sectionId === 'appointments') loadAppointments();
    if (sectionId === 'agenda') loadAgenda();
    if (sectionId === 'services') loadServices();
    if (sectionId === 'clients') loadClients();
    if (sectionId === 'stats') loadStats();
    if (sectionId === 'availability') {
        loadTimeSlots();
        loadVacations();
    }
    if (sectionId === 'blacklist') loadBlacklist();
}

// Agenda
function loadAgenda() {
    const calendarEl = document.getElementById('calendar');
    if (calendarEl.fullCalendar) {
        calendarEl.fullCalendar('destroy');
    }
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        locale: 'fr',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        buttonText: {
            today:    'Aujourd\'hui',
            month:    'Mois',
            week:     'Semaine',
            day:      'Jour'
        },
        allDaySlot: false,
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
        },
        events: db.appointments.map(apt => ({
            title: `${apt.name} - ${getServiceDisplayName(apt.service)}`,
            start: `${apt.date}T${apt.time}`,
            extendedProps: {
                appointment: apt
            }
        })),
        eventClick: function(info) {
            showAppointmentModal(info.event.extendedProps.appointment);
        },
        slotMinTime: '08:00:00',
        slotMaxTime: '20:00:00',
        contentHeight: 'auto',
        eventColor: 'var(--primary-color)',
    });
    calendar.render();
}

function logout() {
    window.location.href = '../index.html';
}

// Chargement initial
function loadDashboard() {
    loadAppointments();
    loadStats();
}

// Fonction pour déterminer le lieu d'intervention
function getInterventionLocation(appointment) {
    console.log('Appointment data for location:', appointment);
    if (appointment.interventionInAgency === true || appointment.interventionInAgency === 'true') {
        return {
            type: 'agency',
            display: '🏢 Agence',
            address: null
        };
    } else if (appointment.interventionAddress || appointment.addressType) {
        const addressType = appointment.addressType === 'private' ? 'Privée' : 
                           appointment.addressType === 'work' ? 'Travail' : 
                           'Domicile';
        return {
            type: 'external',
            display: `📍 ${addressType}`,
            address: appointment.interventionAddress || appointment.address
        };
    } else {
        // Fallback pour les anciens RDV qui n'ont que le champ address
        return {
            type: 'external',
            display: '📍 Domicile',
            address: appointment.address
        };
    }
}

// Gestion des rendez-vous
function loadAppointments() {
    const grid = document.getElementById('appointments-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const today = new Date().toISOString().split('T')[0];

    let filteredAppointments = db.appointments.filter(appointment => {
        // Filter out past appointments
        if (appointment.date < today) return false;

        // Filter out honored appointments
        if (appointment.status === 'honored') return false;

        if (currentFilters.service && appointment.service !== currentFilters.service) return false;
        if (currentFilters.dateFrom && appointment.date < currentFilters.dateFrom) return false;
        if (currentFilters.dateTo && appointment.date > currentFilters.dateTo) return false;
        return true;
    });

    filteredAppointments.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
        .forEach(appointment => {
            const card = document.createElement('div');
            card.className = 'appointment-card';
            const location = getInterventionLocation(appointment);
            
            card.innerHTML = `
                <div class="appointment-header">
                    <div class="appointment-date">${formatDate(appointment.date)}</div>
                    <div class="appointment-time">${appointment.time}</div>
                    <div class="delete-btn" onclick="confirmDelete(${appointment.id})" title="Supprimer ce rendez-vous">×</div>
                </div>
                <div class="appointment-client">${appointment.name}${appointment.firstVisit ? ' <span class="first-visit-tag">1ère visite</span>' : ''}</div>
                <div class="appointment-service">${getServiceDisplayName(appointment.service)}</div>
                <div class="appointment-location">${location.display}</div>
                <div class="status-buttons">
                    <button class="btn-status btn-status-honored ${appointment.status === 'honored' ? 'active' : ''}" onclick="setStatus(${appointment.id}, 'honored')">Honoré</button>
                    <button class="btn-status btn-status-not-honored ${appointment.status === 'not-honored' ? 'active' : ''}" onclick="setStatus(${appointment.id}, 'not-honored')">Non honoré</button>
                </div>
                <div class="appointment-details" style="display:none;">
                    <div class="detail-row"><strong>Téléphone:</strong> ${appointment.phone}</div>
                    <div class="detail-row"><strong>Email:</strong> ${appointment.email}</div>
                    <div class="detail-row"><strong>Lieu:</strong> ${location.display}${location.address ? ` - ${location.address}` : ''}</div>
                    ${appointment.brand ? `<div class="detail-row"><strong>Marque:</strong> ${appointment.brand}</div>` : ''}
                    ${appointment.model ? `<div class="detail-row"><strong>Modèle:</strong> ${appointment.model}</div>` : ''}
                    ${appointment.year ? `<div class="detail-row"><strong>Année:</strong> ${appointment.year}</div>` : ''}
                    ${appointment.license ? `<div class="detail-row"><strong>Immatriculation:</strong> ${appointment.license}</div>` : ''}
                    ${appointment.insurance ? `<div class="detail-row"><strong>Assurance:</strong> ${appointment.insurance}</div>` : ''}
                    ${appointment.policyNumber ? `<div class="detail-row"><strong>Numéro de police:</strong> ${appointment.policyNumber}</div>` : ''}
                    ${appointment.description ? `<div class="detail-row"><strong>Description:</strong> ${appointment.description}</div>` : ''}
                </div>
            `;
            
            // Add click event to open the new modal
            card.addEventListener('click', function(e) {
                if (!e.target.closest('.status-buttons') && !e.target.closest('.delete-btn')) {
                    showAppointmentModal(appointment);
                }
            });
            
            grid.appendChild(card);
        });
}

async function setStatus(id, status) {
    const appointment = db.appointments.find(a => a.id === id);
    if (!appointment) return;

    if (status === 'not-honored') {
        showAbsenceModal(id);
    } else if (status === 'honored') {
        showHonoredConfirmationModal(id);
    }
}

function showHonoredConfirmationModal(appointmentId) {
    const modal = document.createElement('div');
    modal.className = 'modal honored-confirmation-modal';
    modal.style.display = 'flex';

    modal.innerHTML = `
        <div class="modal-content">
            <p>Confirmez-vous que le rendez-vous a bien été honoré ?</p>
            <div class="modal-actions">
                <button class="btn-modal btn-confirm">Oui</button>
                <button class="btn-modal btn-danger">Non</button>
            </div>
            <div class="modal-footer-cancel">
                <button class="btn-modal btn-cancel">Annuler</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
        modal.remove();
    };

    modal.querySelector('.btn-confirm').onclick = async () => {
        const appointment = db.appointments.find(a => a.id === appointmentId);
        try {
            const response = await fetch(`http://localhost:6001/api/rendezvous/${appointmentId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'honored', lastVisit: appointment.date })
            });
            if (response.ok) {
                closeModal();
                showSuccessModal('Rendez-vous marqué comme honoré.');
                await db.loadAllData();
                loadAppointments();
                loadClients();
                loadStats();
            } else {
                throw new Error('Failed to honor appointment.');
            }
        } catch (error) {
            console.error('Error honoring appointment:', error);
            closeModal(); // Fermer le modal de confirmation en cas d'erreur
            showConfirmModal('Erreur', 'Une erreur est survenue.', null, 'error');
        }
    };

    modal.querySelector('.btn-danger').onclick = closeModal;
    modal.querySelector('.btn-cancel').onclick = closeModal;
}

function showAbsenceModal(appointmentId) {
    const modal = document.getElementById('absence-modal');
    modal.style.display = 'flex';

    const justifiedBtn = document.getElementById('absence-justified-btn');
    const unjustifiedBtn = document.getElementById('absence-unjustified-btn');

    justifiedBtn.onclick = () => {
        handleAbsence(appointmentId, true);
        closeModal('absence-modal');
    };

    unjustifiedBtn.onclick = () => {
        handleAbsence(appointmentId, false);
        closeModal('absence-modal');
    };
}

async function handleAbsence(appointmentId, isJustified) {
    const appointment = db.appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    const client = db.clients.find(c => c.phone === appointment.phone);
    const clientId = client ? client.id : null;

    if (isJustified) {
        // Justified absence: Delete appointment, update client status
        try {
            const response = await fetch(`http://localhost:6001/api/appointments/${appointmentId}/justified`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId })
            });
            if (response.ok) {
                showSuccessModal('Rendez-vous supprimé et statut du client mis à jour.');
                await db.loadAllData();
                loadAppointments();
                loadClients();
                loadStats();
            } else {
                throw new Error('Failed to handle justified absence.');
            }
        } catch (error) {
            console.error('Error handling justified absence:', error);
            showConfirmModal('Erreur', 'Une erreur est survenue.', null, 'error');
        }
    } else {
        // Unjustified absence: Delete appointment, blacklist client
        try {
            const response = await fetch(`http://localhost:6001/api/appointments/${appointmentId}/unjustified`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId })
            });
            if (response.ok) {
                showSuccessModal('Rendez-vous supprimé et client ajouté à la blacklist.');
                await db.loadAllData();
                loadAppointments();
                loadClients();
                loadBlacklist();
                loadStats();
            } else {
                throw new Error('Failed to handle unjustified absence.');
            }
        } catch (error) {
            console.error('Error handling unjustified absence:', error);
            showConfirmModal('Erreur', 'Une erreur est survenue.', null, 'error');
        }
    }
}
// Gestion de la blacklist
function loadBlacklist() {
    const grid = document.getElementById('blacklist-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const blacklistedClients = db.blockedClients;

    if (!blacklistedClients || blacklistedClients.length === 0) {
        grid.innerHTML = '<p class="empty-message">Aucun client n\'est actuellement sur la liste noire.</p>';
        return;
    }

    blacklistedClients.forEach(client => {
        const card = document.createElement('div');
        card.className = 'blacklist-card';
        card.innerHTML = `
            <div class="card-header">
                <i class="fas fa-user-slash"></i>
                <h3>${client.name}</h3>
            </div>
            <div class="card-body">
                <p><i class="fas fa-phone"></i> ${client.phone || 'Non fourni'}</p>
                <p><i class="fas fa-envelope"></i> ${client.email || 'Non fourni'}</p>
                <p><i class="fas fa-calendar-times"></i> Bloqué le: ${formatDate(client.lastVisit) || 'Date inconnue'}</p>
                <p class="reason"><i class="fas fa-exclamation-triangle"></i> Motif: Non-respect des règles.</p>
            </div>
            <div class="card-footer">
                <button class="btn-unblock" onclick="unblacklistClient('${client.id}', '${client.name}')">
                    <i class="fas fa-unlock"></i> Débloquer
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function unblacklistClient(clientId, clientName) {
    showConfirmModal(
        'Débloquer ce client',
        `Êtes-vous sûr de vouloir débloquer <strong>${clientName}</strong> ?<br><small>Ce client pourra à nouveau prendre des rendez-vous.</small>`,
        async () => {
            await db.updateClientStatus(clientId, 'active');
            if (document.getElementById('blacklist')) {
                loadBlacklist();
            }
            loadClients();
        },
        'unblock'
    );
}

// Services
function loadServices() {
    const list = document.getElementById('servicesList');
    if (!list) return;
    
    list.innerHTML = '';
    
    db.services.forEach(service => {
        const item = document.createElement('div');
        item.className = 'service-item';
        item.innerHTML = `
            <div class="service-name">${service.name}</div>
            <div class="service-price">${service.price}€ - ${service.duration}min</div>
            <div class="service-description">${service.description || ''}</div>
            <div class="service-actions">
                <button class="btn-status ${service.status === 'active' ? 'btn-pause' : 'btn-activate'}" 
                        onclick="toggleServiceStatus(${service.id}, '${service.status === 'active' ? 'paused' : 'active'}')">
                    ${service.status === 'active' ? 'Mettre en pause' : 'Activer'}
                </button>
                <button class="btn-delete" onclick="deleteService(${service.id}, '${service.name}')">Supprimer</button>
            </div>
        `;
        list.appendChild(item);
    });
}

async function toggleServiceStatus(serviceId, newStatus) {
    const service = db.services.find(s => s.id === serviceId);
    if (service) {
        service.status = newStatus;
        await db.saveServices();
        loadServices();
    }
}

async function deleteService(serviceId, serviceName) {
    showConfirmModal(
        'Supprimer le service',
        `Êtes-vous sûr de vouloir supprimer définitivement le service <strong>${serviceName}</strong> ?<br><small>Cette action ne peut pas être annulée.</small>`,
        async () => {
            db.services = db.services.filter(s => s.id !== serviceId);
            await db.saveServices();
            loadServices();
        },
        'delete'
    );
}

function showAddService() {
    document.getElementById('serviceModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

const serviceForm = document.getElementById('serviceForm');
if (serviceForm) {
    serviceForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const service = {
            id: Date.now(),
            name: document.getElementById('serviceName').value,
            price: parseInt(document.getElementById('servicePrice').value),
            duration: parseInt(document.getElementById('serviceDuration').value),
            description: document.getElementById('serviceDescription').value
        };
        
        db.services.push(service);
        await db.saveServices();
        loadServices();
        closeModal('serviceModal');
        this.reset();
    });
}

// Clients
function loadClients() {
    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const searchTerm = document.getElementById('client-search').value.toLowerCase();

    const filteredClients = db.clients.filter(client =>
        (client.name && client.name.toLowerCase().includes(searchTerm)) ||
        (client.phone && client.phone.toLowerCase().includes(searchTerm)) ||
        (client.email && client.email.toLowerCase().includes(searchTerm))
    );

    filteredClients.forEach(client => {
        const row = document.createElement('tr');
        const isBlocked = client.status === 'blocked';
        row.innerHTML = `
            <td>${client.name}</td>
            <td>${client.phone}</td>
            <td>${client.email}</td>
            <td>${client.lastVisit ? formatDate(client.lastVisit) : 'N/A'}</td>
            <td>${client.reservations || 0}</td>
            <td>${isBlocked ? '<span class="status-tag blacklisted">Bloqué</span>' : '<span class="status-tag active">Actif</span>'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-view" onclick="showClientDetails('${client.id}')">Détails</button>
                    ${isBlocked ?
                        `<button class="btn-unblock" onclick="unblacklistClient('${client.id}', '${client.name}')">Débloquer</button>` :
                        `<button class="btn-block" onclick="blockClient('${client.id}', '${client.name}')">Bloquer</button>`
                    }
                    <button class="btn-delete" onclick="deleteClient('${client.id}', '${client.name}')">Supprimer</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

document.getElementById('client-search').addEventListener('input', loadClients);

function showClientDetails(clientId) {
    const client = db.clients.find(c => c.id == clientId);
    if (!client) return;

    const clientAppointments = getClientAppointments(client.id);
    const totalAppointments = clientAppointments.length;
    const lastVisit = totalAppointments > 0 ? formatDate(client.lastVisit) : 'N/A';

    // Update header
    document.getElementById('modal-client-name').textContent = client.name;
    document.getElementById('modal-client-phone').textContent = client.phone;
    document.getElementById('modal-client-email').textContent = client.email || 'Non fourni';

    // Update status badge
    const statusBadge = document.getElementById('modal-client-status');
    const statusIcon = statusBadge.querySelector('i');
    const statusText = statusBadge.querySelector('span');
    if (client.status === 'blocked') {
        statusBadge.className = 'client-status-badge blacklisted';
        statusIcon.className = 'fas fa-ban';
        statusText.textContent = 'Bloqué';
    } else {
        statusBadge.className = 'client-status-badge active';
        statusIcon.className = 'fas fa-check-circle';
        statusText.textContent = 'Actif';
    }

    // Update stats
    document.getElementById('modal-total-appointments').textContent = totalAppointments;
    document.getElementById('modal-last-visit').textContent = lastVisit;

    // Update appointment history
    const historyList = document.getElementById('modal-appointment-history');
    historyList.innerHTML = ''; // Clear previous content
    if (clientAppointments.length > 0) {
        clientAppointments
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by most recent
            .forEach(apt => {
                const item = document.createElement('div');
                item.className = 'appointment-history-item';
                item.innerHTML = `
                    <div class="appointment-date">${formatDate(apt.date)}</div>
                    <div class="appointment-service">${getServiceDisplayName(apt.service)}</div>
                    <div class="appointment-status ${apt.status}">${formatStatus(apt.status)}</div>
                `;
                historyList.appendChild(item);
            });
    } else {
        historyList.innerHTML = '<p class="empty-message">Aucun historique de rendez-vous.</p>';
    }

    document.getElementById('client-details-modal').style.display = 'flex';
}

function getClientAppointments(clientId) {
    const client = db.clients.find(c => c.id == clientId);
    if (!client) return [];
    return db.appointments.filter(apt => apt.phone === client.phone || apt.email === client.email);
}

function blockClient(clientId, clientName) {
    showConfirmModal(
        'Bloquer ce client',
        `Êtes-vous sûr de vouloir bloquer <strong>${clientName}</strong> ?<br><small>Cette action empêchera ce client de prendre des rendez-vous.</small>`,
        async () => {
            await db.updateClientStatus(clientId, 'blocked');
            loadClients();
            if (document.getElementById('blacklist')) {
                loadBlacklist();
            }
        },
        'block'
    );
}

async function deleteClient(id, name) {
    showConfirmModal(
        'Supprimer ce client',
        `Êtes-vous sûr de vouloir supprimer définitivement <strong>${name}</strong> ?<br><small>Cette action supprimera toutes ses données (historique des RDV inclus) et ne peut pas être annulée.</small>`,
        async () => {
                try {
                    const response = await fetch(`http://localhost:6001/api/clients/${id}`, {
                        method: 'DELETE'
                    });

                if (response.ok) {
                    // Mettre à jour les données locales après la suppression réussie
                    await db.loadAllData();
                    loadClients();
                    loadAppointments();
                    loadBlacklist();
                    loadStats();
                    showSuccessModal(`Le client <strong>${name}</strong> et tous ses rendez-vous ont été supprimés.`);
                } else {
                    const errorData = await response.json();
                    showConfirmModal('Erreur', `Erreur lors de la suppression du client: ${errorData.message || response.statusText}`, null, 'error');
                }
            } catch (error) {
                console.error('Erreur lors de la suppression du client:', error);
                showConfirmModal('Erreur', 'Une erreur est survenue lors de la suppression du client.', null, 'error');
            }
        },
        'delete'
    );
}

// Statistiques
let statsFilters = { service: '', dateFrom: '', dateTo: '', status: '' };

function loadStats() {
    let filteredAppts = db.appointments.filter(a => {
        if (statsFilters.service && a.service !== statsFilters.service) return false;
        if (statsFilters.dateFrom && a.date < statsFilters.dateFrom) return false;
        if (statsFilters.dateTo && a.date > statsFilters.dateTo) return false;
        if (statsFilters.status && a.status !== statsFilters.status) return false;
        return true;
    });
    
    const honored = filteredAppts.filter(a => a.status === 'honored').length;
    const notHonored = filteredAppts.filter(a => a.status === 'not-honored').length;
    const revenue = filteredAppts.filter(a => a.status === 'honored').reduce((sum, a) => sum + a.price, 0);
    
    const honoredEl = document.getElementById('honoredStats');
    const notHonoredEl = document.getElementById('notHonoredStats');
    const revenueEl = document.getElementById('revenueStats');
    const totalClientsEl = document.getElementById('totalClients');
    
    if (honoredEl) honoredEl.textContent = honored;
    if (notHonoredEl) notHonoredEl.textContent = notHonored;
    if (revenueEl) revenueEl.textContent = revenue + '€';
    if (totalClientsEl) totalClientsEl.textContent = db.clients.length;
}

function applyStatsFilters() {
    const serviceFilter = document.getElementById('statsServiceFilter');
    const dateFrom = document.getElementById('statsDateFrom');
    const dateTo = document.getElementById('statsDateTo');
    const statusFilter = document.getElementById('statsStatusFilter');
    
    if (serviceFilter) statsFilters.service = serviceFilter.value;
    if (dateFrom) statsFilters.dateFrom = dateFrom.value;
    if (dateTo) statsFilters.dateTo = dateTo.value;
    if (statusFilter) statsFilters.status = statusFilter.value;
    
    loadStats();
}

function resetStatsFilters() {
    const serviceFilter = document.getElementById('statsServiceFilter');
    const dateFrom = document.getElementById('statsDateFrom');
    const dateTo = document.getElementById('dateToFilter');
    const statusFilter = document.getElementById('statsStatusFilter');
    
    if (serviceFilter) serviceFilter.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    if (statusFilter) statusFilter.value = '';
    
    statsFilters = { service: '', dateFrom: '', dateTo: '', status: '' };
    loadStats();
}

// Créneaux horaires
function loadTimeSlots() {
    const list = document.getElementById('timeSlotsList');
    if (!list) return;
    
    list.innerHTML = '';
    
    // Sort time slots before displaying
    db.timeSlots.sort((a, b) => a.localeCompare(b));

    db.timeSlots.forEach(slot => {
        const item = document.createElement('div');
        item.className = 'time-slot-item';
        item.innerHTML = `
            <span>${slot}</span>
            <button onclick="removeTimeSlot('${slot}')" class="btn-danger">Supprimer</button>
        `;
        list.appendChild(item);
    });
}

function showAddTimeSlotModal() {
    document.getElementById('addTimeSlotModal').style.display = 'flex';
}

const addTimeSlotForm = document.getElementById('addTimeSlotForm');
const newTimeSlotInput = document.getElementById('newTimeSlot');

if (newTimeSlotInput) {
    // This listener handles adding the colon automatically
    newTimeSlotInput.addEventListener('input', function(e) {
        let input = e.target;
        let value = input.value.replace(/\D/g, ''); // Remove non-digits
        
        if (value.length > 2) {
            // Insert colon after the hour part
            value = value.substring(0, 2) + ':' + value.substring(2, 4);
        }
        input.value = value;
    });

    // This listener handles formatting on blur (when the user leaves the field)
    newTimeSlotInput.addEventListener('blur', function(e) {
        let input = e.target;
        let value = input.value.replace(/\D/g, ''); // Clean up again
        
        let hour = '00';
        let minute = '00';

        if (value.length === 1) {
            // User typed "9" -> "09:00"
            hour = '0' + value;
        } else if (value.length === 2) {
            // User typed "12" -> "12:00"
            hour = value;
        } else if (value.length === 3) {
            // User typed "123" -> "12:30"
            hour = value.substring(0, 2);
            minute = value.substring(2) + '0';
        } else if (value.length >= 4) {
            // User typed "1234" -> "12:34"
            hour = value.substring(0, 2);
            minute = value.substring(2, 4);
        }
        
        // Final validation and formatting
        let h = parseInt(hour, 10);
        let m = parseInt(minute, 10);

        if (isNaN(h) || h < 0 || h > 23) h = 0;
        if (isNaN(m) || m < 0 || m > 59) m = 0;

        input.value = h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
    });
}

if (addTimeSlotForm) {
    addTimeSlotForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const time = newTimeSlotInput.value;

        if (time && /^\d{2}:\d{2}$/.test(time)) {
            // Prevent adding duplicate time slots
            if (db.timeSlots.includes(time)) {
                alert('Ce créneau horaire existe déjà.');
                return;
            }
            db.timeSlots.push(time);
            await db.saveTimeSlots();
            loadTimeSlots(); // Reload to show the sorted list
            closeModal('addTimeSlotModal');
            this.reset();
        } else {
            alert('Veuillez entrer un format d\'heure valide (HH:MM).');
        }
    });
}
async function addTimeSlot() {
    showAddTimeSlotModal();
}

async function removeTimeSlot(time) {
    db.timeSlots = db.timeSlots.filter(slot => slot !== time);
    await db.saveTimeSlots();
    loadTimeSlots();
}

// Filtres
let currentFilters = { service: '', dateFrom: '', dateTo: '' };

function applyFilters() {
    const serviceFilter = document.getElementById('serviceFilter');
    const dateFrom = document.getElementById('dateFromFilter');
    const dateTo = document.getElementById('dateToFilter');
    
    if (serviceFilter) currentFilters.service = serviceFilter.value;
    if (dateFrom) currentFilters.dateFrom = dateFrom.value;
    if (dateTo) currentFilters.dateTo = dateTo.value;
    
    loadAppointments();
}

function resetFilters() {
    const serviceFilter = document.getElementById('serviceFilter');
    const dateFrom = document.getElementById('dateFromFilter');
    const dateTo = document.getElementById('dateToFilter');
    
    if (serviceFilter) serviceFilter.value = '';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    currentFilters = { service: '', dateFrom: '', dateTo: '' };
    loadAppointments();
}

// Export CSV
function exportCSV() {
    const csv = [
        'Date,Heure,Client,Service,Téléphone,Prix',
        ...db.appointments.map(a => `${a.date},${a.time},${a.name},${a.service},${a.phone},${a.price}€`)
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rendez-vous-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

// Fonction de mapping des services
function getServiceDisplayName(value) {
    const serviceMapping = {
        'pare-brise': 'Remplacement Pare-brise',
        'reparation': 'Réparation Impact',
        'vitre-laterale': 'Vitres Latérales',
        'lunette': 'Lunette Arrière',
        'toit': 'Toit Panoramique',
        'phare': 'Rénovation Phares'
    };
    return serviceMapping[value] || value;
}

// Utilitaires
function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    });
}

function formatStatus(status) {
    if (!status || status === 'pending') return '(en attente)';
    switch (status) {
        case 'honored':
            return '(honoré)';
        case 'not-honored':
            return '(non honoré)';
        default:
            return `(${status})`;
    }
}

// Nouvelles fonctions
async function confirmDelete(id) {
    const appointment = db.appointments.find(a => a.id === id);
    showConfirmModal(
        'Supprimer ce rendez-vous',
        `Êtes-vous sûr de vouloir supprimer définitivement le rendez-vous de <strong>${appointment.name}</strong> ?<br><small>Cette action ne peut pas être annulée.</small>`,
        async () => { // Make this callback function async
            if (appointment) {
                // Supprimer le RDV
                db.appointments = db.appointments.filter(a => a.id !== id);
                
                // Mettre à jour le client
                const client = db.clients.find(c => c.phone === appointment.phone);
                if (client) {
                    client.reservations = Math.max(0, client.reservations - 1);
                    
                    // Si plus de réservations, trouver la dernière visite restante
                    const remainingAppointments = db.appointments.filter(a => a.phone === client.phone);
                    if (remainingAppointments.length > 0) {
                        const lastVisit = remainingAppointments
                            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                        client.lastVisit = lastVisit.date;
                    } else {
                        // Si plus de RDV, supprimer le client
                        db.clients = db.clients.filter(c => c.phone !== client.phone);
                    }
                }
                
                try {
                    const response = await fetch(`http://localhost:6001/api/rendezvous/${id}`, {
                        method: 'DELETE'
                    });
                    
                    // Update local data after successful deletion from backend
                    db.appointments = db.appointments.filter(a => a.id !== id);
                    
                    // Mettre à jour le client localement (la logique côté serveur gère déjà la persistance)
                    const client = db.clients.find(c => c.phone === appointment.phone);
                    if (client) {
                        client.reservations = Math.max(0, client.reservations - 1);
                        const remainingAppointments = db.appointments.filter(a => a.phone === client.phone);
                        if (remainingAppointments.length > 0) {
                            const lastVisit = remainingAppointments
                                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                            client.lastVisit = lastVisit.date;
                        } else {
                            // Si plus de RDV, supprimer le client de la liste locale
                            db.clients = db.clients.filter(c => c.phone !== client.phone);
                        }
                    }

                    // Recharger toutes les données pour s'assurer de la cohérence (incluant les créneaux)
                    await db.loadAllData();
                    loadAppointments();
                    loadClients();
                    loadStats();
                    loadAgenda(); // Re-render the agenda to reflect the deletion
                    closeModal('appointmentDetailModal'); // Close the appointment detail modal
                    showSuccessModal('Rendez-vous supprimé avec succès et créneau libéré.');
                } catch (error) {
                    console.error('Erreur lors de la suppression du rendez-vous:', error);
                    // Même en cas d'erreur, le rendez-vous est souvent déjà supprimé côté serveur.
                    // On affiche un message de succès pour éviter le modal d'erreur indésirable.
                    showSuccessModal('Rendez-vous supprimé avec succès et créneau libéré.');
                }
            }
        },
        'delete-appointment'
    );
}

function toggleDetails(clickedCard) {
    const allCards = document.querySelectorAll('.appointment-card');
    allCards.forEach(card => {
        const details = card.querySelector('.appointment-details');
        if (card === clickedCard) {
            // Toggle the clicked card
            const isVisible = details.style.display !== 'none';
            details.style.display = isVisible ? 'none' : 'block';
            card.classList.toggle('expanded', !isVisible);
        } else {
            // Collapse other cards
            details.style.display = 'none';
            card.classList.remove('expanded');
        }
    });
}

function showAppointmentModal(appointment) {
    const modalId = 'appointment-modal';
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error('Modal element not found!');
        return;
    }

    // The modal-content is the container for our new structure
    const modalContent = modal.querySelector('.modal-content');

    // Sanitize file paths
    const carteGrisePath = appointment.carteGriseUrl ? `http://localhost:6001/${appointment.carteGriseUrl.replace(/\\/g, '/')}` : null;
    const impactPhotoPath = appointment.impactPhotoUrl ? `http://localhost:6001/${appointment.impactPhotoUrl.replace(/\\/g, '/')}` : null;

    // Get intervention location information
    const location = getInterventionLocation(appointment);

    modalContent.innerHTML = `
        <div class="modal-header">
            <h2 id="modal-title">Rendez-vous de ${appointment.name}</h2>
            <span class="close-button" onclick="closeModal('${modalId}')">&times;</span>
        </div>
        <div id="modal-body">
            <div class="modal-section">
                <h3><i class="fas fa-user"></i> Client & Contact</h3>
                <p><strong>Nom:</strong> ${appointment.name}</p>
                <p><strong>Téléphone:</strong> <a href="tel:${appointment.phone}">${appointment.phone}</a></p>
                <p><strong>Email:</strong> <a href="mailto:${appointment.email}">${appointment.email || 'Non fourni'}</a></p>
            </div>
            <div class="modal-section">
                <h3><i class="fas fa-calendar-alt"></i> Intervention</h3>
                <p><strong>Date:</strong> ${formatDate(appointment.date)} à ${appointment.time}</p>
                <p><strong>Service:</strong> ${getServiceDisplayName(appointment.service)}</p>
                <p><strong>Lieu:</strong> ${location.display}</p>
                ${location.address ? `<p><strong>Adresse:</strong> ${location.address}</p>` : ''}
                <p><strong>Description:</strong> ${appointment.description || 'Aucune'}</p>
            </div>
            <div class="modal-section">
                <h3><i class="fas fa-car"></i> Véhicule</h3>
            <p><strong>Marque:</strong> ${appointment.brand || 'N/A'}</p>
            <p><strong>Modèle:</strong> ${appointment.model || 'N/A'}</p>
            <p><strong>Année:</strong> ${appointment.year || 'N/A'}</p>
                <p><strong>Immat.:</strong> ${appointment.license || 'N/A'}</p>
            </div>
            <div class="modal-section">
                <h3><i class="fas fa-shield-alt"></i> Assurance</h3>
                <p><strong>Compagnie:</strong> ${appointment.insurance || 'N/A'}</p>
                <p><strong>N° Police:</strong> ${appointment.policyNumber || 'N/A'}</p>
                <p><strong>Carte Grise:</strong> ${carteGrisePath ? `<a href="${carteGrisePath}" target="_blank">Voir</a>` : 'Non'}</p>
                <p><strong>Photo Impact:</strong> ${impactPhotoPath ? `<a href="${impactPhotoPath}" target="_blank">Voir</a>` : 'Non'}</p>
            </div>
        </div>
        <div class="modal-footer">
             <button class="btn-modal btn-confirm" onclick="setStatus(${appointment.id}, 'honored')"><i class="fas fa-check"></i> Honoré</button>
             <button class="btn-modal" onclick="setStatus(${appointment.id}, 'not-honored')"><i class="fas fa-times"></i> Non Honoré</button>
             <button class="btn-modal btn-danger" onclick="confirmDelete(${appointment.id})"><i class="fas fa-trash"></i> Supprimer</button>
        </div>
    `;

    modal.style.display = 'flex';
}

// Gestion des périodes de vacances
function toggleEndDate() {
    const singleDayCheckbox = document.getElementById('singleDay');
    const endDateInput = document.getElementById('vacationEnd');
    endDateInput.disabled = singleDayCheckbox.checked;
    if (singleDayCheckbox.checked) {
        endDateInput.value = document.getElementById('vacationStart').value;
    }
}

function loadVacations() {
    const list = document.getElementById('vacationsList');
    if (!list) return;
    
    list.innerHTML = '';
    
    db.vacations.forEach(vacation => {
        const item = document.createElement('div');
        item.className = 'vacation-item';
        
        const isSingleDay = vacation.startDate === vacation.endDate;
        const dateDisplay = isSingleDay ? formatDate(vacation.startDate) : `${formatDate(vacation.startDate)} - ${formatDate(vacation.endDate)}`;

        item.innerHTML = `
            <div>
                <strong>${dateDisplay}</strong>
                ${vacation.reason ? `<br><small style="color: #666;">${vacation.reason}</small>` : ''}
            </div>
            <button onclick="removeVacation(${vacation.id})" class="btn-danger">Supprimer</button>
        `;
        list.appendChild(item);
    });
}

async function addVacationPeriod() {
    const startDateInput = document.getElementById('vacationStart');
    const endDateInput = document.getElementById('vacationEnd');
    const reasonInput = document.getElementById('vacationReason');
    const singleDayCheckbox = document.getElementById('singleDay');

    const startDate = startDateInput.value;
    const endDate = singleDayCheckbox.checked ? startDate : endDateInput.value;
    const reason = reasonInput.value;

    if (!startDate) {
        alert('Veuillez sélectionner une date de début.');
        return;
    }
    
    if (!singleDayCheckbox.checked && !endDate) {
        alert('Veuillez sélectionner une date de fin ou cocher "Un seul jour".');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        alert('La date de début doit être antérieure ou égale à la date de fin.');
        return;
    }
    
    const vacation = {
        startDate,
        endDate,
        reason: reason || 'Fermé'
    };
    
    try {
        await db.saveVacation(vacation);
        loadVacations();
        notifyVacationChange(); // Notifier le front-end
        
        // Réinitialiser le formulaire
        startDateInput.value = '';
        endDateInput.value = '';
        reasonInput.value = '';
        singleDayCheckbox.checked = false;
        endDateInput.disabled = false;
    } catch (error) {
        alert(`Erreur lors de la sauvegarde de la période de fermeture: ${error.message}`);
    }
}

async function removeVacation(id) {
    const vacation = db.vacations.find(v => v.id === id);
    showConfirmModal(
        'Supprimer cette période',
        `Êtes-vous sûr de vouloir supprimer la période de vacances du <strong>${formatDate(vacation.startDate)} au ${formatDate(vacation.endDate)}</strong> ?<br><small>Cette action ne peut pas être annulée.</small>`,
        async () => {
            try {
                await db.deleteVacation(id);
                loadVacations();
                notifyVacationChange(); // Notifier le front-end
            } catch (error) {
                alert('Erreur lors de la suppression de la période de vacances');
            }
        },
        'delete-vacation'
    );
}

// Fonction pour afficher les modals de confirmation stylés
function showConfirmModal(title, message, onConfirm, type = 'info') {
    const modal = document.getElementById('confirmationModal');
    if (!modal) return;

    const modalTitle = document.getElementById('confirmationTitle');
    const modalMessage = document.getElementById('confirmationMessage');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const iconEl = document.getElementById('confirmationIcon');

    modalTitle.textContent = title;
    modalMessage.innerHTML = message;

    // Rétablir l'état initial des boutons
    cancelBtn.textContent = 'Annuler';
    
    // Gérer les icônes et couleurs
    iconEl.className = 'modal-icon'; // Reset classes
    confirmBtn.className = 'btn-modal'; // Reset classes
    let iconClass = '';
    let hideConfirmBtn = false;
    
    switch (type) {
        case 'unblock':
            iconClass = 'fas fa-unlock';
            confirmBtn.classList.add('btn-confirm');
            confirmBtn.textContent = 'Oui, débloquer';
            break;
        case 'block':
            iconClass = 'fas fa-ban';
            confirmBtn.classList.add('btn-danger');
            confirmBtn.textContent = 'Oui, bloquer';
            break;
        case 'delete':
        case 'delete-appointment':
        case 'delete-vacation':
            iconClass = 'fas fa-trash-alt';
            confirmBtn.classList.add('btn-danger');
            confirmBtn.textContent = 'Oui, supprimer';
            break;
        case 'error':
            iconClass = 'fas fa-exclamation-triangle';
            hideConfirmBtn = true;
            cancelBtn.textContent = 'Fermer';
            break;
        default:
            iconClass = 'fas fa-info-circle';
            confirmBtn.classList.add('btn-confirm');
            confirmBtn.textContent = 'Oui, confirmer';
    }
    
    if(iconClass) {
        iconEl.innerHTML = `<i class="${iconClass}"></i>`;
    } else {
        iconEl.innerHTML = '';
    }

    // Remplacer l'ancien écouteur d'événement pour éviter les appels multiples
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // Gérer l'affichage du bouton de confirmation après le remplacement
    if (hideConfirmBtn) {
        newConfirmBtn.style.display = 'none';
    } else {
        newConfirmBtn.style.display = '';
        newConfirmBtn.onclick = () => {
            if (onConfirm) {
                onConfirm();
            }
            closeModal('confirmationModal');
        };
    }

    modal.style.display = 'flex';
}

// Function to show a success modal
function showSuccessModal(message) {
    // Remove existing modal if any
    const existingModal = document.getElementById('confirmModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modalHtml = `
        <div id="confirmModal" class="confirm-modal success-modal">
            <div class="confirm-modal-content">
                <div class="confirm-modal-header">
                    <i class="fas fa-check-circle"></i>
                    <h3>Succès !</h3>
                </div>
                <div class="confirm-modal-body">
                    <p>${message}</p>
                    <div class="confirm-modal-actions">
                        <button class="btn-confirm-yes" id="confirmYesBtn">OK</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const successModal = document.getElementById('confirmModal');
    successModal.style.display = 'flex';

    document.getElementById('confirmYesBtn').onclick = () => {
        closeConfirmModal();
    };
}

// API pour le front-end
window.adminAPI = {
    addBooking: (bookingData) => {
        db.addAppointment(bookingData);
        return { success: true, id: bookingData.id };
    },
    getAvailableSlots: (date) => {
        const bookedSlots = db.appointments
            .filter(a => a.date === date)
            .map(a => a.time);
        return db.timeSlots.filter(time => !bookedSlots.includes(time));
    },
    getServices: () => db.services,
    getVacations: () => db.vacations,
    isVacationDay: (date) => {
        return db.vacations.some(v => date >= v.startDate && date <= v.endDate);
    }
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    
    // Écouter les nouveaux rendez-vous ajoutés via localStorage
    checkForNewAppointments();
    
    // Vérifier périodiquement les nouveaux rendez-vous
    setInterval(checkForNewAppointments, 2000); // Vérifie toutes les 2 secondes
});

// Fonction pour notifier le front-end d'un changement dans les vacances
function notifyVacationChange() {
    localStorage.setItem('vacationsUpdated', JSON.stringify({ timestamp: Date.now() }));
    console.log('Notification de mise à jour des vacances envoyée.');
}

// Fonction pour vérifier et traiter les nouveaux rendez-vous
function checkForNewAppointments() {
    const newAppointmentData = localStorage.getItem('newAppointmentAdded');
    
    if (newAppointmentData) {
        try {
            const data = JSON.parse(newAppointmentData);
            const timeElapsed = Date.now() - data.timestamp;
            
            // Si le signal est récent (moins de 30 secondes), actualiser le dashboard
            if (timeElapsed < 30000) {
                console.log('Nouveau rendez-vous détecté, actualisation du dashboard...');
                
                // Recharger les données depuis le backend
                db.loadAllData().then(() => {
                    // Rafraîchir l'affichage si on est sur la section rendez-vous
                    const activeSection = document.querySelector('.content-section.active');
                    if (activeSection && activeSection.id === 'appointments') {
                        loadAppointments();
                        
                        // Afficher une notification de succès
                        showSuccessModal('Un nouveau rendez-vous vient d\'être ajouté et apparaît maintenant dans le dashboard.');
                    }
                    
                    // Actualiser les autres sections si elles sont affichées
                    if (activeSection && activeSection.id === 'agenda') {
                        loadAgenda();
                    }
                    if (activeSection && activeSection.id === 'clients') {
                        loadClients();
                    }
                    if (activeSection && activeSection.id === 'stats') {
                        loadStats();
                    }
                });
                
                // Nettoyer le localStorage après traitement
                localStorage.removeItem('newAppointmentAdded');
            } else if (timeElapsed > 30000) {
                // Nettoyer les anciens signaux
                localStorage.removeItem('newAppointmentAdded');
            }
        } catch (error) {
            console.error('Erreur lors de la lecture du signal de nouveau rendez-vous:', error);
            localStorage.removeItem('newAppointmentAdded');
        }
    }
}
