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
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Animation on scroll for timeline items
    const timelineItems = document.querySelectorAll('.timeline-item');

    const checkTimelineItems = () => {
        timelineItems.forEach(item => {
            const rect = item.getBoundingClientRect();
            // Check if item is in the viewport
            if (rect.top < window.innerHeight && rect.bottom >= 0) {
                item.classList.add('is-visible');
            } else {
                item.classList.remove('is-visible');
            }
        });
    };

    window.addEventListener('scroll', checkTimelineItems);
    window.addEventListener('resize', checkTimelineItems);
    checkTimelineItems(); // Initial check

    // Add active class to nav link on scroll
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

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
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });
});
