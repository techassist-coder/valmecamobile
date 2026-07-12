const SITE_VERSION = '1.7';

document.addEventListener('DOMContentLoaded', () => {
    initNavToggle();
    initScrollReveal();
    initContactForm();
    initVersion();
    initIntro();
});

function initVersion() {
    document.querySelectorAll('.site-version').forEach((el) => {
        el.textContent = `v${SITE_VERSION}`;
    });
}

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

function initIntro() {
    const intro = document.getElementById('intro');
    if (!intro) return;

    const boutonPasser = intro.querySelector('.intro-passer');
    const logoCible = document.querySelector('.hero .hero-logo');

    const MODE_REGLAGE = true; // ⚠️ repasser à false avant la mise en ligne !
    const dejaVue = !MODE_REGLAGE && sessionStorage.getItem('introVue') === '1';
    const petitEcran = window.matchMedia('(max-width: 768px)').matches;
    const mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (dejaVue || petitEcran || mouvementReduit) {
        intro.remove();
        return;
    }

    function viserImageHero() {
        if (!logoCible) return;
        const rect = logoCible.getBoundingClientRect();
        intro.style.transformOrigin = `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px`;
    }

    function terminerIntro() {
        sessionStorage.setItem('introVue', '1');
        intro.remove();
    }

    boutonPasser.addEventListener('click', terminerIntro);

    intro.addEventListener('animationend', (e) => {
        switch (e.animationName) {
            case 'camion-entre':
                intro.classList.add('phase-texte');
                break;

            case 'texte-apparait':
                setTimeout(() => {
                    viserImageHero();
                    intro.classList.add('phase-sortie');
                }, 1200);
                break;

            case 'intro-sortie':
                terminerIntro();
                break;
        }
    });

    if (document.readyState === 'complete') {
        intro.classList.add('phase-camion');
    } else {
        window.addEventListener('load', () => {
            intro.classList.add('phase-camion');
        });
    }
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
