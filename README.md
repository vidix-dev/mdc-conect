# MDC-Conect · Portail Collaboratif 4 To (Maison Du Charlo)

MDC-Conect est un espace cloud unifié au design épuré inspiré d'Apple (macOS / iPadOS), conçu pour centraliser votre stockage de 4 To et vos outils de travail (fichiers, agenda et notes) dans un environnement confiné sans l'interface de Google.

Le site est hébergeable gratuitement et sans serveur sur GitHub Pages.

---

## Fonctionnalités

### 1. Fichiers et Dossiers (4 To)
- Organisation en dossiers personnalisés avec fil d'Ariane.
- Importation par glisser-déposer de plusieurs fichiers ou par sélection locale.
- Exportation individuelle ou téléchargement d'un dossier complet compressé au format ZIP.
- Visualiseur multimédia intégré : photos, vidéos (.mp4, .mov, .webm), fichiers audio (.mp3, .wav), tableurs Excel et documents PDF / texte.

### 2. Agenda Partagé
- Calendrier mensuel interactif avec navigation des dates.
- Programmation, modification et suppression des rendez-vous d'équipe.
- Importation de fichiers d'agenda au format standard .ics.
- Exportation universelle .ics pour synchronisation directe avec les applications Calendrier d'Apple (iPhone, Mac) ou Android.

### 3. Notes et Tâches
- Liste de tâches avec cases à cocher, assignation et échéances.
- Rédaction et classement de comptes-rendus d'équipe.
- Importation de notes au format texte ou Markdown (.txt, .md).
- Exportation d'une note spécifique ou sauvegarde de toutes les notes sous forme d'archive ZIP.

### 4. Gestion des Comptes et Accès
- **Création autonome de compte** : N'importe quel membre peut créer son compte directement depuis l'écran d'accueil sans dépendre de l'administrateur, et accéder immédiatement à la plateforme.
- **Règle de génération de l'identifiant** : `première lettre du prénom + nom de famille + jour de naissance` (ex : Jean Dupont né le 12 -> `jdupont12`).
- **Révocation d'accès réservée à l'administrateur** : Seul l'administrateur a le pouvoir de révoquer ou supprimer les comptes des membres dans l'onglet « Comptes ». Les membres ordinaires ont uniquement accès à l'annuaire sans pouvoir supprimer les autres.

---

## Passerelle Google Apps Script 4 To

Le portail est préconfiguré pour communiquer avec la passerelle Google Apps Script :
`https://script.google.com/macros/s/AKfycbx6AyPMD99J68qmikpr-ay22dWMkzY-mkCaufAAhCiLtnS_0fGRRoMsrrEHLyXjbEKDLw/exec`

### Recommandation pour l'accès sans restriction technique :
Dans l'éditeur de script sur [script.google.com](https://script.google.com) :
1. Cliquez sur **Déployer > Gérer les déploiements**.
2. Modifiez le déploiement actif de type Application Web.
3. Vérifiez les deux paramètres suivants :
   - **Exécuter en tant que** : *Moi* (le propriétaire des 4 To).
   - **Qui a accès** : *Tout le monde* (Anyone).
4. Enregistrez la nouvelle version. Ainsi, tous les membres autorisés avec leur identifiant pourront consulter et déposer des fichiers sur le dossier 4 To sans blocage.

---

## Déploiement sur GitHub Pages

1. Dans le terminal local :
```bash
cd /Users/victordoussot/mdc-conect
git add .
git commit -m "Mise a jour authentification et passerelle 4 To"
git push -u origin main
```

2. Sur votre dépôt GitHub :
- Allez dans **Settings > Pages**.
- Sous **Build and deployment**, sélectionnez la branche `main` et le dossier `/ (root)`.
- Cliquez sur **Save**. Votre portail sera accessible à l'adresse fournie par GitHub.
