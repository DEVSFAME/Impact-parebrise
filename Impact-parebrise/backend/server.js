const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');

const app = express();
require('dotenv').config();
const PORT = 6001;

app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the 'admin' directory
app.use(express.static(path.join(__dirname, 'admin')));

// Serve static files from the main project directory for assets like the logo
app.use(express.static(path.join(__dirname, '../../IMPACT PARE BRISE')));

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

const dataFile = (name) => path.join(dataDir, `${name}.json`);

const readData = (name) => {
    const filePath = dataFile(name);
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    try {
        // If data is empty, return empty array to avoid JSON parsing error
        if (data.trim() === '') {
            return [];
        }
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error parsing JSON from ${name}.json:`, error);
        return []; // Return empty array on error to prevent crash
    }
};

const writeData = (name, data) => {
    fs.writeFileSync(dataFile(name), JSON.stringify(data, null, 2), 'utf8');
};

// ========================================
// UTILITY FUNCTIONS FOR 2-HOUR SLOTS
// ========================================

// Calculate end time given a start time and duration in minutes
const calculateEndTime = (startTime, durationMinutes = 120) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

// Get the next slot given a time slot
const getNextSlot = (currentSlot, allSlots) => {
    const currentIndex = allSlots.indexOf(currentSlot);
    if (currentIndex === -1 || currentIndex === allSlots.length - 1) {
        return null;
    }
    return allSlots[currentIndex + 1];
};

// Check if a time slot is exactly 1 hour after another
const isConsecutiveSlot = (slot1, slot2) => {
    const [h1, m1] = slot1.split(':').map(Number);
    const [h2, m2] = slot2.split(':').map(Number);
    const time1 = h1 * 60 + m1;
    const time2 = h2 * 60 + m2;
    return (time2 - time1) === 60;
};

// Find available 2-hour slots for a given date
const findAvailable2HourSlots = (date, appointments) => {
    const allSlots = readData('creneaux');
    const bookedSlots = appointments
        .filter(apt => apt.date === date)
        .map(apt => apt.time);
    
    const available2HourSlots = [];
    
    // Check each pair of consecutive slots
    for (let i = 0; i < allSlots.length - 1; i++) {
        const slot1 = allSlots[i];
        const slot2 = allSlots[i + 1];
        
        // Verify that slots are exactly 1 hour apart
        if (!isConsecutiveSlot(slot1, slot2)) {
            continue;
        }
        
        // Check if both slots are available
        const isSlot1Free = !bookedSlots.includes(slot1);
        const isSlot2Free = !bookedSlots.includes(slot2);
        
        if (isSlot1Free && isSlot2Free) {
            const endTime = calculateEndTime(slot1, 120);
            available2HourSlots.push({
                start: slot1,
                end: endTime,
                display: `${slot1} - ${endTime}`
            });
        }
    }
    
    return available2HourSlots;
};

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: parseInt(process.env.EMAIL_PORT, 10) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Function to send confirmation email
const sendConfirmationEmail = (appointment) => {
    // Skip email sending if no email provided
    if (!appointment.email || appointment.email.trim() === '') {
        console.log('No email provided for appointment:', appointment.name);
        return;
    }

    const mailOptions = {
        from: `"Impact Pare-Brise" <${process.env.EMAIL_USER}>`,
        to: appointment.email,
        subject: 'Confirmation de votre rendez-vous - Impact Pare-Brise',
        html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700&display=swap" rel="stylesheet">
            <title>Confirmation de rendez-vous</title>
            <style>
                body, table, td, a {
                    font-family: 'Montserrat', Arial, sans-serif;
                }
            </style>
        </head>
        <body style="font-family: 'Montserrat', Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 20px;">
            <div style="max-width: 500px; margin: auto; background-color: #1a237e; border-radius: 1rem; border: 1px solid #76ff03; text-align: center; padding: 2rem; color: #FFFFFF; box-shadow: 0 0 20px rgba(118, 255, 3, 0.3);">
                
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <h3 style="font-size: 1.8rem; color: #FFFFFF; font-weight: 700; margin:0; font-family: 'Montserrat', Arial, sans-serif;">Rendez-vous confirmé !</h3>
                </div>

                <p style="color: #f8f9fa; line-height: 1.6; margin-bottom: 1rem; font-family: 'Montserrat', Arial, sans-serif; font-weight: 300;">
                    Bonjour ${appointment.name}, nous avons le plaisir de confirmer la réservation de votre rendez-vous dont voici les détails :
                </p>

                <div style="background-color: rgba(118, 255, 3, 0.1); border-left: 4px solid #76ff03; text-align: left; padding: 1rem; border-radius: 0.75rem; margin-bottom: 1.5rem;">
                    <h4 style="display: flex; align-items: center; gap: 0.5rem; color: #FFFFFF; font-weight: 700; margin-top: 0; margin-bottom: 0.75rem; font-family: 'Montserrat', Arial, sans-serif;">
                        Détails du rendez-vous :
                    </h4>
                    <ul style="list-style: none; padding: 0; color: #f8f9fa; margin: 0; font-family: 'Montserrat', Arial, sans-serif; font-weight: 300;">
                        <li style="margin-bottom: 10px;"><strong>Date :</strong> ${appointment.date}</li>
                        <li style="margin-bottom: 10px;"><strong>Heure :</strong> ${appointment.time}</li>
                        <li style="margin-bottom: 10px;"><strong>Service :</strong> ${appointment.service}</li>
                        <li><strong>Véhicule :</strong> ${appointment.brand} ${appointment.model} (${appointment.year})</li>
                    </ul>
                </div>

                <div style="background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; text-align: left; padding: 1rem; border-radius: 0.75rem; margin-bottom: 1.5rem;">
                    <h4 style="display: flex; align-items: center; gap: 0.5rem; color: #FFFFFF; font-weight: 700; margin-top: 0; margin-bottom: 0.75rem; font-family: 'Montserrat', Arial, sans-serif;">
                        Avertissement :
                    </h4>
                    <p style="color: #f8f9fa; margin: 0; font-family: 'Montserrat', Arial, sans-serif; font-weight: 300;">
                        Tout rendez-vous non honoré ou non annulé au moins <strong>24 heures à l'avance</strong> entraînera l'inscription de votre profil sur notre liste noire. Cela vous rendra impossible la réservation de futurs rendez-vous avec nos services.
                    </p>
                </div>
                
                <p style="color: #f8f9fa; margin-top: 20px; font-family: 'Montserrat', Arial, sans-serif; font-weight: 300;">Merci de votre confiance,<br>L'équipe Impact Pare-Brise</p>
                
                <!-- Logo ajouté ici -->
                <div style="text-align: center; margin-top: 2rem;">
                    <img src="http://localhost:6001/logo-impact-parebrise.png" alt="Impact Pare-Brise Logo" style="max-width: 150px; height: auto; border: 0;">
                </div>
            </div>
        </body>
        </html>
        `
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('❌ Error sending email to:', appointment.email);
            console.log('Error details:', error);
            
            // Log specific error types
            if (error.code === 'EAUTH') {
                console.log('🔑 AUTHENTICATION ERROR: Please check your Gmail App Password');
            } else if (error.code === 'ECONNECTION') {
                console.log('🌐 CONNECTION ERROR: Check your internet connection');
            }
            return;
        }
        
        console.log(`Email confirmation successful: ${appointment.email}`);
    });
};

// Endpoints
app.get('/api/rendezvous', (req, res) => {
    res.json(readData('rendezvous'));
});

app.post('/api/rendezvous', upload.fields([{ name: 'carteGrise', maxCount: 1 }, { name: 'impactPhoto', maxCount: 1 }]), (req, res) => {
    console.log('Received body:', JSON.stringify(req.body, null, 2));
    console.log('Received files:', JSON.stringify(req.files, null, 2));
    const appointments = readData('rendezvous');
    const newAppointment = req.body;

    if (req.files) {
        if (req.files.carteGrise) {
            newAppointment.carteGriseUrl = `/uploads/${req.files.carteGrise[0].filename}`;
        }
        if (req.files.impactPhoto) {
            newAppointment.impactPhotoUrl = `/uploads/${req.files.impactPhoto[0].filename}`;
        }
    }

    // Validation complète de tous les champs obligatoires
    const requiredFields = {
        date: 'Date',
        time: 'Heure',
        firstName: 'Prénom',
        lastName: 'Nom',
        phone: 'Téléphone',
        email: 'Email',
        service: 'Service',
        lieu_intervention: 'Lieu d\'intervention',
        brand: 'Marque du véhicule',
        model: 'Modèle',
        year: 'Année',
        license: 'Immatriculation',
        insurance: 'Assurance'
    };

    // Vérifier les champs de base
    const missingFields = [];
    for (const [field, label] of Object.entries(requiredFields)) {
        if (!newAppointment[field] || (typeof newAppointment[field] === 'string' && newAppointment[field].trim() === '')) {
            missingFields.push(label);
        }
    }

    // Vérifier l'adresse si lieu_intervention est "domicile" ou "lieu_travail"
    if (newAppointment.lieu_intervention === 'domicile' || newAppointment.lieu_intervention === 'lieu_travail') {
        if (!newAppointment.address || newAppointment.address.trim() === '') {
            missingFields.push('Adresse d\'intervention');
        }
    }

    if (missingFields.length > 0) {
        console.log('Champs manquants:', missingFields);
        console.log('Données reçues:', newAppointment);
        return res.status(400).json({ 
            message: `Les informations suivantes sont manquantes : ${missingFields.join(', ')}.`,
            missingFields: missingFields
        });
    }

    // Construct the full name from firstName and lastName
    newAppointment.name = `${newAppointment.firstName} ${newAppointment.lastName}`;

    // ========================================
    // VALIDATION DES CRÉNEAUX DE 2 HEURES
    // ========================================
    const allSlots = readData('creneaux');
    const nextSlot = getNextSlot(newAppointment.time, allSlots);
    
    // Vérifier que le créneau de départ existe
    if (!allSlots.includes(newAppointment.time)) {
        return res.status(400).json({ message: "Le créneau sélectionné n'est pas valide." });
    }
    
    // Vérifier qu'il y a un créneau suivant
    if (!nextSlot) {
        return res.status(400).json({ message: "Ce créneau ne permet pas une intervention de 2 heures." });
    }
    
    // Vérifier que les créneaux sont consécutifs (1h d'écart)
    if (!isConsecutiveSlot(newAppointment.time, nextSlot)) {
        return res.status(400).json({ message: "Les créneaux ne sont pas consécutifs pour une intervention de 2 heures." });
    }
    
    // Vérifier la disponibilité du créneau de départ
    const isSlot1Available = !appointments.some(
        apt => apt.date === newAppointment.date && apt.time === newAppointment.time
    );
    
    // Vérifier la disponibilité du créneau suivant
    const isSlot2Available = !appointments.some(
        apt => apt.date === newAppointment.date && apt.time === nextSlot
    );
    
    if (!isSlot1Available || !isSlot2Available) {
        return res.status(409).json({ message: "Ce créneau n'est plus disponible pour une intervention de 2 heures." });
    }

    newAppointment.id = Date.now();
    
    // Ajouter la durée et l'heure de fin
    const duration = 120; // 2 heures en minutes
    const endTime = calculateEndTime(newAppointment.time, duration);

    // Convert intervention location to boolean for the admin dashboard
    const interventionInAgency = newAppointment.lieu_intervention === 'agence';

    // Ensure all relevant fields are saved
    const appointmentToSave = {
        id: newAppointment.id,
        name: newAppointment.name,
        phone: newAppointment.phone,
        email: newAppointment.email || '',
        date: newAppointment.date,
        time: newAppointment.time,
        duration: duration, // Durée de l'intervention en minutes
        endTime: endTime, // Heure de fin calculée
        service: newAppointment.service,
        brand: newAppointment.brand || '',
        model: newAppointment.model || '',
        year: newAppointment.year || '',
        license: newAppointment.license || '',
        insurance: newAppointment.insurance || '',
        policyNumber: newAppointment.policyNumber || '',
        description: newAppointment.description || '',
        status: newAppointment.status || 'pending',
        firstVisit: newAppointment.firstVisit || false,
        lieu_intervention: newAppointment.lieu_intervention,
        interventionInAgency: interventionInAgency, // Add the boolean field
        address: newAppointment.address,
        carteGriseUrl: newAppointment.carteGriseUrl,
        impactPhotoUrl: newAppointment.impactPhotoUrl
    };
    appointments.push(appointmentToSave);
    writeData('rendezvous', appointments);

    // Add or update client
    const clients = readData('clients');
    const clientIndex = clients.findIndex(c => c.email === newAppointment.email || c.phone === newAppointment.phone); // Match by email or phone

    if (clientIndex > -1) {
        // Update existing client
        clients[clientIndex].lastVisit = newAppointment.date;
        clients[clientIndex].phone = newAppointment.phone; // Ensure phone is updated if changed
        clients[clientIndex].email = newAppointment.email; // Ensure email is updated if changed
        clients[clientIndex].name = newAppointment.name; // Ensure name is updated if changed
        clients[clientIndex].reservations = (clients[clientIndex].reservations || 0) + 1;
        // Update vehicle/insurance info if provided in the new appointment
        clients[clientIndex].brand = newAppointment.brand || clients[clientIndex].brand || '';
        clients[clientIndex].model = newAppointment.model || clients[clientIndex].model || '';
        clients[clientIndex].year = newAppointment.year || clients[clientIndex].year || '';
        clients[clientIndex].license = newAppointment.license || clients[clientIndex].license || '';
        clients[clientIndex].insurance = newAppointment.insurance || clients[clientIndex].insurance || '';
        clients[clientIndex].policyNumber = newAppointment.policyNumber || clients[clientIndex].policyNumber || '';
    } else {
        // Add new client
        clients.push({
            id: `client-${Date.now()}`,
            name: newAppointment.name,
            email: newAppointment.email || '',
            phone: newAppointment.phone,
            lastVisit: newAppointment.date,
            reservations: 1,
            status: 'active',
            brand: newAppointment.brand,
            model: newAppointment.model,
            year: newAppointment.year,
            license: newAppointment.license,
            insurance: newAppointment.insurance,
            policyNumber: newAppointment.policyNumber
        });
    }
    writeData('clients', clients);

    // Send confirmation email
    sendConfirmationEmail(appointmentToSave);

    res.status(201).json(appointmentToSave);
});

// Endpoint for unjustified absence
app.delete('/api/appointments/:id/unjustified', (req, res) => {
    let appointments = readData('rendezvous');
    let clients = readData('clients');
    const { id } = req.params;

    const appointmentIndex = appointments.findIndex(apt => apt.id == id);
    if (appointmentIndex === -1) {
        return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
    }

    const appointmentToDelete = appointments[appointmentIndex];
    const { phone, email } = appointmentToDelete;

    // Remove the appointment
    appointments.splice(appointmentIndex, 1);
    writeData('rendezvous', appointments);

    // Find and update the client
    const clientIndex = clients.findIndex(c => c.phone === phone || c.email === email);
    if (clientIndex !== -1) {
        clients[clientIndex].status = 'blocked';
        clients[clientIndex].motif = 'rendez-vous non honoré injustifié';
        writeData('clients', clients);
    }

    res.status(200).json({ message: 'Rendez-vous supprimé et client bloqué.' });
});

// Endpoint for justified absence
app.delete('/api/appointments/:id/justified', (req, res) => {
    let appointments = readData('rendezvous');
    let clients = readData('clients');
    const { id } = req.params;

    const appointmentIndex = appointments.findIndex(apt => apt.id == id);
    if (appointmentIndex === -1) {
        return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
    }

    const appointmentToDelete = appointments[appointmentIndex];
    const { phone, email } = appointmentToDelete;

    // Remove the appointment
    appointments.splice(appointmentIndex, 1);
    writeData('rendezvous', appointments);

    // Find and update the client
    const clientIndex = clients.findIndex(c => c.phone === phone || c.email === email);
    if (clientIndex !== -1) {
        clients[clientIndex].status = 'RDV non honoré justifié';
        clients[clientIndex].motif = 'Rendez-vous non honoré justifié';
        writeData('clients', clients);
    }

    res.status(200).json({ message: 'Rendez-vous supprimé et statut du client mis à jour.' });
});

// Endpoint for updating appointment status to honored
app.put('/api/rendezvous/:id/status', express.json(), (req, res) => {
    let appointments = readData('rendezvous');
    let clients = readData('clients');
    const { id } = req.params;
    const { status, lastVisit } = req.body;

    const appointmentIndex = appointments.findIndex(apt => apt.id == id);
    if (appointmentIndex === -1) {
        return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
    }

    const appointment = appointments[appointmentIndex];
    
    // Update appointment status
    appointments[appointmentIndex].status = status;
    writeData('rendezvous', appointments);

    // If status is honored, update client's last visit
    if (status === 'honored' && lastVisit) {
        const { phone, email } = appointment;
        const clientIndex = clients.findIndex(c => c.phone === phone || c.email === email);
        
        if (clientIndex !== -1) {
            clients[clientIndex].lastVisit = lastVisit;
            writeData('clients', clients);
        }
    }

    res.status(200).json({ 
        message: 'Statut du rendez-vous mis à jour avec succès.',
        appointment: appointments[appointmentIndex]
    });
});


app.delete('/api/rendezvous/:id', (req, res) => {
    let appointments = readData('rendezvous');
    const { id } = req.params;
    const appointmentToDelete = appointments.find(apt => apt.id == id);

    if (!appointmentToDelete) {
        return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
    }

    appointments = appointments.filter(apt => apt.id != id);
    writeData('rendezvous', appointments);

    // Make the time slot available again
    let timeSlots = readData('creneaux');
    const { date, time } = appointmentToDelete;
    const isSlotBooked = appointments.some(apt => apt.date === date && apt.time === time);

    if (!isSlotBooked && !timeSlots.includes(time)) {
        timeSlots.push(time);
        timeSlots.sort((a, b) => {
            const [aHour, aMinute] = a.split(':').map(Number);
            const [bHour, bMinute] = b.split(':').map(Number);
            if (aHour !== bHour) {
                return aHour - bHour;
            }
            return aMinute - bMinute;
        });
        writeData('creneaux', timeSlots);
    }

    // Update client's reservations
    const clients = readData('clients');
    const clientIndex = clients.findIndex(c => c.email === appointmentToDelete.email);
    if (clientIndex > -1) {
        clients[clientIndex].reservations = Math.max(0, (clients[clientIndex].reservations || 0) - 1);
        // If no more reservations, remove client or update lastVisit
        const remainingAppointments = appointments.filter(a => a.email === clients[clientIndex].email);
        if (remainingAppointments.length === 0) {
            // Option 1: Remove client if no more appointments
            // clients = clients.filter(c => c.id !== clients[clientIndex].id);
            // Option 2: Clear lastVisit if no more appointments
            clients[clientIndex].lastVisit = null;
        } else {
            const lastVisit = remainingAppointments.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            clients[clientIndex].lastVisit = lastVisit.date;
        }
    }
    writeData('clients', clients);

    res.status(200).json({ message: 'Rendez-vous supprimé avec succès.' });
});

app.delete('/api/clients/:id', (req, res) => {
    let clients = readData('clients');
    let appointments = readData('rendezvous');
    const { id } = req.params;

    const clientToDelete = clients.find(c => c.id == id);
    if (!clientToDelete) {
        return res.status(404).json({ message: 'Client non trouvé.' });
    }

    // Remove client from the clients list
    clients = clients.filter(c => c.id != id);
    writeData('clients', clients);

    // Remove all appointments associated with this client
    appointments = appointments.filter(apt => apt.email !== clientToDelete.email && apt.phone !== clientToDelete.phone);
    writeData('rendezvous', appointments);

    res.status(200).json({ message: 'Client et ses rendez-vous supprimés avec succès.' });
});

app.get('/api/clients', (req, res) => {
    const clients = readData('clients');
    const activeClients = clients.filter(client => client.status !== 'blocked');
    res.json(activeClients);
});

app.get('/api/blocked-clients', (req, res) => {
    const clients = readData('clients');
    const blockedClients = clients.filter(client => client.status === 'blocked');
    res.json(blockedClients);
});

app.put('/api/clients/:id/status', express.json(), (req, res) => {
    const clients = readData('clients');
    const { id } = req.params;
    const { status } = req.body;
    const clientIndex = clients.findIndex(c => c.id == id);

    if (clientIndex !== -1) {
        clients[clientIndex].status = status;
        writeData('clients', clients);
        res.json(clients[clientIndex]);
    } else {
        res.status(404).json({ message: 'Client not found' });
    }
});

app.get('/api/creneaux', (req, res) => {
    res.json(readData('creneaux'));
});

app.get('/api/available-slots/:date', (req, res) => {
    const { date } = req.params;
    const appointments = readData('rendezvous');
    
    // Find available 2-hour slots
    const available2HourSlots = findAvailable2HourSlots(date, appointments);
    
    res.json({
        availableSlots: available2HourSlots
    });
});

app.put('/api/creneaux', express.json(), (req, res) => {
    const newTimeSlots = req.body;
    // Triez les créneaux pour s'assurer qu'ils sont dans l'ordre chronologique
    newTimeSlots.sort((a, b) => {
        const [aHour, aMinute] = a.split(':').map(Number);
        const [bHour, bMinute] = b.split(':').map(Number);
        if (aHour !== bHour) {
            return aHour - bHour;
        }
        return aMinute - bMinute;
    });
    writeData('creneaux', newTimeSlots);
    res.status(200).json({ message: 'Time slots updated' });
});

app.get('/api/vacances', (req, res) => {
    res.json(readData('vacances'));
});

app.post('/api/vacances', express.json(), (req, res) => {
    const vacations = readData('vacances');
    const newVacation = req.body;
    newVacation.id = Date.now();
    vacations.push(newVacation);
    writeData('vacances', vacations);
    res.status(201).json(newVacation);
});

app.delete('/api/vacances/:id', (req, res) => {
    let vacations = readData('vacances');
    const { id } = req.params;
    vacations = vacations.filter(v => v.id != id);
    writeData('vacances', vacations);
    res.status(200).json({ message: 'Vacation deleted' });
});

app.get('/api/services', (req, res) => {
    res.json(readData('services'));
});

app.put('/api/services', express.json(), (req, res) => {
    const newServices = req.body;
    writeData('services', newServices);
    res.status(200).json({ message: 'Services updated' });
});

app.get('/api/client-status', (req, res) => {
    const { email, phone } = req.query;
    const clients = readData('clients');
    const client = clients.find(c => c.email === email || c.phone === phone);
    if (client) {
        res.json({ status: client.status });
    } else {
        res.json({ status: 'not_found' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server for Impact Pare-Brise running on http://localhost:${PORT}`);
    console.log(`Email user configured: ${process.env.EMAIL_USER}`);
});
