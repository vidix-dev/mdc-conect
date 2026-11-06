/**
 * MDC-Conect · Core Application Logic
 * Integrates Google Drive, Google Calendar, and Google Tasks with Apple Design UX
 * Features:
 * - Real Folders tree navigation (Create, Navigate, Delete)
 * - In-App Multimedia Viewer (Images, Video, Audio, PDF, Text, Spreadsheets)
 * - Export single file, or Export entire folder as ZIP (JSZip)
 * - Calendar Import (.ics) & Export (.ics)
 * - Notes Import (.md/.txt/.json) & Export (ZIP/JSON)
 * - Direct Google Apps Script Web App Relay for 4TB Drive & Google GIS OAuth2
 */

// Initial Seed Data for MDC (Maison Du Charlo)
const DEFAULT_MDC_DATA = {
  user: {
    name: "Victor Doussot",
    email: "victor@maisonducharlo.fr",
    role: "Président & Administrateur",
    avatar: "VD",
    isGoogle: false
  },
  currentFolderId: "root",
  folders: [
    { id: "fld_docs", name: "Documents Officiels", parentId: "root" },
    { id: "fld_events", name: "Événements & Soirées", parentId: "root" },
    { id: "fld_photos", name: "Photos & Médias", parentId: "root" },
    { id: "fld_compta", name: "Trésorerie & Factures", parentId: "root" }
  ],
  members: [
    { id: 1, name: "Victor Doussot", role: "Président & Fondateur", email: "victor@mdc.fr", status: "En ligne", avatar: "VD" },
    { id: 2, name: "Alexandre M.", role: "Trésorier", email: "alex@mdc.fr", status: "Actif", avatar: "AM" },
    { id: 3, name: "Sarah B.", role: "Coordination & Événements", email: "sarah@mdc.fr", status: "En ligne", avatar: "SB" },
    { id: 4, name: "Lucas P.", role: "Pôle Communication", email: "lucas@mdc.fr", status: "Absent", avatar: "LP" },
    { id: 5, name: "Camille D.", role: "Logistique & Matériel", email: "camille@mdc.fr", status: "Actif", avatar: "CD" }
  ],
  files: [
    {
      id: "f1",
      folderId: "fld_docs",
      name: "Charte_Fondatrice_MDC.pdf",
      type: "pdf",
      size: "1.4 Mo",
      date: "02 Nov 2026",
      category: "documents",
      author: "Victor D.",
      url: "assets/logo.jpg",
      content: "Charte officielle de la Maison Du Charlo (MDC).\n\n1. Convivialité et respect des membres.\n2. Organisation démocratique des événements et projets communs.\n3. Partage des ressources et entraide permanente.\n\nSigné par le bureau MDC."
    },
    {
      id: "f2",
      folderId: "fld_compta",
      name: "Planning_Activites_MDC_2026.xlsx",
      type: "spreadsheet",
      size: "420 Ko",
      date: "04 Nov 2026",
      category: "spreadsheets",
      author: "Sarah B.",
      content: "Mois\tÉvénement\tBudget\tStatut\nNovembre\tSoirée Intégration MDC\t350€\tValidé\nDécembre\tGrand Repas de Fin d'Année\t600€\tEn cours\nJanvier\tTournoi Gaming MDC\t150€\tPlanifié"
    },
    {
      id: "f3",
      folderId: "fld_photos",
      name: "Logo_Officiel_MDC_HD.jpg",
      type: "image",
      size: "2.1 Mo",
      date: "01 Nov 2026",
      category: "images",
      author: "Victor D.",
      url: "assets/logo.jpg",
      content: "Logo officiel Maison Du Charlo avec couronne dorée."
    },
    {
      id: "f4",
      folderId: "fld_docs",
      name: "Compte_Rendu_Reunion_Budget.txt",
      type: "text",
      size: "34 Ko",
      date: "05 Nov 2026",
      category: "documents",
      author: "Alexandre M.",
      content: "RÉUNION DU BUREAU DU 05/11/2026\n\nPoints abordés :\n- Bilan positif des cotisations\n- Achat du matériel commun pour les sorties\n- Validation de la mise en place du cloud unifié MDC-Conect sur GitHub Pages avec 4 To partagés."
    },
    {
      id: "f5",
      folderId: "root",
      name: "Statuts_Association_Charlo.pdf",
      type: "pdf",
      size: "890 Ko",
      date: "28 Oct 2026",
      category: "documents",
      author: "Victor D.",
      content: "Statuts légaux et règlement intérieur de l'entité MDC."
    }
  ],
  events: [
    {
      id: "e1",
      title: "Grande Soirée d'Hiver MDC",
      date: "2026-11-20",
      time: "20:00 - 02:00",
      category: "party",
      location: "Local MDC Principal",
      description: "Soirée festive de retrouvailles pour tous les membres avec buffet partagé."
    },
    {
      id: "e2",
      title: "Assemblée Générale MDC",
      date: "2026-11-15",
      time: "18:30 - 20:00",
      category: "important",
      location: "Salle de conférence & Visio",
      description: "Ordre du jour : Bilan semestriel, projets futurs et vote du bureau."
    },
    {
      id: "e3",
      title: "Sortie Découverte & Repas Équipe",
      date: "2026-11-28",
      time: "12:00 - 17:00",
      category: "trip",
      location: "Parc Naturel & Restaurant",
      description: "Randonnée conviviale et grand déjeuner."
    },
    {
      id: "e4",
      title: "Point Hebdomadaire Projets",
      date: "2026-11-10",
      time: "19:00 - 19:45",
      category: "meeting",
      location: "En ligne (Google Meet)",
      description: "Suivi des tâches en cours et programmation des semaines à venir."
    }
  ],
  tasks: [
    { id: "t1", title: "Finaliser les réservations pour la Soirée MDC", completed: false, due: "14 Nov 2026", priority: "high", author: "Sarah B." },
    { id: "t2", title: "Publier le bilan financier du mois d'octobre", completed: true, due: "05 Nov 2026", priority: "normal", author: "Alexandre M." },
    { id: "t3", title: "Déployer MDC-Conect sur GitHub Pages avec 4 To", completed: false, due: "10 Nov 2026", priority: "high", author: "Victor D." },
    { id: "t4", title: "Commander les sweats brodés avec le logo MDC", completed: false, due: "22 Nov 2026", priority: "normal", author: "Lucas P." },
    { id: "t5", title: "Mettre à jour l'inventaire du local", completed: true, due: "01 Nov 2026", priority: "low", author: "Camille D." }
  ],
  notes: [
    {
      id: "n1",
      title: "Idées d'activités pour le printemps",
      author: "Sarah B.",
      date: "05 Nov 2026",
      tag: "Événements",
      content: "1. Tournoi de pétanque / mölkky au soleil\n2. Projection cinéma en plein air avec projecteur\n3. Barbecue géant MDC avec les anciens membres."
    },
    {
      id: "n2",
      title: "Guide de bienvenue nouveaux arrivants",
      author: "Victor D.",
      date: "03 Nov 2026",
      tag: "Organisation",
      content: "Bienvenue à la Maison Du Charlo ! Dès votre adhésion, rejoignez le portail MDC-Conect pour retrouver tous les fichiers partagés (4 To), l'agenda et les tâches de l'équipe."
    },
    {
      id: "n3",
      title: "Checklist technique sono et lumières",
      author: "Lucas P.",
      date: "31 Oct 2026",
      tag: "Matériel",
      content: "- Câbles XLR (vérifier les 4 longs)\n- Table de mixage testée\n- Enceintes amplifiées rangées dans leurs housses\n- Multiprises protégées."
    }
  ],
  settings: {
    googleClientId: "",
    googleApiKey: "",
    driveFolderId: "",
    gasWebappUrl: "", // Google Apps Script URL for 4TB Google Drive
    calendarId: "",
    storageTotal: "4 To"
  }
};

// State Store with Local Persistence
class MDCStore {
  constructor() {
    this.key = "mdc_conect_data_v2";
    this.data = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(this.key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.folders) parsed.folders = DEFAULT_MDC_DATA.folders;
        if (!parsed.currentFolderId) parsed.currentFolderId = "root";
        return parsed;
      }
    } catch (e) {
      console.warn("Storage load error", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_MDC_DATA));
  }

  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch (e) {
      console.error("Storage save error", e);
    }
  }

  reset() {
    localStorage.removeItem(this.key);
    this.data = JSON.parse(JSON.stringify(DEFAULT_MDC_DATA));
    this.save();
  }
}

const store = new MDCStore();

// Google API Client Manager
class GoogleAPIManager {
  constructor() {
    this.tokenClient = null;
    this.accessToken = null;
    this.isAuthorized = false;
    this.scopes = [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/tasks"
    ].join(" ");
  }

  init() {
    const clientId = store.data.settings.googleClientId;
    if (!clientId) {
      return;
    }

    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: this.scopes,
          callback: async (resp) => {
            if (resp.error) {
              App.showToast("Erreur Google OAuth : " + resp.error);
              return;
            }
            this.accessToken = resp.access_token;
            this.isAuthorized = true;
            await this.fetchUserProfile();
            await this.syncDriveFiles();
            await this.syncCalendarEvents();
            await this.syncGoogleTasks();
            App.renderAll();
            App.showToast("Connecté à Google Suite (4 To) !");
          }
        });
      } catch (err) {
        console.error("GIS init error:", err);
      }
    }
  }

  signIn() {
    if (!store.data.settings.googleClientId) {
      App.openModal("modal-settings");
      App.showToast("Renseignez d'abord votre Google Client ID");
      return;
    }
    if (this.tokenClient) {
      this.tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      this.init();
      if (this.tokenClient) {
        this.tokenClient.requestAccessToken({ prompt: "consent" });
      } else {
        App.showToast("Chargement de Google Identity Services...");
      }
    }
  }

  signOut() {
    if (this.accessToken && window.google && window.google.accounts) {
      google.accounts.oauth2.revoke(this.accessToken, () => console.log("Token revoked"));
    }
    this.accessToken = null;
    this.isAuthorized = false;
    store.data.user = {
      name: "Victor Doussot",
      email: "victor@maisonducharlo.fr",
      role: "Président & Administrateur",
      avatar: "VD",
      isGoogle: false
    };
    store.save();
    App.renderAll();
    App.showToast("Déconnexion réussie");
  }

  async fetchUserProfile() {
    if (!this.accessToken) return;
    try {
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      const profile = await res.json();
      store.data.user = {
        name: profile.name || "Membre Google",
        email: profile.email || "google@mdc.fr",
        role: "Connecté Google 4 To",
        avatar: profile.picture || "G",
        isGoogle: true
      };
      store.save();
    } catch (e) {
      console.warn("User profile fetch error", e);
    }
  }

  async syncDriveFiles() {
    if (!this.accessToken) return;
    try {
      let url = "https://www.googleapis.com/drive/v3/files?pageSize=40&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink)";
      if (store.data.settings.driveFolderId) {
        url += `&q='${store.data.settings.driveFolderId}'+in+parents+and+trashed=false`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        const mapped = data.files.map(f => ({
          id: f.id,
          folderId: store.data.currentFolderId || "root",
          name: f.name,
          type: this.categorizeMime(f.mimeType),
          size: f.size ? (parseInt(f.size) / (1024 * 1024)).toFixed(1) + " Mo" : "Google Doc",
          date: new Date(f.modifiedTime).toLocaleDateString("fr-FR"),
          category: this.getCategory(f.mimeType),
          author: "Google Drive 4 To",
          url: f.webViewLink,
          thumbnail: f.thumbnailLink,
          content: "Fichier hébergé sur Google Drive 4 To de la Maison Du Charlo."
        }));
        store.data.files = [...mapped, ...DEFAULT_MDC_DATA.files];
        store.save();
      }
    } catch (e) {
      console.warn("Drive sync error", e);
    }
  }

  async syncCalendarEvents() {
    if (!this.accessToken) return;
    try {
      const calId = store.data.settings.calendarId || "primary";
      const now = new Date().toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?timeMin=${now}&maxResults=25&singleEvents=true&orderBy=startTime`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const mapped = data.items.map(ev => ({
          id: ev.id,
          title: ev.summary || "Sans titre",
          date: (ev.start.date || ev.start.dateTime || "").substring(0, 10),
          time: ev.start.dateTime ? new Date(ev.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Toute la journée",
          category: "meeting",
          location: ev.location || "MDC",
          description: ev.description || ""
        }));
        store.data.events = [...mapped, ...DEFAULT_MDC_DATA.events];
        store.save();
      }
    } catch (e) {
      console.warn("Calendar sync error", e);
    }
  }

  async syncGoogleTasks() {
    if (!this.accessToken) return;
    try {
      const res = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      const lists = await res.json();
      if (lists.items && lists.items[0]) {
        const listId = lists.items[0].id;
        const taskRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`, {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        });
        const taskData = await taskRes.json();
        if (taskData.items) {
          const mapped = taskData.items.map(t => ({
            id: t.id,
            title: t.title,
            completed: t.status === "completed",
            due: t.due ? new Date(t.due).toLocaleDateString("fr-FR") : "Flexible",
            priority: "normal",
            author: store.data.user.name
          }));
          store.data.tasks = [...mapped, ...DEFAULT_MDC_DATA.tasks];
          store.save();
        }
      }
    } catch (e) {
      console.warn("Tasks sync error", e);
    }
  }

  categorizeMime(mime) {
    if (!mime) return "document";
    if (mime.includes("pdf")) return "pdf";
    if (mime.includes("image")) return "image";
    if (mime.includes("video")) return "video";
    if (mime.includes("audio")) return "audio";
    if (mime.includes("sheet") || mime.includes("excel")) return "spreadsheet";
    return "document";
  }

  getCategory(mime) {
    if (!mime) return "documents";
    if (mime.includes("image") || mime.includes("video") || mime.includes("audio")) return "images";
    if (mime.includes("sheet") || mime.includes("excel")) return "spreadsheets";
    return "documents";
  }
}

const googleApi = new GoogleAPIManager();

// Core Application UI Controller
const App = {
  currentTab: "drive",
  currentCalendarDate: new Date(2026, 10, 1),
  activeFilterCategory: "all",
  searchQuery: "",

  init() {
    this.bindEvents();
    this.applyTheme();
    this.renderAll();
    googleApi.init();
  },

  bindEvents() {
    // Nav tabs
    document.querySelectorAll(".nav-tab").forEach(tab => {
      tab.addEventListener("click", (e) => {
        const target = e.currentTarget.getAttribute("data-tab");
        this.switchTab(target);
      });
    });

    // Theme toggle
    document.getElementById("btn-toggle-theme")?.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("mdc_theme", next);
      this.updateThemeIcon(next);
    });

    // Global Search
    const searchInputs = document.querySelectorAll(".apple-search input");
    searchInputs.forEach(input => {
      input.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderDriveFiles();
        this.renderTasksAndNotes();
      });
    });

    // Modal Close buttons
    document.querySelectorAll(".modal-close-btn, .modal-cancel-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("open"));
      });
    });

    // File Dropzone & Multiple File Picker
    const dropzone = document.getElementById("file-dropzone");
    const filePicker = document.getElementById("file-picker-hidden");
    if (dropzone && filePicker) {
      dropzone.addEventListener("click", () => filePicker.click());
      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
      });
      dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) {
          Array.from(e.dataTransfer.files).forEach(f => this.handleFileUpload(f));
        }
      });
      filePicker.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
          Array.from(e.target.files).forEach(f => this.handleFileUpload(f));
        }
      });
    }

    // New Folder Modal Form
    document.getElementById("form-create-folder")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const folderName = document.getElementById("folder-name-input").value.trim();
      if (folderName) {
        this.createFolder(folderName);
        document.getElementById("folder-name-input").value = "";
        this.closeModal("modal-create-folder");
      }
    });

    // Quick Task Input
    const taskInput = document.getElementById("quick-task-input");
    taskInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && taskInput.value.trim()) {
        this.addTask(taskInput.value.trim());
        taskInput.value = "";
      }
    });

    document.getElementById("btn-add-quick-task")?.addEventListener("click", () => {
      if (taskInput && taskInput.value.trim()) {
        this.addTask(taskInput.value.trim());
        taskInput.value = "";
      }
    });

    // Form submissions
    document.getElementById("form-add-event")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveEventFromModal();
    });

    document.getElementById("form-add-note")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveNoteFromModal();
    });

    document.getElementById("form-settings")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveSettings();
    });

    // Google Sign in / out
    document.getElementById("btn-google-login")?.addEventListener("click", () => googleApi.signIn());
    document.getElementById("btn-google-logout")?.addEventListener("click", () => googleApi.signOut());

    // Switch Account Profile
    document.querySelectorAll(".account-choice-btn")?.forEach(btn => {
      btn.addEventListener("click", (e) => {
        const name = e.currentTarget.getAttribute("data-name");
        const role = e.currentTarget.getAttribute("data-role");
        const avatar = e.currentTarget.getAttribute("data-avatar");
        store.data.user = { name, role, avatar, email: `${name.toLowerCase().replace(/ /g, '.')}@mdc.fr`, isGoogle: false };
        store.save();
        this.closeModal("modal-account");
        this.renderUserProfile();
        this.showToast(`Connecté en tant que ${name}`);
      });
    });

    // Calendar Export / Import buttons
    document.getElementById("btn-export-ics")?.addEventListener("click", () => this.exportICS());
    const calImportPicker = document.getElementById("cal-import-picker");
    document.getElementById("btn-import-ics")?.addEventListener("click", () => calImportPicker?.click());
    calImportPicker?.addEventListener("change", (e) => {
      if (e.target.files.length > 0) this.importICS(e.target.files[0]);
    });

    // Notes Export / Import buttons
    document.getElementById("btn-export-notes")?.addEventListener("click", () => this.exportNotes());
    const notesImportPicker = document.getElementById("notes-import-picker");
    document.getElementById("btn-import-notes")?.addEventListener("click", () => notesImportPicker?.click());
    notesImportPicker?.addEventListener("change", (e) => {
      if (e.target.files.length > 0) this.importNotes(e.target.files[0]);
    });

    // Export current folder as ZIP
    document.getElementById("btn-export-folder-zip")?.addEventListener("click", () => this.exportCurrentFolderZip());
  },

  applyTheme() {
    const saved = localStorage.getItem("mdc_theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
    this.updateThemeIcon(saved);
  },

  updateThemeIcon(theme) {
    const btn = document.getElementById("btn-toggle-theme");
    if (!btn) return;
    const logoImg = document.getElementById("app-header-logo");
    if (theme === "dark") {
      btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`;
      if (logoImg) logoImg.src = "assets/logo-dark.png";
    } else {
      btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>`;
      if (logoImg) logoImg.src = "assets/logo.jpg";
    }
  },

  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll(".nav-tab").forEach(t => {
      t.classList.toggle("active", t.getAttribute("data-tab") === tabId);
    });
    document.querySelectorAll(".view-section").forEach(sec => {
      sec.classList.toggle("active", sec.id === `view-${tabId}`);
    });
    if (tabId === "calendar") {
      this.renderCalendar();
    }
  },

  renderAll() {
    this.renderUserProfile();
    this.renderDriveBreadcrumbs();
    this.renderFolders();
    this.renderDriveFiles();
    this.renderCalendar();
    this.renderTasksAndNotes();
    this.renderMembers();
    this.renderSettingsValues();
  },

  renderUserProfile() {
    const user = store.data.user;
    const nameLabel = document.getElementById("user-name-display");
    const avatarBox = document.getElementById("user-avatar-display");
    const statusDot = document.getElementById("status-dot");
    const statusText = document.getElementById("status-text");

    if (nameLabel) nameLabel.textContent = user.name;
    if (avatarBox) {
      if (user.avatar && user.avatar.startsWith("http")) {
        avatarBox.innerHTML = `<img src="${user.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      } else {
        avatarBox.textContent = user.avatar || "VD";
      }
    }

    if (statusDot && statusText) {
      if (googleApi.isAuthorized) {
        statusDot.className = "status-dot";
        statusText.textContent = "Google Cloud 4 To";
      } else {
        statusDot.className = "status-dot offline";
        statusText.textContent = "Espace MDC 4 To";
      }
    }
  },

  /* ==========================================
     MODULE 1: FOLDERS & FILES (4 TO CLOUD)
     ========================================== */
  getCurrentFolder() {
    const id = store.data.currentFolderId || "root";
    if (id === "root") return { id: "root", name: "Accueil", parentId: null };
    return store.data.folders.find(f => f.id === id) || { id: "root", name: "Accueil", parentId: null };
  },

  navigateToFolder(folderId) {
    store.data.currentFolderId = folderId;
    store.save();
    this.renderDriveBreadcrumbs();
    this.renderFolders();
    this.renderDriveFiles();
  },

  createFolder(name) {
    const newFolder = {
      id: "fld_" + Date.now(),
      name: name,
      parentId: store.data.currentFolderId || "root"
    };
    store.data.folders.push(newFolder);
    store.save();
    this.renderFolders();
    this.renderDriveBreadcrumbs();
    this.showToast(`Dossier « ${name} » créé !`);
  },

  deleteFolder(folderId, e) {
    if (e) e.stopPropagation();
    const folder = store.data.folders.find(f => f.id === folderId);
    if (!folder) return;
    if (confirm(`Voulez-vous supprimer le dossier « ${folder.name} » et ses fichiers ?`)) {
      store.data.folders = store.data.folders.filter(f => f.id !== folderId);
      store.data.files = store.data.files.filter(f => f.folderId !== folderId);
      store.save();
      this.renderFolders();
      this.renderDriveFiles();
      this.showToast("Dossier supprimé");
    }
  },

  renderDriveBreadcrumbs() {
    const trail = document.getElementById("drive-breadcrumb-trail");
    if (!trail) return;

    const current = this.getCurrentFolder();
    let html = `<span class="breadcrumb-item" onclick="App.navigateToFolder('root')">MDC Cloud 4 To</span>`;
    
    if (current.id !== "root") {
      html += ` <span class="breadcrumb-sep">›</span> <span style="font-weight:600; color:var(--color-text-primary);">${this.escapeHTML(current.name)}</span>`;
    }
    trail.innerHTML = html;
  },

  renderFolders() {
    const container = document.getElementById("folders-grid-container");
    if (!container) return;

    const currentId = store.data.currentFolderId || "root";
    const subfolders = store.data.folders.filter(f => f.parentId === currentId);

    if (subfolders.length === 0) {
      container.innerHTML = "";
      document.getElementById("folders-wrapper")?.classList.add("hidden");
      return;
    }

    document.getElementById("folders-wrapper")?.classList.remove("hidden");
    container.innerHTML = subfolders.map(folder => {
      const fileCount = store.data.files.filter(f => f.folderId === folder.id).length;
      return `
        <div class="folder-card" onclick="App.navigateToFolder('${folder.id}')">
          <div class="folder-card-left">
            <svg class="folder-card-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-7.5l-2-2H4.5A3 3 0 001.5 11.5v6.5a3 3 0 003 3h15z"/>
            </svg>
            <div class="folder-card-info">
              <span class="folder-card-name" title="${folder.name}">${folder.name}</span>
              <span class="folder-card-count">${fileCount} fichier${fileCount > 1 ? 's' : ''}</span>
            </div>
          </div>
          <button class="folder-delete-btn" onclick="App.deleteFolder('${folder.id}', event)" title="Supprimer ce dossier">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      `;
    }).join("");
  },

  renderDriveFiles() {
    const container = document.getElementById("files-grid-container");
    if (!container) return;

    const currentFolderId = store.data.currentFolderId || "root";
    let files = store.data.files.filter(f => (f.folderId || "root") === currentFolderId);

    if (this.activeFilterCategory !== "all") {
      files = files.filter(f => f.category === this.activeFilterCategory);
    }
    if (this.searchQuery) {
      files = store.data.files.filter(f => f.name.toLowerCase().includes(this.searchQuery));
    }

    if (files.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 36px 20px; color: var(--color-text-tertiary);">
          <svg width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom:8px; opacity:0.6;">
            <path d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          </svg>
          <p style="font-size:14px; font-weight:500;">Aucun fichier dans ce dossier</p>
          <p style="font-size:12.5px; margin-top:4px;">Glissez des fichiers ci-dessous ou cliquez sur « Importer un fichier »</p>
        </div>
      `;
      return;
    }

    container.innerHTML = files.map(file => {
      const icon = this.getFileIcon(file.type);
      return `
        <div class="file-card">
          <div class="file-card-preview" onclick="App.openFileViewer('${file.id}')">
            ${file.thumbnail ? `<img src="${file.thumbnail}" alt="${file.name}">` : icon}
          </div>
          <div class="file-card-details">
            <span class="file-card-name" title="${file.name}" onclick="App.openFileViewer('${file.id}')">${file.name}</span>
            <div class="file-card-meta">
              <span>${file.size} · ${file.date}</span>
              <span class="file-card-badge">${file.type.toUpperCase()}</span>
            </div>
            <div class="file-card-actions">
              <button class="file-mini-btn" onclick="App.openFileViewer('${file.id}')" title="Visionner">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span>Voir</span>
              </button>
              <button class="file-mini-btn" onclick="App.downloadSingleFile('${file.id}', event)" title="Exporter / Télécharger">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Exporter</span>
              </button>
              <button class="file-mini-btn btn-delete" onclick="App.deleteFile('${file.id}', event)" title="Supprimer">
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  getFileIcon(type) {
    if (type === "pdf") {
      return `<svg class="file-card-icon" style="color:var(--color-apple-red);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 15h6M9 11h2"/></svg>`;
    } else if (type === "image") {
      return `<svg class="file-card-icon" style="color:var(--color-apple-purple);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`;
    } else if (type === "video") {
      return `<svg class="file-card-icon" style="color:var(--color-apple-orange);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`;
    } else if (type === "audio") {
      return `<svg class="file-card-icon" style="color:var(--color-accent-gold);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
    } else if (type === "spreadsheet") {
      return `<svg class="file-card-icon" style="color:var(--color-apple-green);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>`;
    } else {
      return `<svg class="file-card-icon" style="color:var(--color-apple-blue);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
    }
  },

  setFileFilter(category, btnElement) {
    this.activeFilterCategory = category;
    document.querySelectorAll(".sidebar-item").forEach(item => item.classList.remove("active"));
    if (btnElement) btnElement.classList.add("active");
    this.renderDriveFiles();
  },

  openFileViewer(fileId) {
    const file = store.data.files.find(f => f.id === fileId);
    if (!file) return;

    document.getElementById("modal-file-title").textContent = file.name;
    document.getElementById("modal-file-author").textContent = `Dossier : ${this.getCurrentFolder().name} · Ajouté par ${file.author} · ${file.date} · ${file.size}`;
    
    const container = document.getElementById("file-viewer-container");
    if (file.type === "image") {
      container.innerHTML = `<img src="${file.url || 'assets/logo.jpg'}" alt="${file.name}">`;
    } else if (file.type === "video") {
      container.innerHTML = `<video controls class="apple-video-player" src="${file.url || ''}"><p>Aperçu vidéo</p></video>`;
    } else if (file.type === "audio") {
      container.innerHTML = `<audio controls class="apple-audio-player" src="${file.url || ''}"></audio>`;
    } else if (file.type === "spreadsheet" && file.content && file.content.includes("\t")) {
      const rows = file.content.split("\n").filter(r => r.trim());
      const headerCols = rows[0].split("\t");
      let tableHtml = `<div class="apple-table-wrap"><table class="apple-table"><thead><tr>`;
      headerCols.forEach(h => tableHtml += `<th>${this.escapeHTML(h)}</th>`);
      tableHtml += `</tr></thead><tbody>`;
      rows.slice(1).forEach(row => {
        tableHtml += `<tr>`;
        row.split("\t").forEach(c => tableHtml += `<td>${this.escapeHTML(c)}</td>`);
        tableHtml += `</tr>`;
      });
      tableHtml += `</tbody></table></div>`;
      container.innerHTML = tableHtml;
    } else {
      container.innerHTML = `<div class="text-viewer-box">${this.escapeHTML(file.content || "Fichier confiné disponible en téléchargement.")}</div>`;
    }

    const downloadBtn = document.getElementById("btn-download-file");
    if (downloadBtn) {
      downloadBtn.onclick = () => this.downloadSingleFile(file.id);
    }

    this.openModal("modal-file-viewer");
  },

  downloadSingleFile(fileId, e) {
    if (e) e.stopPropagation();
    const file = store.data.files.find(f => f.id === fileId);
    if (!file) return;

    if (file.url && file.url.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = file.url;
      a.download = file.name;
      a.click();
    } else {
      const blob = new Blob([file.content || file.name], { type: "application/octet-stream;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
    }
    this.showToast(`Export de « ${file.name} » lancé !`);
  },

  deleteFile(fileId, e) {
    if (e) e.stopPropagation();
    const file = store.data.files.find(f => f.id === fileId);
    if (!file) return;
    if (confirm(`Supprimer le fichier « ${file.name} » ?`)) {
      store.data.files = store.data.files.filter(f => f.id !== fileId);
      store.save();
      this.renderDriveFiles();
      this.renderFolders();
      this.showToast("Fichier supprimé");
    }
  },

  async exportCurrentFolderZip() {
    if (typeof JSZip === "undefined") {
      this.showToast("Librairie ZIP en cours de chargement...");
      return;
    }
    const currentFolder = this.getCurrentFolder();
    const files = store.data.files.filter(f => (f.folderId || "root") === currentFolder.id);

    if (files.length === 0) {
      this.showToast("Aucun fichier à exporter dans ce dossier");
      return;
    }

    const zip = new JSZip();
    const folderZip = zip.folder(currentFolder.name);

    files.forEach(file => {
      if (file.url && file.url.startsWith("data:")) {
        const base64Data = file.url.split(",")[1];
        folderZip.file(file.name, base64Data, { base64: true });
      } else {
        folderZip.file(file.name, file.content || `Fichier MDC: ${file.name}`);
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = `${currentFolder.name.replace(/ /g, '_')}_MDC.zip`;
    a.click();
    this.showToast(`Dossier « ${currentFolder.name} » exporté en ZIP !`);
  },

  handleFileUpload(fileObj) {
    const ext = fileObj.name.split('.').pop().toLowerCase();
    let type = "document";
    let cat = "documents";

    if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
      type = "image";
      cat = "images";
    } else if (["mp4", "mov", "webm", "avi"].includes(ext)) {
      type = "video";
      cat = "images";
    } else if (["mp3", "wav", "ogg", "m4a"].includes(ext)) {
      type = "audio";
      cat = "images";
    } else if (["xls", "xlsx", "csv"].includes(ext)) {
      type = "spreadsheet";
      cat = "spreadsheets";
    } else if (ext === "pdf") {
      type = "pdf";
      cat = "documents";
    }

    const currentFolderId = store.data.currentFolderId || "root";
    const reader = new FileReader();

    if (type === "image" || type === "video" || type === "audio" || type === "pdf") {
      reader.onload = (e) => {
        const newFile = {
          id: "f_" + Date.now() + "_" + Math.floor(Math.random()*1000),
          folderId: currentFolderId,
          name: fileObj.name,
          type: type,
          size: (fileObj.size / (1024 * 1024)).toFixed(2) + " Mo",
          date: "Aujourd'hui",
          category: cat,
          author: store.data.user.name,
          url: e.target.result,
          content: `Document importé dans le dossier MDC.\nTaille : ${fileObj.size} octets.`
        };
        store.data.files.unshift(newFile);
        store.save();
        this.renderDriveFiles();
        this.renderFolders();
        this.showToast(`Fichier « ${fileObj.name} » importé dans le dossier !`);
      };
      reader.readAsDataURL(fileObj);
    } else {
      reader.onload = (e) => {
        const newFile = {
          id: "f_" + Date.now() + "_" + Math.floor(Math.random()*1000),
          folderId: currentFolderId,
          name: fileObj.name,
          type: type,
          size: (fileObj.size / (1024 * 1024)).toFixed(2) + " Mo",
          date: "Aujourd'hui",
          category: cat,
          author: store.data.user.name,
          content: e.target.result
        };
        store.data.files.unshift(newFile);
        store.save();
        this.renderDriveFiles();
        this.renderFolders();
        this.showToast(`Document « ${fileObj.name} » importé !`);
      };
      reader.readAsText(fileObj);
    }
  },

  /* ==========================================
     MODULE 2: CALENDRIER (IMPORT / EXPORT / VISION)
     ========================================== */
  renderCalendar() {
    const monthTitle = document.getElementById("cal-month-display");
    const gridDays = document.getElementById("cal-grid-days");
    const upcomingList = document.getElementById("upcoming-events-list");
    if (!gridDays) return;

    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();

    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    if (monthTitle) monthTitle.textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    let html = "";
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      html += `<div class="cal-cell other-month"><div class="cal-cell-header"><span class="cal-day-num">${daysInPrevMonth - i}</span></div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && today.getDate() === day;
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = store.data.events.filter(e => e.date === dateStr);

      html += `
        <div class="cal-cell ${isToday ? 'today' : ''}" onclick="App.openAddEventForDate('${dateStr}')">
          <div class="cal-cell-header">
            <span class="cal-day-num">${day}</span>
          </div>
          ${dayEvents.map(e => `
            <div class="cal-event-pill cat-${e.category}" onclick="event.stopPropagation(); App.showEventDetail('${e.id}')" title="${e.title}">
              ${e.time ? e.time.split(' ')[0] : ''} ${e.title}
            </div>
          `).join("")}
        </div>
      `;
    }

    gridDays.innerHTML = html;

    if (upcomingList) {
      const sorted = [...store.data.events].sort((a, b) => new Date(a.date) - new Date(b.date));
      upcomingList.innerHTML = sorted.slice(0, 6).map(ev => {
        const d = new Date(ev.date);
        const dayNum = isNaN(d.getDate()) ? "20" : d.getDate();
        const monthShort = isNaN(d.getMonth()) ? "NOV" : monthNames[d.getMonth()].substring(0, 3).toUpperCase();

        return `
          <div class="event-item" onclick="App.showEventDetail('${ev.id}')">
            <div class="event-date-badge">
              <span class="event-badge-month">${monthShort}</span>
              <span class="event-badge-day">${dayNum}</span>
            </div>
            <div class="event-info">
              <h4>${ev.title}</h4>
              <p>${ev.time || '19:00'} · ${ev.location || 'MDC'}</p>
            </div>
          </div>
        `;
      }).join("");
    }
  },

  changeMonth(delta) {
    this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + delta);
    this.renderCalendar();
  },

  jumpToday() {
    this.currentCalendarDate = new Date();
    this.renderCalendar();
  },

  openAddEventForDate(dateStr) {
    const input = document.getElementById("event-date-input");
    if (input) input.value = dateStr;
    this.openModal("modal-add-event");
  },

  saveEventFromModal() {
    const title = document.getElementById("event-title-input").value;
    const date = document.getElementById("event-date-input").value;
    const time = document.getElementById("event-time-input").value;
    const location = document.getElementById("event-loc-input").value;
    const category = document.getElementById("event-cat-input").value;
    const description = document.getElementById("event-desc-input").value;

    const newEvent = {
      id: "ev_" + Date.now(),
      title,
      date,
      time: time || "19:00",
      location: location || "MDC",
      category,
      description
    };

    store.data.events.push(newEvent);
    store.save();
    this.closeModal("modal-add-event");
    this.renderCalendar();
    this.showToast("Événement programmé !");
  },

  showEventDetail(id) {
    const ev = store.data.events.find(e => e.id === id);
    if (!ev) return;
    if (confirm(`Événement MDC :\n\n${ev.title}\nDate : ${ev.date} (${ev.time})\nLieu : ${ev.location}\nDescription : ${ev.description || "Aucune"}\n\nVoulez-vous supprimer cet événement ?`)) {
      store.data.events = store.data.events.filter(e => e.id !== id);
      store.save();
      this.renderCalendar();
      this.showToast("Événement supprimé");
    }
  },

  exportICS() {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MDC-Conect//FR\nCALSCALE:GREGORIAN\n";
    store.data.events.forEach(ev => {
      const cleanDate = ev.date.replace(/-/g, "");
      icsContent += `BEGIN:VEVENT\nSUMMARY:${ev.title}\nDTSTART;VALUE=DATE:${cleanDate}\nDESCRIPTION:${ev.description || ''}\nLOCATION:${ev.location || ''}\nEND:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "calendrier_mdc.ics";
    a.click();
    this.showToast("Export du calendrier (.ics) téléchargé !");
  },

  importICS(fileObj) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const eventBlocks = text.split("BEGIN:VEVENT");
      let count = 0;

      eventBlocks.slice(1).forEach(block => {
        const summaryMatch = block.match(/SUMMARY:(.*)/);
        const dtstartMatch = block.match(/DTSTART.*:(\d{4})(\d{2})(\d{2})/);
        const locationMatch = block.match(/LOCATION:(.*)/);
        const descMatch = block.match(/DESCRIPTION:(.*)/);

        if (summaryMatch && dtstartMatch) {
          const title = summaryMatch[1].trim();
          const date = `${dtstartMatch[1]}-${dtstartMatch[2]}-${dtstartMatch[3]}`;
          const location = locationMatch ? locationMatch[1].trim() : "MDC";
          const description = descMatch ? descMatch[1].trim() : "";

          store.data.events.push({
            id: "ev_" + Date.now() + "_" + Math.floor(Math.random()*1000),
            title,
            date,
            time: "19:00",
            location,
            category: "party",
            description
          });
          count++;
        }
      });

      store.save();
      this.renderCalendar();
      this.showToast(`${count} événement(s) importé(s) dans l'agenda !`);
    };
    reader.readAsText(fileObj);
  },

  /* ==========================================
     MODULE 3: NOTES & TACHES (IMPORT / EXPORT / VISION)
     ========================================== */
  renderTasksAndNotes() {
    const tasksContainer = document.getElementById("tasks-list-container");
    const notesContainer = document.getElementById("notes-grid-container");

    // Tasks
    if (tasksContainer) {
      let tasks = store.data.tasks;
      if (this.searchQuery) {
        tasks = tasks.filter(t => t.title.toLowerCase().includes(this.searchQuery));
      }

      tasksContainer.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
          <div class="task-left" onclick="App.toggleTask('${task.id}')">
            <div class="apple-checkbox">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <span class="task-title">${task.title}</span>
              <div class="task-due">
                <span>Échéance : ${task.due}</span>
                <span>· ${task.author}</span>
              </div>
            </div>
          </div>
          <button class="task-delete-btn" onclick="App.deleteTask('${task.id}')" title="Supprimer">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      `).join("");
    }

    // Notes
    if (notesContainer) {
      let notes = store.data.notes;
      if (this.searchQuery) {
        notes = notes.filter(n => n.title.toLowerCase().includes(this.searchQuery) || n.content.toLowerCase().includes(this.searchQuery));
      }

      notesContainer.innerHTML = notes.map(note => `
        <div class="note-card" onclick="App.openNoteViewer('${note.id}')">
          <div class="note-card-header">
            <h4 class="note-card-title">${note.title}</h4>
            <span class="note-card-date">${note.date}</span>
          </div>
          <p class="note-card-body">${this.escapeHTML(note.content)}</p>
          <div class="note-card-footer">
            <span class="note-author-tag">${note.tag || 'MDC'}</span>
            <div style="display:flex; gap:6px;">
              <button class="file-mini-btn" onclick="event.stopPropagation(); App.exportSingleNote('${note.id}')" title="Exporter cette note">
                <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                <span>Exporter</span>
              </button>
              <button class="file-mini-btn btn-delete" onclick="event.stopPropagation(); App.deleteNote('${note.id}')" title="Supprimer">
                <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        </div>
      `).join("");
    }
  },

  addTask(title) {
    const newTask = {
      id: "t_" + Date.now(),
      title,
      completed: false,
      due: "Prochainement",
      priority: "normal",
      author: store.data.user.name
    };
    store.data.tasks.unshift(newTask);
    store.save();
    this.renderTasksAndNotes();
    this.showToast("Tâche ajoutée !");
  },

  toggleTask(id) {
    const task = store.data.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      store.save();
      this.renderTasksAndNotes();
    }
  },

  deleteTask(id) {
    store.data.tasks = store.data.tasks.filter(t => t.id !== id);
    store.save();
    this.renderTasksAndNotes();
    this.showToast("Tâche supprimée");
  },

  saveNoteFromModal() {
    const title = document.getElementById("note-title-input").value;
    const tag = document.getElementById("note-tag-input").value;
    const content = document.getElementById("note-content-input").value;

    const newNote = {
      id: "n_" + Date.now(),
      title,
      author: store.data.user.name,
      date: "Aujourd'hui",
      tag: tag || "Général",
      content
    };

    store.data.notes.unshift(newNote);
    store.save();
    this.closeModal("modal-add-note");
    this.renderTasksAndNotes();
    this.showToast("Note enregistrée dans l'espace MDC !");
  },

  openNoteViewer(id) {
    const note = store.data.notes.find(n => n.id === id);
    if (!note) return;
    alert(`Note MDC : ${note.title}\nPar ${note.author} (${note.date})\nThème : ${note.tag}\n\n${note.content}`);
  },

  deleteNote(id) {
    if (confirm("Supprimer cette note ?")) {
      store.data.notes = store.data.notes.filter(n => n.id !== id);
      store.save();
      this.renderTasksAndNotes();
      this.showToast("Note supprimée");
    }
  },

  exportSingleNote(id) {
    const note = store.data.notes.find(n => n.id === id);
    if (!note) return;
    const blob = new Blob([`# ${note.title}\nPar ${note.author} · ${note.date}\nTag: ${note.tag}\n\n${note.content}`], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${note.title.replace(/ /g, '_')}.md`;
    a.click();
    this.showToast(`Note « ${note.title} » exportée en Markdown !`);
  },

  async exportNotes() {
    if (typeof JSZip === "undefined") {
      this.showToast("Librairie ZIP en cours de chargement...");
      return;
    }
    const zip = new JSZip();
    const folder = zip.folder("Notes_MDC");
    store.data.notes.forEach(note => {
      folder.file(`${note.title.replace(/ /g, '_')}.md`, `# ${note.title}\nPar ${note.author} (${note.date})\nTag: ${note.tag}\n\n${note.content}`);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Notes_MDC_Archive.zip";
    a.click();
    this.showToast("Toutes les notes ont été exportées en ZIP !");
  },

  importNotes(fileObj) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const title = fileObj.name.replace(/\.[^/.]+$/, "");
      store.data.notes.unshift({
        id: "n_" + Date.now(),
        title: title,
        author: store.data.user.name,
        date: "Aujourd'hui",
        tag: "Importé",
        content: text
      });
      store.save();
      this.renderTasksAndNotes();
      this.showToast(`Note « ${title} » importée avec succès !`);
    };
    reader.readAsText(fileObj);
  },

  /* ==========================================
     MODULE 4: MEMBRES & EQUIPE
     ========================================== */
  renderMembers() {
    const container = document.getElementById("team-grid-container");
    if (!container) return;

    container.innerHTML = store.data.members.map(member => `
      <div class="member-card">
        <div class="member-avatar-large">${member.avatar}</div>
        <div class="member-info">
          <h4>${member.name}</h4>
          <div class="member-role">${member.role}</div>
          <span class="member-status-pill">
            <span style="width:6px; height:6px; border-radius:50%; background:currentColor;"></span>
            ${member.status}
          </span>
        </div>
      </div>
    `).join("");
  },

  /* ==========================================
     SETTINGS & BACKUP
     ========================================== */
  renderSettingsValues() {
    const inputClient = document.getElementById("cfg-client-id");
    const inputKey = document.getElementById("cfg-api-key");
    const inputDrive = document.getElementById("cfg-drive-id");
    const inputGas = document.getElementById("cfg-gas-url");
    const inputCal = document.getElementById("cfg-cal-id");

    if (inputClient) inputClient.value = store.data.settings.googleClientId || "";
    if (inputKey) inputKey.value = store.data.settings.googleApiKey || "";
    if (inputDrive) inputDrive.value = store.data.settings.driveFolderId || "";
    if (inputGas) inputGas.value = store.data.settings.gasWebappUrl || "";
    if (inputCal) inputCal.value = store.data.settings.calendarId || "";
  },

  saveSettings() {
    store.data.settings.googleClientId = document.getElementById("cfg-client-id").value.trim();
    store.data.settings.googleApiKey = document.getElementById("cfg-api-key").value.trim();
    store.data.settings.driveFolderId = document.getElementById("cfg-drive-id").value.trim();
    store.data.settings.gasWebappUrl = document.getElementById("cfg-gas-url").value.trim();
    store.data.settings.calendarId = document.getElementById("cfg-cal-id").value.trim();
    store.save();

    this.closeModal("modal-settings");
    this.showToast("Paramètres Cloud 4 To enregistrés !");
    googleApi.init();
  },

  resetAllData() {
    if (confirm("Réinitialiser toutes les données de test locales ?")) {
      store.reset();
      this.renderAll();
      this.showToast("Données réinitialisées.");
    }
  },

  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add("open");
  },

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove("open");
  },

  showToast(message) {
    const toast = document.getElementById("app-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3200);
  },

  escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());
