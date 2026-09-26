const SITE_VERSION = '1.9.2';

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

    function fermerMenu() {
        menu.classList.remove('is-open');
        toggle.classList.remove('is-active');
        toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', () => {
        const ouvert = menu.classList.toggle('is-open');
        toggle.classList.toggle('is-active', ouvert);
        toggle.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    });

    menu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', fermerMenu);
    });

    // Échap referme le menu mobile (accessibilité clavier)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) {
            fermerMenu();
            toggle.focus();
        }
    });
}

function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal');

    if (!elements.length) return;

    // Sans IntersectionObserver (très anciens navigateurs), on affiche tout
    // immédiatement plutôt que de laisser le contenu invisible.
    if (!('IntersectionObserver' in window)) {
        elements.forEach((el) => el.classList.add('is-visible'));
        return;
    }

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

    // MODE_REGLAGE = true → l'intro rejoue à chaque chargement (mise au point).
    // Doit rester à false en production : l'intro ne joue qu'une fois par session.
    const MODE_REGLAGE = false;
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

    // Échap passe aussi l'intro
    document.addEventListener('keydown', function passerAuClavier(e) {
        if (e.key === 'Escape' && document.getElementById('intro')) {
            document.removeEventListener('keydown', passerAuClavier);
            terminerIntro();
        }
    });

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
    const bouton = form.querySelector('button[type="submit"]');
    const champHorodatage = form.querySelector('input[name="horodatage"]');

    // Anti-spam : on note l'instant d'affichage du formulaire. Un robot qui
    // soumet en moins de 3 secondes sera rejeté côté serveur.
    if (champHorodatage) {
        champHorodatage.value = String(Math.floor(Date.now() / 1000));
    }

    function afficherStatut(message, type) {
        if (!status) return;
        status.textContent = message;
        status.classList.remove('success', 'error');
        status.classList.add(type);
    }

    form.addEventListener('submit', async (event) => {
        // Si le navigateur n'a pas fetch, on laisse l'envoi natif vers contact.php
        if (typeof window.fetch !== 'function') return;

        event.preventDefault();

        if (!form.reportValidity()) return;

        const libelleInitial = bouton ? bouton.textContent : '';
        if (bouton) {
            bouton.disabled = true;
            bouton.textContent = 'Envoi en cours...';
        }
        afficherStatut('', 'success');

        try {
            const reponse = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { 'Accept': 'application/json' }
            });

            const donnees = await reponse.json();

            if (reponse.ok && donnees.ok) {
                afficherStatut(donnees.message || 'Message envoyé, merci ! Nous vous répondons rapidement.', 'success');
                form.reset();
                if (champHorodatage) {
                    champHorodatage.value = String(Math.floor(Date.now() / 1000));
                }
            } else {
                afficherStatut(donnees.message || "L'envoi a échoué. Merci de nous appeler au 07 52 03 68 15.", 'error');
            }
        } catch (erreur) {
            afficherStatut("L'envoi a échoué. Vérifiez votre connexion ou appelez-nous au 07 52 03 68 15.", 'error');
        } finally {
            if (bouton) {
                bouton.disabled = false;
                bouton.textContent = libelleInitial;
            }
        }
    });
}
