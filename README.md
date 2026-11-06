# 👑 MDC-Conect · Cloud Unifié Maison Du Charlo

**MDC-Conect** est un portail cloud collaboratif moderne au design inspiré d'**Apple** (macOS / iPadOS), conçu pour centraliser la suite Google (Google Drive, Google Calendar, Google Tasks & Notes) dans un **environnement confiné, élégant et sans l'interface de Google**.

Hébergeable gratuitement et instantanément sur **GitHub Pages**.

---

## ✨ Fonctionnalités Principales

### 📁 1. Cloud Documents (Google Drive Confiné)
- **Consultation directe** des documents, tableurs, présentations et photos partagés.
- **Visualiseur in-app confiné** : prévisualisez les fichiers directement sur le site sans être redirigé vers l'interface Google Drive.
- **Glisser-déposer (Drag & Drop)** pour importer facilement des documents.
- Navigation par dossiers et catégories (Documents, Tableurs, Médias, Archives).
- Jauge de stockage cloud partagé.

### 📅 2. Agenda Partagé (Google Calendar Apple Style)
- Grille calendaire interactive inspirée d'Apple iCal (mois, semaine, agenda).
- Codes couleur par catégorie d'événement (Fêtes MDC en doré, Réunions en bleu, Sorties en vert, Important en rouge).
- Programmation facile de nouveaux rendez-vous.
- **Bouton d'export `.ics` universel** : importez tout le calendrier MDC dans l'application Calendrier de votre iPhone, Mac ou Android en 1 clic.

### 📝 3. Notes & Tâches (Google Tasks & Reminders)
- **Tâches partagées** avec cases à cocher animées, dates d'échéance et attribution aux membres.
- **Notes et comptes-rendus d'équipe** avec cartes, recherche en temps réel et mots-clés.
- Synchronisation bidirectionnelle avec l'API Google Tasks.

### 👥 4. Gestion des Comptes & Profils
- **Connexion Google officielle (Google Identity Services GIS)** : connectez-vous avec votre compte Google personnel ou d'organisation.
- **Sélecteur de profils d'équipe MDC** : Victor (Président/Admin), Alexandre (Trésorier), Sarah (Coordination), Invité MDC.
- Mode hors-ligne / local avec persistance automatique `localStorage` pour fonctionner même sans configuration API.

### 🎨 5. Design Apple & Hallmark Anti-Slop
- Esthétique soignée macOS / iOS (barre translucide avec flou `backdrop-filter`, coins arrondis squircles, micro-interactions tactiles).
- Mode Sombre / Mode Clair instantané.
- 100% responsive sur mobile (320px, 375px, 414px) et desktop.

---

## 🚀 Déploiement sur GitHub Pages (En 2 minutes)

Le projet est entièrement statique (HTML5, CSS3 pur, JavaScript ES6) : il ne nécessite aucun serveur ni compilation.

### Étape 1 : Pousser le projet sur votre GitHub
Dans votre terminal :
```bash
cd mdc-conect
git add .
git commit -m "Initial commit MDC-Conect"
git remote add origin https://github.com/<votre-nom-utilisateur>/mdc-conect.git
git push -u origin main
```

### Étape 2 : Activer GitHub Pages
1. Rendez-vous sur votre dépôt GitHub.
2. Cliquez sur l'onglet **Settings** (Paramètres).
3. Dans le menu de gauche, cliquez sur **Pages**.
4. Sous **Build and deployment** > **Source**, choisissez `Deploy from a branch`.
5. Sélectionnez la branche `main` et le dossier `/ (root)`, puis cliquez sur **Save**.
6. Votre site est instantanément en ligne à l'adresse : `https://<votre-nom-utilisateur>.github.io/mdc-conect/` !

---

## 🔑 Activer la Synchronisation Google Suite (Gratuit)

Si vous souhaitez relier le portail à votre compte ou Google Drive d'équipe en direct :

1. Ouvrez la [Console Google Cloud](https://console.cloud.google.com/).
2. Créez un projet gratuit (ex: `MDC-Conect`).
3. Dans **API et services > Bibliothèque**, activez :
   - *Google Drive API*
   - *Google Calendar API*
   - *Google Tasks API*
4. Dans **Identifiants > Créer des identifiants > ID client OAuth** :
   - Type d'application : **Application Web**
   - **Origines JavaScript autorisées** : ajoutez l'URL de votre GitHub Pages (ex: `https://<pseudo>.github.io`)
5. Copiez votre **Client ID** (ex: `123456789-xxx.apps.googleusercontent.com`).
6. Sur le site MDC-Conect, cliquez sur la petite roue crantée (Paramètres) en haut à droite, collez votre Client ID et enregistrez !

---

## 📂 Structure du Répertoire

```
mdc-conect/
├── index.html              # Interface principale et conteneurs des modules
├── css/
│   └── apple-theme.css     # Design system Apple & tokens OKLCH
├── js/
│   └── app.js              # Logique métier, Google API GIS et mode local
├── assets/
│   ├── logo.jpg            # Logo original Maison Du Charlo
│   ├── logo-transparent.png# Logo détouré sur fond transparent
│   └── logo-dark.png       # Logo adapté pour le mode sombre
└── README.md               # Guide de déploiement et documentation
```

---
*Maison Du Charlo © Tous droits réservés.*
