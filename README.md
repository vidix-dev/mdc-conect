# 👑 MDC-Conect · Cloud Unifié 4 To (Maison Du Charlo)

**MDC-Conect** est un portail cloud collaboratif moderne au design inspiré d'**Apple** (macOS / iPadOS), conçu pour centraliser votre stockage de **4 To** et la suite Google (Google Drive, Google Calendar, Google Tasks & Notes) dans un **environnement confiné, élégant et sans l'interface de Google**.

Hébergeable gratuitement et instantanément sur **GitHub Pages**.

---

## ✨ Fonctionnalités Complètes

### 📁 1. Gestion des Dossiers & Fichiers (4 To)
- **Arborescence de dossiers** : Créez des dossiers personnalisés (*Documents Officiels*, *Événements & Soirées*, *Photos & Médias*, *Trésorerie*, etc.), naviguez avec le fil d'Ariane et supprimez facilement.
- **📥 Importer** : Glissez-déposez un ou plusieurs fichiers directement dans le dossier ouvert, ou utilisez le bouton d'import.
- **📤 Exporter** :
  - Téléchargez n'importe quel fichier individuellement en 1 clic.
  - **Bouton « Exporter le dossier (.ZIP) »** : compresse et télécharge instantanément l'intégralité du dossier sous forme d'archive `.zip`.
- **👁️ Visionner (Visualiseur multimédia confiné sans quitter le site)** :
  - **Photos & Images** : Affichage haute résolution.
  - **Vidéos** : Lecteur vidéo intégré pour les formats `.mp4`, `.mov`, `.webm`.
  - **Audio** : Lecteur sonore pour musiques et vocaux `.mp3`, `.wav`.
  - **Tableurs Excel** : Affichage direct sous forme de tableau interactif soigné.
  - **PDF & Textes** : Lecteur de documents intégré.

### 📅 2. Agenda & Calendrier Collaboratif
- **👁️ Visionner & Programmer** : Grille mensuelle style Apple iCal avec codes couleur (Fêtes MDC en doré, Réunions en bleu, Sorties en vert, Important en rouge).
- **📥 Importer `.ics`** : Chargez n'importe quel fichier `.ics` (exporté de Google Calendar, Outlook ou Apple Calendar) pour fusionner les événements dans l'agenda MDC.
- **📤 Exporter `.ics`** : Téléchargez le calendrier complet en fichier `.ics` universel pour l'ajouter directement dans l'application Calendrier de votre iPhone, Mac ou Android.

### 📝 3. Notes & Tâches
- **Tâches partagées** : To-do list avec cases à cocher animées, date d'échéance et membre assigné.
- **Notes d'équipe** :
  - **👁️ Visionner & Rédiger** : Cartes de notes avec auteur, date et thème.
  - **📥 Importer notes** : Importez des fichiers `.txt` ou `.md` (Markdown).
  - **📤 Exporter notes** : Téléchargez chaque note au format Markdown (`.md`) ou exportez **toutes les notes en une archive `.ZIP`**.

### 👥 4. Comptes & Profils
- **Connexion Google officielle (Google Identity Services GIS)** : connectez-vous avec votre compte Google personnel ou d'organisation possédant les 4 To.
- **Sélecteur de profils d'équipe MDC** : Victor (Président/Admin), Alexandre (Trésorier), Sarah (Coordination), Invité MDC.
- Mode local avec persistance automatique `localStorage`.

---

## 🚀 Passerelle Google Apps Script pour vos 4 To (100% Gratuit)

Un fichier prêt à l'emploi est fourni dans [`google-apps-script/Code.gs`](file:///Users/victordoussot/mdc-conect/google-apps-script/Code.gs).

Il permet de relier le site GitHub Pages directement à votre dossier Drive de 4 To **sans que chaque membre n'ait besoin de se connecter** :
1. Rendez-vous sur [script.google.com](https://script.google.com) et créez un "Nouveau projet".
2. Copiez-collez le contenu de [`google-apps-script/Code.gs`](file:///Users/victordoussot/mdc-conect/google-apps-script/Code.gs).
3. Indiquez l'ID de votre dossier Drive 4 To dans la variable `ROOT_FOLDER_ID`.
4. Cliquez sur **Déployer > Nouveau déploiement > Application Web** (Exécuter en tant que : *Moi*, Accès : *Tout le monde*).
5. Copiez l'URL générée et collez-la dans les **Paramètres (roue crantée)** de MDC-Conect !

---

## 🌐 Déploiement sur GitHub Pages

Dans votre terminal :
```bash
cd /Users/victordoussot/mdc-conect
git add .
git commit -m "Mise à jour dossiers, import/export et visualiseur"
git push -u origin main
```
Sur GitHub : **Settings > Pages > Source : Deploy from a branch (`main` / root)** et votre cloud MDC-Conect est en ligne !
