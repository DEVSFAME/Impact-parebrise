document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger) {
        hamburger.addEventListener('click', function () {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // ========================================
    // INTERSECTION OBSERVER POUR LES ANIMATIONS DE SECTIONS
    // ========================================
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);

    // Observer les sections avec animations
    const animatedSections = document.querySelectorAll(
        '.windshield-section, .services-section, .case-study-carousel-section, .process-section'
    );
    
    animatedSections.forEach(section => {
        sectionObserver.observe(section);
    });

    // ========================================
    // ANIMATION DES CADEAUX DE LA SECTION FRANCHISE OFFERTE
    // ========================================
    const giftContainer = document.getElementById('gift-container');
    
    if (giftContainer) {
        const giftObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    giftObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        giftObserver.observe(giftContainer);

        // Gestion des clics sur les cadeaux
        const giftItems = document.querySelectorAll('.gift-item');
        const giftRevealModal = document.getElementById('gift-reveal-modal');
        const giftRevealClose = document.getElementById('gift-reveal-close');
        const giftRevealImg = document.getElementById('gift-reveal-img');
        const giftRevealTitle = document.getElementById('gift-reveal-title-text');
        const giftRevealSubtitle = document.getElementById('gift-reveal-subtitle-text');
        const btnAnotherGift = document.getElementById('btn-another-gift');
        
        let confettiInterval;

        // Liste des cadeaux disponibles
        const gifts = [
            {
                image: 'Cadeaux-liste/billet-200euros.png',
                title: '200 € en cash',
                subtitle: 'Repartez avec 200€ directement dans votre poche !'
            },
            {
                image: 'Cadeaux-liste/Air fryer.png',
                title: 'Air Fryer',
                subtitle: 'Cuisinez sainement et rapidement'
            },
            {
                image: 'Cadeaux-liste/Nintendo switch.png',
                title: 'Nintendo Switch',
                subtitle: 'Console de jeu portable dernière génération'
            },
            {
                image: 'Cadeaux-liste/Tablette-samsung.png',
                title: 'Samsung galaxy Tab A9',
                subtitle: 'Quoi de mieux que repartir avec une magnifique tablette Samsung'
            },
            {
                image: 'Cadeaux-liste/Robot Cuisine.png',
                title: 'Robot de Cuisine',
                subtitle: 'Assistant culinaire multifonction'
            },
            {
                image: 'Cadeaux-liste/Trotinette electrique.png',
                title: 'Trottinette Électrique',
                subtitle: 'Mobilité urbaine écologique et rapide'
            }
        ];

        const confettiColors = ['#76ff03', '#64dd17', '#1a237e', '#3949ab', '#FFD700', '#FF69B4'];

        // Fonction pour l'explosion de confettis
        function launchConfettiExplosion() {
            confetti({
                particleCount: 250,
                spread: 100,
                origin: { y: 0.6 },
                colors: confettiColors,
                zIndex: 3002
            });
        }

        // Fonction pour démarrer la pluie de confettis
        function startConfettiRain() {
            stopConfettiRain(); // S'assurer qu'il n'y a pas d'intervalle précédent
            confettiInterval = setInterval(() => {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: confettiColors
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: confettiColors
                });
            }, 200);
        }

        // Fonction pour arrêter la pluie de confettis
        function stopConfettiRain() {
            clearInterval(confettiInterval);
        }

        // Fonction pour afficher un cadeau spécifique
        function showGift(index) {
            const selectedGift = gifts[index];
            if (selectedGift) {
                giftRevealImg.src = selectedGift.image;
                giftRevealTitle.textContent = selectedGift.title;
                giftRevealSubtitle.textContent = selectedGift.subtitle;
                
                giftRevealModal.classList.add('visible');
                
                setTimeout(launchConfettiExplosion, 100);
                startConfettiRain();
            }
        }

        // Ajouter les écouteurs d'événements
        giftItems.forEach(item => {
            item.addEventListener('click', function() {
                this.classList.add('clicked');
                setTimeout(() => this.classList.remove('clicked'), 600);
                const giftIndex = parseInt(this.dataset.index, 10);
                showGift(giftIndex);
            });
        });

        function closeModal() {
            giftRevealModal.classList.remove('visible');
            stopConfettiRain();
        }

        if (giftRevealClose) {
            giftRevealClose.addEventListener('click', closeModal);
        }

        if (btnAnotherGift) {
            btnAnotherGift.addEventListener('click', () => {
                closeModal();
                // Ajout d'un petit délai pour une transition plus douce
                setTimeout(showRandomGift, 200);
            });
        }

        if (giftRevealModal) {
            giftRevealModal.addEventListener('click', (e) => {
                if (e.target === giftRevealModal) {
                    closeModal();
                }
            });
        }
    }

    // ========================================
    // CARROUSEL PEUGEOT 3008
    // ========================================
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(document.querySelectorAll('.carousel-slide'));
    const nextButton = document.querySelector('.carousel-btn-right');
    const prevButton = document.querySelector('.carousel-btn-left');
    const indicators = Array.from(document.querySelectorAll('.carousel-indicator'));

    if (track && slides.length > 0) {
        let currentIndex = 0;

        // Fonction pour mettre à jour le carrousel
        const updateCarousel = (targetIndex) => {
            // Mettre à jour la position du track
            track.style.transform = `translateX(-${targetIndex * 100}%)`;

            // Mettre à jour les classes des slides
            slides.forEach((slide, index) => {
                slide.classList.remove('current-slide');
                if (index === targetIndex) {
                    slide.classList.add('current-slide');
                }
            });

            // Mettre à jour les indicateurs
            indicators.forEach((indicator, index) => {
                indicator.classList.remove('current-slide');
                if (index === targetIndex) {
                    indicator.classList.add('current-slide');
                }
            });

            currentIndex = targetIndex;
        };

        // Bouton suivant
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                const nextIndex = currentIndex === slides.length - 1 ? 0 : currentIndex + 1;
                updateCarousel(nextIndex);
            });
        }

        // Bouton précédent
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                const prevIndex = currentIndex === 0 ? slides.length - 1 : currentIndex - 1;
                updateCarousel(prevIndex);
            });
        }

        // Indicateurs cliquables
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                updateCarousel(index);
            });
        });
    }

    // ========================================
    // ANIMATION TIMELINE
    // ========================================
    const timelineItems = document.querySelectorAll('.timeline-item');

    const checkTimelineItems = () => {
        timelineItems.forEach(item => {
            const rect = item.getBoundingClientRect();
            // Check if item is in the viewport
            if (rect.top < window.innerHeight && rect.bottom >= 0) {
                item.classList.add('is-visible');
            }
        });
    };

    if (timelineItems.length > 0) {
        window.addEventListener('scroll', checkTimelineItems);
        window.addEventListener('resize', checkTimelineItems);
        checkTimelineItems(); // Initial check
    }

    // ========================================
    // NAVIGATION ACTIVE
    // ========================================
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    if (sections.length > 0 && navLinks.length > 0) {
        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (pageYOffset >= sectionTop - 60) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (current && link.getAttribute('href').includes(current)) {
                    link.classList.add('active');
                }
            });
        });
    }

    // ========================================
    // LOGIQUE COMPLÈTE DU FORMULAIRE DE RENDEZ-VOUS
    // ========================================
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        let currentStep = 1;
        const totalSteps = 5;
        const formSteps = document.querySelectorAll('.form-step');
        const progressSteps = document.querySelectorAll('.progress-step');
        const progressFill = document.querySelector('.progress-fill');

        // Configuration du backend
        const API_BASE_URL = 'http://localhost:6001/api';

        // Fonction pour afficher les erreurs
        function showError(message) {
            // Supprimer les messages d'erreur existants
            const existingError = document.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }

            // Créer et afficher le nouveau message d'erreur
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.cssText = `
                background: #ff4444;
                color: white;
                padding: 1rem;
                border-radius: 10px;
                margin: 1rem 0;
                text-align: center;
                animation: slideIn 0.3s ease;
            `;
            errorDiv.textContent = message;

            const currentStepElement = document.querySelector(`[data-step="${currentStep}"]`);
            currentStepElement.insertBefore(errorDiv, currentStepElement.firstChild);

            // Supprimer le message d'erreur après 5 secondes
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 5000);
        }

        // Validation de l'étape courante
        function validateCurrentStep() {
            const currentStepElement = document.querySelector(`[data-step="${currentStep}"]`);
            const requiredFields = currentStepElement.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (field.type === 'radio') {
                    const radioGroup = currentStepElement.querySelectorAll(`[name="${field.name}"]`);
                    const isChecked = Array.from(radioGroup).some(radio => radio.checked);
                    if (!isChecked) {
                        isValid = false;
                        showError(`Veuillez sélectionner une option pour ${field.name}`);
                    }
                } else if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = '#ff4444';
                    showError(`Veuillez remplir le champ ${field.previousElementSibling ? field.previousElementSibling.textContent : field.name}`);
                } else {
                    field.style.borderColor = '#e0e0e0';
                }
            });

            // Validation spéciale pour l'adresse d'intervention
            if (currentStep === 3) {
                const lieuIntervention = document.querySelector('input[name="lieu_intervention"]:checked');
                if (lieuIntervention && (lieuIntervention.value === 'domicile' || lieuIntervention.value === 'lieu_travail')) {
                    const addressField = document.getElementById('address');
                    if (!addressField.value.trim()) {
                        isValid = false;
                        addressField.style.borderColor = '#ff4444';
                        showError('Veuillez remplir l\'adresse d\'intervention');
                    }
                }
            }

            return isValid;
        }

        // Mise à jour de la barre de progression
        const updateProgress = () => {
            progressSteps.forEach((step, index) => {
                if (index < currentStep) {
                    step.classList.add('active');
                } else {
                    step.classList.remove('active');
                }
            });
            const progressPercentage = ((currentStep - 1) / (formSteps.length - 1)) * 100;
            progressFill.style.width = `${progressPercentage}%`;
        };

        // Affichage d'une étape
        const showStep = (stepNumber) => {
            formSteps.forEach(step => {
                step.classList.remove('active');
            });
            document.querySelector(`.form-step[data-step="${stepNumber}"]`).classList.add('active');
            currentStep = stepNumber;
            updateProgress();
        };

        // Fonctions de navigation globales
        window.nextStep = () => {
            if (validateCurrentStep()) {
                if (currentStep < totalSteps) {
                    showStep(currentStep + 1);
                    
                    // Mise à jour du résumé à l'étape 5
                    if (currentStep === 5) {
                        updateSummary();
                    }
                }
            }
        };

        window.prevStep = () => {
            if (currentStep > 1) {
                showStep(currentStep - 1);
            }
        };

        // Mise à jour du résumé
        function updateSummary() {
            // Service
            const selectedService = document.querySelector('input[name="service"]:checked');
            if (selectedService) {
                const serviceCard = selectedService.nextElementSibling;
                const serviceName = serviceCard.querySelector('h4').textContent;
                const summaryServiceElement = document.getElementById('summary-service');
                if (summaryServiceElement) {
                    summaryServiceElement.textContent = serviceName;
                }
            }

            // Date et heure
            const date = document.getElementById('appointment-date').value;
            const selectedTime = document.querySelector('input[name="time"]:checked');
            if (date && selectedTime) {
                const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                const summaryDatetimeElement = document.getElementById('summary-datetime');
                if (summaryDatetimeElement) {
                    summaryDatetimeElement.textContent = `${formattedDate} à ${selectedTime.value}`;
                }
            }

            // Contact
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const phone = document.getElementById('phone').value;
            const email = document.getElementById('email').value;
            const lieuInterventionRadio = document.querySelector('input[name="lieu_intervention"]:checked');
            const address = document.getElementById('address').value;
            
            const summaryContactElement = document.getElementById('summary-contact');
            if (summaryContactElement) {
                let contactInfo = `${firstName} ${lastName}<br>${phone}<br>${email}`;
                if (lieuInterventionRadio) {
                    const lieu = lieuInterventionRadio.value === 'domicile' ? 'Domicile' : 'Lieu de travail';
                    contactInfo += `<br><strong>Lieu :</strong> ${lieu}`;
                    if (address) {
                        contactInfo += `<br><strong>Adresse :</strong> ${address}`;
                    }
                }
                summaryContactElement.innerHTML = contactInfo;
            }

            // Véhicule
            const brand = document.getElementById('brand').value;
            const model = document.getElementById('model').value;
            const year = document.getElementById('year').value;
            const license = document.getElementById('license').value;
            const summaryVehicleElement = document.getElementById('summary-vehicle');
            if (summaryVehicleElement) {
                summaryVehicleElement.innerHTML = `
                    ${brand} ${model} (${year})<br>
                    <strong>Immatriculation :</strong> ${license}
                `;
            }

            // Assurance
            const insurance = document.getElementById('insurance').value;
            const otherInsurance = document.getElementById('otherInsurance').value;
            const policyNumber = document.getElementById('policyNumber').value;
            const summaryInsuranceElement = document.getElementById('summary-insurance');
            if (summaryInsuranceElement) {
                let insuranceName = insurance === 'autre' ? otherInsurance : insurance;
                let insuranceInfo = insuranceName;
                if (policyNumber) {
                    insuranceInfo += `<br><strong>Police :</strong> ${policyNumber}`;
                }
                summaryInsuranceElement.innerHTML = insuranceInfo;
            }
        }

        // Fonction pour afficher le modal de succès
        function showSuccessModal() {
            const formContainer = document.querySelector('.booking-form-container');
            if (formContainer) {
                formContainer.innerHTML = `
                    <div class="success-modal" style="padding: 4rem; text-align: center; animation: fadeIn 0.6s ease;">
                        <div style="color: #76ff03; font-size: 4rem; margin-bottom: 2rem; animation: bounceIn 0.8s ease;">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <h2 style="color: #1a237e; margin-bottom: 1rem; font-size: 2rem;">Rendez-vous confirmé !</h2>
                        <p style="color: #666; margin-bottom: 2rem; font-size: 1.1rem;">
                            Votre demande de rendez-vous a été envoyée avec succès. 
                            Nous vous contacterons dans les plus brefs délais pour confirmer votre créneau.
                        </p>
                        <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 2rem; border-radius: 15px; margin-bottom: 2rem; border: 1px solid #76ff03;">
                            <h3 style="color: #1a237e; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                <i class="fas fa-clipboard-list" style="color: #76ff03;"></i>
                                Que se passe-t-il maintenant ?
                            </h3>
                            <ul style="text-align: left; color: #666; list-style: none; padding: 0; max-width: 400px; margin: 0 auto;">
                                <li style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; animation: slideInLeft 0.6s ease 0.2s both;">
                                    <i class="fas fa-check-circle" style="color: #76ff03; font-size: 1.2rem;"></i>
                                    <span>Nous vérifions votre créneau</span>
                                </li>
                                <li style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; animation: slideInLeft 0.6s ease 0.4s both;">
                                    <i class="fas fa-phone" style="color: #76ff03; font-size: 1.2rem;"></i>
                                    <span>Nous vous appelons pour confirmer</span>
                                </li>
                                <li style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; animation: slideInLeft 0.6s ease 0.6s both;">
                                    <i class="fas fa-tools" style="color: #76ff03; font-size: 1.2rem;"></i>
                                    <span>Nous préparons votre intervention</span>
                                </li>
                                <li style="display: flex; align-items: center; gap: 0.5rem; animation: slideInLeft 0.6s ease 0.8s both;">
                                    <i class="fas fa-calendar-check" style="color: #76ff03; font-size: 1.2rem;"></i>
                                    <span>Nous intervenons à l'heure convenue</span>
                                </li>
                            </ul>
                        </div>
                        <div style="margin-bottom: 2rem;">
                            <p style="color: #1a237e; font-weight: 600; margin-bottom: 0.5rem;">
                                <i class="fas fa-exclamation-triangle" style="color: #ffc107; margin-right: 0.5rem;"></i>
                                Important
                            </p>
                            <p style="color: #666; font-size: 0.9rem;">
                                Tout rendez-vous non honoré ou non annulé au moins 24 heures à l'avance entraînera l'inscription sur notre liste noire.
                            </p>
                        </div>
                        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                            <a href="index.html" class="btn-primary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; padding: 1rem 2rem; background: linear-gradient(135deg, #76ff03, #64dd17); color: #1a237e; border-radius: 30px; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(118, 255, 3, 0.3);">
                                <i class="fas fa-home"></i>
                                Retour à l'accueil
                            </a>
                            <a href="services.html" class="btn-secondary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; padding: 1rem 2rem; background: transparent; color: #1a237e; border: 2px solid #1a237e; border-radius: 30px; font-weight: 600; transition: all 0.3s ease;">
                                <i class="fas fa-tools"></i>
                                Nos services
                            </a>
                        </div>
                    </div>
                `;
            }
        }

        // ========================================
        // CALENDRIER AVEC CRÉNEAUX DYNAMIQUES
        // ========================================
        const calendarDays = document.getElementById('calendarDays');
        const currentMonthYear = document.getElementById('currentMonthYear');
        const prevMonthBtn = document.getElementById('prevMonth');
        const nextMonthBtn = document.getElementById('nextMonth');
        const appointmentDateInput = document.getElementById('appointment-date');
        const timeSlotsContainer = document.querySelector('.time-slots');

        let currentDate = new Date();
        let currentMonth = currentDate.getMonth();
        let currentYear = currentDate.getFullYear();
        let availableSlots = {};
        let bookedSlots = {};

        // Récupérer les créneaux disponibles pour une date
        async function fetchAvailableSlots(date) {
            try {
                const response = await fetch(`${API_BASE_URL}/available-slots/${date}`);
                if (response.ok) {
                    const data = await response.json();
                    return data;
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des créneaux:', error);
            }
            return { allSlots: [], bookedSlots: [] };
        }

        // Mettre à jour les créneaux horaires (2 heures)
        async function updateTimeSlots(selectedDate) {
            if (!selectedDate) return;

            const slotsData = await fetchAvailableSlots(selectedDate);
            const availableSlots = slotsData.availableSlots || [];

            if (timeSlotsContainer) {
                timeSlotsContainer.innerHTML = '';
                
                if (availableSlots.length === 0) {
                    timeSlotsContainer.innerHTML = `
                        <p style="text-align: center; color: #666; padding: 1rem;">
                            Aucun créneau de 2 heures disponible pour cette date
                        </p>
                    `;
                } else {
                    availableSlots.forEach(slot => {
                        const timeSlot = document.createElement('label');
                        timeSlot.className = 'time-slot time-slot-2h';
                        
                        // Calcul de l'heure de fin
                        const startTime = new Date(`1970-01-01T${slot.start}:00`);
                        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
                        const endHours = String(endTime.getHours()).padStart(2, '0');
                        const endMinutes = String(endTime.getMinutes()).padStart(2, '0');
                        const endTimeString = `${endHours}:${endMinutes}`;

                        timeSlot.innerHTML = `
                            <input type="radio" name="time" value="${slot.start}" required>
                            <span class="slot-time">${slot.start} - ${endTimeString}</span>
                        `;
                        
                        timeSlotsContainer.appendChild(timeSlot);
                    });
                }
            }
        }

        // Rendu du calendrier
        const renderCalendar = () => {
            const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

            if (calendarDays) {
                calendarDays.innerHTML = '';
            }
            if (currentMonthYear) {
                currentMonthYear.textContent = `${new Date(currentYear, currentMonth).toLocaleString('fr-FR', { month: 'long' })} ${currentYear}`;
            }

            // Ajuster pour que lundi soit le premier jour
            let dayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

            // Jours vides du mois précédent
            for (let i = 0; i < dayOffset; i++) {
                if (calendarDays) {
                    calendarDays.innerHTML += `<div class="calendar-day empty"></div>`;
                }
            }

            // Jours du mois courant
            for (let day = 1; day <= daysInMonth; day++) {
                const dayDate = new Date(currentYear, currentMonth, day);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let dayClass = 'calendar-day';
                if (dayDate < today) {
                    dayClass += ' past';
                } else {
                    dayClass += ' available';
                }

                if (calendarDays) {
                    calendarDays.innerHTML += `<div class="${dayClass}" data-date="${dayDate.toISOString().split('T')[0]}">${day}</div>`;
                }
            }

            // Ajouter les event listeners aux jours
            if (calendarDays) {
                document.querySelectorAll('.calendar-day:not(.empty):not(.past)').forEach(dayElement => {
                    dayElement.addEventListener('click', async () => {
                        // Supprimer la sélection précédente
                        document.querySelectorAll('.calendar-day.selected').forEach(selectedDay => {
                            selectedDay.classList.remove('selected');
                        });
                        // Ajouter la sélection au jour cliqué
                        dayElement.classList.add('selected');
                        // Mettre à jour l'input caché
                        if (appointmentDateInput) {
                            appointmentDateInput.value = dayElement.dataset.date;
                        }
                        // Mettre à jour les créneaux horaires
                        await updateTimeSlots(dayElement.dataset.date);
                    });
                });
            }
        };

        // Event listeners pour la navigation du calendrier
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                renderCalendar();
            });
        }

        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                renderCalendar();
            });
        }

        // Gérer l'affichage du champ "Autre assurance"
        const insuranceSelect = document.getElementById('insurance');
        const otherInsuranceGroup = document.getElementById('other-insurance-group');
        if (insuranceSelect && otherInsuranceGroup) {
            insuranceSelect.addEventListener('change', () => {
                if (insuranceSelect.value === 'autre') {
                    otherInsuranceGroup.style.display = 'block';
                    document.getElementById('otherInsurance').setAttribute('required', 'required');
                } else {
                    otherInsuranceGroup.style.display = 'none';
                    document.getElementById('otherInsurance').removeAttribute('required');
                }
            });
        }

        // Gérer l'affichage du champ "Adresse d'intervention"
        const lieuInterventionRadios = document.querySelectorAll('input[name="lieu_intervention"]');
        const adresseInterventionGroup = document.getElementById('adresse-intervention-group');
        if (lieuInterventionRadios.length > 0 && adresseInterventionGroup) {
            lieuInterventionRadios.forEach(radio => {
                radio.addEventListener('change', () => {
                    if (radio.checked && (radio.value === 'domicile' || radio.value === 'lieu_travail')) {
                        adresseInterventionGroup.style.display = 'block';
                        document.getElementById('address').setAttribute('required', 'required');
                    } else if (radio.checked && radio.value === 'agence') {
                        adresseInterventionGroup.style.display = 'none';
                        document.getElementById('address').removeAttribute('required');
                        document.getElementById('address').value = '';
                    }
                });
            });
        }

        // Vérifier le statut du client avant la soumission
        async function checkClientStatus(email, phone) {
            try {
                const response = await fetch(`${API_BASE_URL}/client-status?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`);
                if (response.ok) {
                    const data = await response.json();
                    return data.status;
                }
            } catch (error) {
                console.error('Erreur lors de la vérification du statut client:', error);
            }
            return 'not_found';
        }

        // Soumission du formulaire
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!validateCurrentStep()) {
                return;
            }

            // Vérifier le statut du client
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const clientStatus = await checkClientStatus(email, phone);
            
            if (clientStatus === 'blocked') {
                // Afficher le modal client bloqué
                const blockedModal = document.getElementById('blocked-modal');
                if (blockedModal) {
                    blockedModal.style.display = 'flex';
                }
                return;
            }

            // Préparer les données du formulaire
            const formData = new FormData();
            
            // Données de base
            formData.append('firstName', document.getElementById('firstName').value);
            formData.append('lastName', document.getElementById('lastName').value);
            formData.append('phone', phone);
            formData.append('email', email);
            formData.append('date', document.getElementById('appointment-date').value);
            formData.append('time', document.querySelector('input[name="time"]:checked').value);
            formData.append('service', document.querySelector('input[name="service"]:checked').value);
            formData.append('lieu_intervention', document.querySelector('input[name="lieu_intervention"]:checked').value);
            
            // Adresse (si nécessaire)
            const address = document.getElementById('address').value;
            if (address) {
                formData.append('address', address);
            }

            // Informations véhicule
            formData.append('brand', document.getElementById('brand').value);
            formData.append('model', document.getElementById('model').value);
            formData.append('year', document.getElementById('year').value);
            formData.append('license', document.getElementById('license').value);

            // Assurance
            const insurance = document.getElementById('insurance').value;
            if (insurance === 'autre') {
                formData.append('insurance', document.getElementById('otherInsurance').value);
            } else {
                formData.append('insurance', insurance);
            }
            
            const policyNumber = document.getElementById('policyNumber').value;
            if (policyNumber) {
                formData.append('policyNumber', policyNumber);
            }

            // Description
            const description = document.getElementById('description').value;
            if (description) {
                formData.append('description', description);
            }

            // Fichiers
            const carteGriseFile = document.getElementById('carteGrise').files[0];
            if (carteGriseFile) {
                formData.append('carteGrise', carteGriseFile);
            }

            const impactPhotoFile = document.getElementById('impactPhoto').files[0];
            if (impactPhotoFile) {
                formData.append('impactPhoto', impactPhotoFile);
            }

            try {
                // Afficher un indicateur de chargement
                const submitButton = document.querySelector('.btn-submit');
                const originalButtonContent = submitButton.innerHTML;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
                submitButton.disabled = true;

                const response = await fetch(`${API_BASE_URL}/rendezvous`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('Rendez-vous créé avec succès:', result);
                    
                    // Afficher le modal de succès
                    showSuccessModal();
                } else {
                    const error = await response.json();
                    throw new Error(error.message || 'Erreur lors de la création du rendez-vous');
                }
            } catch (error) {
                console.error('Erreur:', error);
                
                // Restaurer le bouton
                const submitButton = document.querySelector('.btn-submit');
                submitButton.innerHTML = originalButtonContent;
                submitButton.disabled = false;
                
                showError(`Erreur lors de l'envoi de votre demande: ${error.message}`);
            }
        });

        // Initialiser le calendrier
        renderCalendar();

        // Initialiser à la première étape
        showStep(1);
    }

    // ========================================
    // LOGIQUE SPÉCIFIQUE À LA PAGE SERVICES
    // ========================================
    const servicesPage = document.querySelector('.services-detail');
    if (servicesPage) {
        const serviceCards = document.querySelectorAll('.service-detail-card');
        const stickyNavItems = document.querySelectorAll('.services-nav-list .nav-item');

        // 1. Animation des cartes de service au défilement
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                } else {
                    // Pour l'animation réversible en remontant
                    entry.target.classList.remove('is-visible');
                }
            });
        }, { threshold: 0.2 }); // L'animation se déclenche quand 20% de la carte est visible

        serviceCards.forEach(card => cardObserver.observe(card));

        // 2. Synchronisation du menu sticky avec le scroll
        const menuSyncObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    stickyNavItems.forEach(item => {
                        item.classList.remove('active');
                        if (item.getAttribute('data-service') === id) {
                            item.classList.add('active');
                        }
                    });
                }
            });
        }, { 
            rootMargin: '-40% 0px -60% 0px' // Active le lien quand la section est dans la partie centrale de l'écran
        });

        serviceCards.forEach(card => menuSyncObserver.observe(card));
    }

    // ========================================
    // ANIMATION SUCCESSIVE POUR LES ÉTAPES LUNETTE ARRIÈRE
    // ========================================
    const etapesSection = document.getElementById('lunette-etapes');

    if (etapesSection) {
        const stepCards = etapesSection.querySelectorAll('.step-card');

        const etapesObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    stepCards.forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.add('is-visible');
                        }, index * 200); // 200ms delay between each card
                    });
                    etapesObserver.unobserve(entry.target); // Stop observing once animated
                }
            });
        }, { threshold: 0.6 });

        etapesObserver.observe(etapesSection);
    }


    // ========================================
    // GESTION DU REDIMENSIONNEMENT DE LA FENÊTRE
    // ========================================
    window.addEventListener('resize', () => {
        // Ajustements si nécessaire
    });

    // Fonction globale pour fermer les modals
    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    };
});

// Styles CSS pour les animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes bounceIn {
        0% {
            transform: scale(0.3);
            opacity: 0;
        }
        50% {
            transform: scale(1.05);
        }
        70% {
            transform: scale(0.9);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }

    @keyframes slideInLeft {
        from {
            opacity: 0;
            transform: translateX(-30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    .hamburger.active span:nth-child(1) {
        transform: rotate(-45deg) translate(-5px, 6px);
    }
    
    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger.active span:nth-child(3) {
        transform: rotate(45deg) translate(-5px, -6px);
    }
    
    .calendar-day.selected {
        background: #76ff03 !important;
        color: #1a237e !important;
        font-weight: bold;
    }
    
    .calendar-day.past {
        opacity: 0.3;
        cursor: not-allowed !important;
    }
    
    .calendar-day.available:hover {
        background: rgba(118, 255, 3, 0.2);
        cursor: pointer;
    }
    
    .error-message {
        animation: slideIn 0.3s ease;
    }
    
    .success-modal {
        animation: fadeIn 0.6s ease;
    }

    #blocked-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    #blocked-modal .modal-content {
        background: white;
        padding: 2rem;
        border-radius: 15px;
        max-width: 500px;
        margin: 1rem;
        text-align: center;
        position: relative;
    }

    #blocked-modal .close-button {
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
    }

    #blocked-modal .modal-icon {
        font-size: 4rem;
        color: #ff4444;
        margin-bottom: 1rem;
    }

    #blocked-modal .btn-modal-close {
        background: #1a237e;
        color: white;
        border: none;
        padding: 0.8rem 2rem;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 600;
        margin-top: 1rem;
    }

    #blocked-modal .contact-info {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 10px;
        margin: 1rem 0;
        font-weight: 600;
        color: #1a237e;
    }
`;
document.head.appendChild(style);
