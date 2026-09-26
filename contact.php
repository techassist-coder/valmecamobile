<?php
/**
 * Traitement du formulaire de contact - Val'Meca Mobile
 * Hébergement mutualisé OVH (PHP 8.x)
 *
 * ------------------------------------------------------------------
 * À VÉRIFIER AVANT MISE EN LIGNE :
 * - DESTINATAIRE : l'adresse qui reçoit les demandes.
 * - EXPEDITEUR   : doit être une adresse RÉELLEMENT créée sur le
 *   domaine valmecamobile.fr, sinon OVH refuse l'envoi (anti-spoofing).
 * ------------------------------------------------------------------
 */

const DESTINATAIRE   = 'contact@valmecamobile.fr';
const EXPEDITEUR     = 'contact@valmecamobile.fr';
const EXPEDITEUR_NOM = 'Site Val\'Meca Mobile';
const DELAI_MINIMUM  = 3;    // secondes avant soumission (anti-robot)
const MAX_MESSAGE    = 5000; // caractères

/* ------------------------------------------------------------------
   Détection du mode de réponse : JSON pour l'envoi JavaScript,
   page HTML pour un navigateur sans JS.
   ------------------------------------------------------------------ */
$accept = $_SERVER['HTTP_ACCEPT'] ?? '';
$modeJson = strpos($accept, 'application/json') !== false;

/**
 * Termine le script en renvoyant le bon format.
 */
function repondre($ok, $message, $code = 200)
{
    global $modeJson;

    http_response_code($code);

    if ($modeJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $titre  = $ok ? 'Message envoyé' : 'Envoi impossible';
    $classe = $ok ? 'success' : 'error';
    $m = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

    header('Content-Type: text/html; charset=utf-8');
    echo <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>{$titre} - Val'Meca Mobile</title>
    <link rel="icon" href="assets/images/logos/favicon.png">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <main>
        <section class="section">
            <div class="container legal">
                <h1 class="section-title">{$titre}</h1>
                <p class="form-status {$classe}">{$m}</p>
                <p style="text-align:center;margin-top:32px">
                    <a href="index.html" class="btn btn-primary">Retour à l'accueil</a>
                </p>
            </div>
        </section>
    </main>
</body>
</html>
HTML;
    exit;
}

/**
 * Nettoie une valeur destinée à un en-tête d'e-mail.
 * Supprime les retours à la ligne : c'est le vecteur d'injection d'en-têtes.
 */
function nettoyerEntete($valeur)
{
    return trim(str_replace(["\r", "\n", "\0", '%0a', '%0d'], '', $valeur));
}

function champ($nom)
{
    $valeur = $_POST[$nom] ?? '';
    if (!is_string($valeur)) {
        return '';
    }
    return trim($valeur);
}

/* ------------------------------------------------------------------
   1. La requête doit être un POST
   ------------------------------------------------------------------ */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    repondre(false, 'Méthode non autorisée.', 405);
}

/* ------------------------------------------------------------------
   2. Filtres anti-spam (silencieux : on renvoie un faux succès pour
      ne pas renseigner les robots sur ce qui les a bloqués)
   ------------------------------------------------------------------ */

// Pot de miel : champ invisible que seuls les robots remplissent
if (champ('site_web') !== '') {
    repondre(true, 'Message envoyé, merci !');
}

// Formulaire soumis trop vite = robot
$horodatage = (int) champ('horodatage');
if ($horodatage > 0 && (time() - $horodatage) < DELAI_MINIMUM) {
    repondre(true, 'Message envoyé, merci !');
}

/* ------------------------------------------------------------------
   3. Validation des champs
   ------------------------------------------------------------------ */
$nom            = champ('name');
$email          = champ('email');
$telephone      = champ('phone');
$marque         = champ('brand');
$modele         = champ('model');
$immatriculation = champ('licensePlate');
$message        = champ('message');
$consentement   = champ('consent');

$erreurs = [];

if ($nom === '' || mb_strlen($nom) > 100) {
    $erreurs[] = 'le nom';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 150) {
    $erreurs[] = "l'adresse e-mail";
}
if ($immatriculation === '' || mb_strlen($immatriculation) > 20) {
    $erreurs[] = "l'immatriculation";
}
if ($message === '' || mb_strlen($message) > MAX_MESSAGE) {
    $erreurs[] = 'le message';
}
if ($consentement === '') {
    $erreurs[] = "l'acceptation de la politique de confidentialité";
}

if ($erreurs !== []) {
    repondre(false, 'Merci de vérifier : ' . implode(', ', $erreurs) . '.', 422);
}

/* ------------------------------------------------------------------
   4. Construction et envoi de l'e-mail
   ------------------------------------------------------------------ */
$nomPropre   = nettoyerEntete($nom);
$emailPropre = nettoyerEntete($email);

$sujet = sprintf('Demande de devis - %s (%s)', $nomPropre, nettoyerEntete($immatriculation));

$corps = "Nouvelle demande depuis valmecamobile.fr\n"
    . str_repeat('-', 45) . "\n\n"
    . "Nom             : {$nom}\n"
    . "Email           : {$email}\n"
    . 'Téléphone       : ' . ($telephone !== '' ? $telephone : 'non renseigné') . "\n"
    . 'Marque          : ' . ($marque !== '' ? $marque : 'non renseignée') . "\n"
    . 'Modèle          : ' . ($modele !== '' ? $modele : 'non renseigné') . "\n"
    . "Immatriculation : {$immatriculation}\n\n"
    . "Message :\n{$message}\n\n"
    . str_repeat('-', 45) . "\n"
    . 'Reçu le ' . date('d/m/Y à H:i') . "\n"
    . 'IP : ' . ($_SERVER['REMOTE_ADDR'] ?? 'inconnue') . "\n";

// En-têtes sous forme de chaîne : compatible avec toutes les versions de PHP
// (le passage d'un tableau à mail() n'existe que depuis PHP 7.2).
$entetes = implode("
", array(
    sprintf('From: %s <%s>', EXPEDITEUR_NOM, EXPEDITEUR),
    sprintf('Reply-To: %s <%s>', $nomPropre, $emailPropre),
    'Content-Type: text/plain; charset=UTF-8',
    'MIME-Version: 1.0',
));

$envoye = mail(
    DESTINATAIRE,
    '=?UTF-8?B?' . base64_encode($sujet) . '?=',
    $corps,
    $entetes,
    '-f' . EXPEDITEUR
);

if (!$envoye) {
    error_log('[valmecamobile] Échec mail() pour ' . $emailPropre);
    repondre(false, "L'envoi a échoué. Merci de nous appeler directement au 07 52 03 68 15.", 500);
}

repondre(true, 'Message envoyé, merci ! Nous vous répondons rapidement.');
