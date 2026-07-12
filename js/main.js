document.addEventListener('DOMContentLoaded', () => {
    initNavToggle();
    initScrollReveal();
    initContactForm();
});

function initNavToggle() {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
        menu.classList.toggle('is-open');
        toggle.classList.toggle('is-active');
    });

    menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            menu.classList.remove('is-open');
            toggle.classList.remove('is-active');
        });
    });
}

function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal');

    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    elements.forEach((el) => observer.observe(el));
}

function initContactForm() {
    const form = document.querySelector('.contact-form');

    if (!form) return;

    const status = form.querySelector('.form-status');

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        if (status) {
            status.textContent = 'Message envoyé, merci ! Nous vous répondons rapidement.';
            status.classList.remove('error');
            status.classList.add('success');
        }

        form.reset();
    });
}
