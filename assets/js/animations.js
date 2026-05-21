/**
 * SEU DOCE ATELIÊ - MICRO-INTERACTIONS & SCROLL ANIMATIONS
 * Implements premium transitions, intersection observers and active scroll effects.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Header background and active section indicator on scroll
    const header = document.getElementById('main-header');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    window.addEventListener('scroll', () => {
        // Change header style on scroll
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Active nav link highlight
        let currentSectionId = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });

    // 2. Mobile Nav Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('open');
            const icon = menuToggle.querySelector('i');
            if (mainNav.classList.contains('open')) {
                icon.className = 'fa-solid fa-xmark';
            } else {
                icon.className = 'fa-solid fa-bars-staggered';
            }
        });
        
        // Close menu when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('open');
                const icon = menuToggle.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-bars-staggered';
            });
        });
    }

    // 3. Reveal Elements on Scroll (Intersection Observer)
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target); // Trigger only once
            }
        });
    }, revealOptions);

    // Add scroll animation target classes
    const animatedElements = [
        ...document.querySelectorAll('.product-card'),
        ...document.querySelectorAll('.about-content'),
        ...document.querySelectorAll('.about-visual'),
        ...document.querySelectorAll('.contact-card'),
        ...document.querySelectorAll('.section-header')
    ];

    // CSS inject for scroll reveal setup dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        .product-card, .about-content, .about-visual, .contact-card, .section-header {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .revealed {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
        .about-visual {
            transform: scale(0.95);
        }
        .about-visual.revealed {
            transform: scale(1) !important;
        }
    `;
    document.head.appendChild(style);

    animatedElements.forEach(el => revealObserver.observe(el));

    // 4. Parallax Hover Effect on the Hero Visual
    const heroVisual = document.getElementById('canvas-3d-wrapper');
    if (heroVisual) {
        heroVisual.addEventListener('mousemove', (e) => {
            const rect = heroVisual.getBoundingClientRect();
            const x = e.clientX - rect.left - (rect.width / 2);
            const y = e.clientY - rect.top - (rect.height / 2);
            
            // Calculate tilt angle (max 15 deg)
            const tiltX = -(y / (rect.height / 2)) * 10;
            const tiltY = (x / (rect.width / 2)) * 10;
            
            heroVisual.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
        });
        
        heroVisual.addEventListener('mouseleave', () => {
            heroVisual.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
            heroVisual.style.transition = 'transform 0.5s ease';
        });
        
        heroVisual.addEventListener('mouseenter', () => {
            heroVisual.style.transition = 'none';
        });
    }

    // 5. Click Ripples / Button Feedback
    const buttons = document.querySelectorAll('.btn, .btn-order-item');
    buttons.forEach(button => {
        button.addEventListener('mousedown', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size/2}px`;
            ripple.style.top = `${e.clientY - rect.top - size/2}px`;
            
            ripple.classList.add('btn-ripple');
            
            // Inject ripple style if not exists
            if (!document.getElementById('ripple-style')) {
                const rStyle = document.createElement('style');
                rStyle.id = 'ripple-style';
                rStyle.innerHTML = `
                    .btn-ripple {
                        position: absolute;
                        background: rgba(255, 255, 255, 0.4);
                        border-radius: 50%;
                        transform: scale(0);
                        animation: ripple-animation 0.6s linear;
                        pointer-events: none;
                        z-index: 10;
                    }
                    @keyframes ripple-animation {
                        to {
                            transform: scale(4);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(rStyle);
            }
            
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
});
