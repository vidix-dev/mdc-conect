/**
 * MDC-Conect · Core Application Logic
 * Virgin State · No Fake Data · Pure SVG Icons
 * Account Auth: First letter of first name + Last name + Day of birth (e.g. vdoussot19)
 * Integrated with 4TB Google Apps Script Web App Gateway
 */

// Format generator: première lettre du prénom + nom de famille + jour de naissance
function generateUsername(firstName, lastName, birthDay) {
  if (!firstName || !lastName || !birthDay) return "";
  const f = firstName.trim().charAt(0).toLowerCase();
  const l = lastName.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
  const d = String(parseInt(birthDay, 10) || birthDay).trim();
  return `${f}${l}${d}`;
}

// Initial Virgin State (Clean slate)
const DEFAULT_VIRGIN_DATA = {
  currentUser: null,
  currentFolderId: "root",
  accounts: [
    {
      id: "acc_admin",
      username: "vdoussot19",
      firstName: "Victor",
      lastName: "Doussot",
      birthDay: 19,
      role: "Administrateur",
      createdAt: "06 Nov 2026"
    }
  ],
  folders: [],
  files: [],
  events: [],
  tasks: [],
  notes: [],
  settings: {
    cloudApiUrl: "https://extranet-cad.duckdns.org/mdc-api/",
    gasWebappUrl: "https://script.google.com/macros/s/AKfycbx6AyPMD99J68qmikpr-ay22dWMkzY-mkCaufAAhCiLtnS_0fGRRoMsrrEHLyXjbEKDLw/exec",
    googleClientId: "",
    driveFolderId: "",
    calendarId: "",
    storageTotal: "4 To"
  }
};

// Data Store with Local Storage persistence
class MDCStore {
  constructor() {
    this.key = "mdc_conect_virgin_v3";
    this.data = this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(this.key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.accounts || parsed.accounts.length === 0) {
          parsed.accounts = DEFAULT_VIRGIN_DATA.accounts;
        }
        if (!parsed.settings.gasWebappUrl) {
          parsed.settings.gasWebappUrl = DEFAULT_VIRGIN_DATA.settings.gasWebappUrl;
        }
        if (!parsed.settings.cloudApiUrl) {
          parsed.settings.cloudApiUrl = DEFAULT_VIRGIN_DATA.settings.cloudApiUrl;
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Storage load error", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_VIRGIN_DATA));
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
    this.data = JSON.parse(JSON.stringify(DEFAULT_VIRGIN_DATA));
    this.save();
  }
}

const store = new MDCStore();

// Core Application UI Controller
const App = {
  currentTab: "drive",
  currentCalendarDate: new Date(),
  activeFilterCategory: "all",
  searchQuery: "",

  init() {
    this.bindEvents();
    this.applyTheme();
    this.syncFromCloud();
    this.checkAuthStatus();
    setInterval(() => this.syncFromCloud(), 15000);
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

    // Lock screen switch between Login and Register views
    document.getElementById("btn-switch-to-register")?.addEventListener("click", () => {
      document.getElementById("lock-view-login").style.display = "none";
      document.getElementById("lock-view-register").style.display = "block";
      document.getElementById("lock-card-title").textContent = "Créer un compte";
      document.getElementById("lock-card-subtitle").textContent = "Rejoindre l'espace Maison Du Charlo";
      document.getElementById("reg-fname-input")?.focus();
    });

    document.getElementById("btn-switch-to-login")?.addEventListener("click", () => {
      document.getElementById("lock-view-register").style.display = "none";
      document.getElementById("lock-view-login").style.display = "block";
      document.getElementById("lock-card-title").textContent = "MDC-Conect";
      document.getElementById("lock-card-subtitle").textContent = "Portail collaboratif 4 To · Maison Du Charlo";
      document.getElementById("lock-username-input")?.focus();
    });

    // Realtime preview for autonomous registration on Lock Screen
    const regFname = document.getElementById("reg-fname-input");
    const regLname = document.getElementById("reg-lname-input");
    const regBday = document.getElementById("reg-bday-input");
    const regPreview = document.getElementById("reg-preview-username");

    const updateRegPreview = () => {
      if (!regPreview) return;
      const fn = regFname?.value || "";
      const ln = regLname?.value || "";
      const bd = regBday?.value || "";
      const code = generateUsername(fn, ln, bd);
      regPreview.textContent = code ? code : "jdupont12";
    };

    regFname?.addEventListener("input", updateRegPreview);
    regLname?.addEventListener("input", updateRegPreview);
    regBday?.addEventListener("input", updateRegPreview);

    // Form submit for Lock Screen autonomous registration
    document.getElementById("form-lock-register")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fn = regFname.value.trim();
      const ln = regLname.value.trim();
      const bd = regBday.value.trim();

      const username = generateUsername(fn, ln, bd);
      if (!username) {
        alert("Veuillez renseigner votre prénom, nom et jour de naissance.");
        return;
      }

      const exists = store.data.accounts.some(a => a.username.toLowerCase() === username.toLowerCase());
      if (exists) {
        alert(`Le compte « ${username} » existe déjà. Vous pouvez vous connecter.`);
        document.getElementById("btn-switch-to-login")?.click();
        const input = document.getElementById("lock-username-input");
        if (input) input.value = username;
        return;
      }

      const newAccount = {
        id: "acc_" + Date.now(),
        username: username,
        firstName: fn,
        lastName: ln,
        birthDay: parseInt(bd, 10),
        role: "Membre",
        createdAt: new Date().toLocaleDateString("fr-FR")
      };

      store.data.accounts.push(newAccount);
      store.save();
      this.pushSyncToCloud();

      // Automatically login
      store.data.currentUser = newAccount;
      store.save();
      const lockScreen = document.getElementById("lock-screen-overlay");
      if (lockScreen) lockScreen.classList.add("hidden");
      this.renderAll();
      this.showToast(`Bienvenue ${fn} ! Votre identifiant est ${username}`);
    });

    // Login Form Submit
    document.getElementById("form-lock-login")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = document.getElementById("lock-username-input").value.trim().toLowerCase();
      this.loginWithUsername(input);
    });

    // Create Account Form Submit
    document.getElementById("form-create-account")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleCreateAccount();
    });

    // Realtime Account preview when typing
    const fnameInput = document.getElementById("acc-fname-input");
    const lnameInput = document.getElementById("acc-lname-input");
    const bdayInput = document.getElementById("acc-bday-input");
    const previewBox = document.getElementById("acc-preview-username");

    const updatePreview = () => {
      if (!previewBox) return;
      const fn = fnameInput?.value || "";
      const ln = lnameInput?.value || "";
      const bd = bdayInput?.value || "";
      const code = generateUsername(fn, ln, bd);
      previewBox.textContent = code ? code : "jdupont12";
    };

    fnameInput?.addEventListener("input", updatePreview);
    lnameInput?.addEventListener("input", updatePreview);
    bdayInput?.addEventListener("input", updatePreview);

    // Logout Button
    document.getElementById("btn-user-logout")?.addEventListener("click", () => {
      this.logout();
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

    // New Folder Form
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

    // Add Event Form
    document.getElementById("form-add-event")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveEventFromModal();
    });

    // Add Note Form
    document.getElementById("form-add-note")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveNoteFromModal();
    });

    // Settings Form
    document.getElementById("form-settings")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveSettings();
    });

    // Calendar Export / Import
    document.getElementById("btn-export-ics")?.addEventListener("click", () => this.exportICS());
    const calImportPicker = document.getElementById("cal-import-picker");
    document.getElementById("btn-import-ics")?.addEventListener("click", () => calImportPicker?.click());
    calImportPicker?.addEventListener("change", (e) => {
      if (e.target.files.length > 0) this.importICS(e.target.files[0]);
    });

    // Notes Export / Import
    document.getElementById("btn-export-notes")?.addEventListener("click", () => this.exportNotes());
    const notesImportPicker = document.getElementById("notes-import-picker");
    document.getElementById("btn-import-notes")?.addEventListener("click", () => notesImportPicker?.click());
    notesImportPicker?.addEventListener("change", (e) => {
      if (e.target.files.length > 0) this.importNotes(e.target.files[0]);
    });

    // Export current folder as ZIP
    document.getElementById("btn-export-folder-zip")?.addEventListener("click", () => this.exportCurrentFolderZip());
  },

  /* ==========================================
     AUTHENTICATION & ACCOUNT MANAGEMENT
     ========================================== */
  checkAuthStatus() {
    const lockScreen = document.getElementById("lock-screen-overlay");
    if (!store.data.currentUser) {
      if (lockScreen) lockScreen.classList.remove("hidden");
    } else {
      if (lockScreen) lockScreen.classList.add("hidden");
      this.renderAll();
    }
  },

  loginWithUsername(username) {
    if (!username) return;
    const account = store.data.accounts.find(a => a.username.toLowerCase() === username.toLowerCase());
    if (account) {
      store.data.currentUser = account;
      store.save();
      const lockScreen = document.getElementById("lock-screen-overlay");
      if (lockScreen) lockScreen.classList.add("hidden");
      this.renderAll();
      this.showToast(`Bienvenue ${account.firstName} ${account.lastName}`);
    } else {
      alert(`Identifiant « ${username} » introuvable.\n\nLe format requis est : première lettre du prénom + nom de famille + jour de naissance (par exemple : jdupont12).`);
    }
  },

  logout() {
    store.data.currentUser = null;
    store.save();
    document.getElementById("btn-switch-to-login")?.click();
    const lockScreen = document.getElementById("lock-screen-overlay");
    if (lockScreen) lockScreen.classList.remove("hidden");
    const input = document.getElementById("lock-username-input");
    if (input) {
      input.value = "";
      input.focus();
    }
  },

  handleCreateAccount() {
    const firstName = document.getElementById("acc-fname-input").value.trim();
    const lastName = document.getElementById("acc-lname-input").value.trim();
    const birthDay = document.getElementById("acc-bday-input").value.trim();
    const role = document.getElementById("acc-role-input").value;

    const username = generateUsername(firstName, lastName, birthDay);

    if (!username) {
      alert("Veuillez renseigner le prénom, le nom et le jour de naissance.");
      return;
    }

    const exists = store.data.accounts.some(a => a.username === username);
    if (exists) {
      alert(`Un compte avec l'identifiant ${username} existe déjà.`);
      return;
    }

    const newAccount = {
      id: "acc_" + Date.now(),
      username: username,
      firstName: firstName,
      lastName: lastName,
      birthDay: parseInt(birthDay, 10),
      role: role,
      createdAt: new Date().toLocaleDateString("fr-FR")
    };

    store.data.accounts.push(newAccount);
    store.save();
    this.pushSyncToCloud();

    this.closeModal("modal-create-account");
    this.renderAccountsList();
    this.showToast(`Compte « ${username} » créé avec succès !`);

    // If currently locked, auto-fill login input
    const lockInput = document.getElementById("lock-username-input");
    if (lockInput) {
      lockInput.value = username;
    }
  },

  isAdmin() {
    return store.data.currentUser && (store.data.currentUser.role === "Administrateur" || store.data.currentUser.username === "vdoussot19");
  },

  revokeAccount(accountId) {
    if (!this.isAdmin()) {
      alert("Seul l'administrateur a le pouvoir de révoquer un compte.");
      return;
    }

    const account = store.data.accounts.find(a => a.id === accountId);
    if (!account) return;

    if (store.data.currentUser && store.data.currentUser.id === accountId) {
      alert("Vous ne pouvez pas révoquer votre propre compte administrateur.");
      return;
    }

    if (confirm(`Confirmez-vous la révocation du compte de « ${account.firstName} ${account.lastName} » (${account.username}) ? Cette personne ne pourra plus accéder à MDC-Conect.`)) {
      store.data.accounts = store.data.accounts.filter(a => a.id !== accountId);
      store.save();
      this.pushSyncToCloud();
      this.renderAccountsList();
      this.showToast(`Compte « ${account.username} » révoqué avec succès`);
    }
  },

  renderAccountsList() {
    const container = document.getElementById("accounts-list-container");
    if (!container) return;

    const isAdmin = this.isAdmin();

    container.innerHTML = store.data.accounts.map(acc => {
      const initials = (acc.firstName.charAt(0) + acc.lastName.charAt(0)).toUpperCase();
      const isCurrent = store.data.currentUser && store.data.currentUser.id === acc.id;

      return `
        <div class="account-row">
          <div class="account-col-main">
            <div class="account-avatar-circle">${initials}</div>
            <div class="account-details">
              <h4>${acc.firstName} ${acc.lastName} ${isCurrent ? '<span style="font-size:11px; color:var(--color-apple-blue); font-weight:normal;">(Vous)</span>' : ''}</h4>
              <div class="account-meta-line">
                <span class="account-code-pill">${acc.username}</span>
                <span>${acc.role}</span>
                <span>Créé le ${acc.createdAt}</span>
              </div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            ${isAdmin && !isCurrent ? `
              <button class="file-mini-btn btn-delete" onclick="App.revokeAccount('${acc.id}')" title="Révoquer l'accès de ce compte">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                <span>Révoquer l'accès</span>
              </button>
            ` : `
              <span class="sidebar-badge" style="color:var(--color-apple-green); font-size:11.5px;">Actif</span>
            `}
          </div>
        </div>
      `;
    }).join("");
  },

  /* ==========================================
     MDC CLOUD & GOOGLE DRIVE INTEGRATION (4TB)
     ========================================== */
  isCloudConnected: true,
  isGasConnected: false,

  async callCloud(action, payload = {}) {
    const cloudUrl = store.data.settings.cloudApiUrl || "https://extranet-cad.duckdns.org/mdc-api/";
    try {
      const response = await fetch(cloudUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload })
      });
      const data = await response.json();
      if (data && data.success) {
        this.isCloudConnected = true;
        this.updateGasStatusUI("connected");
      }
      return data;
    } catch (err) {
      console.warn("Cloud API error:", err);
      return null;
    }
  },

  async syncFromCloud() {
    const cloudUrl = store.data.settings.cloudApiUrl || "https://extranet-cad.duckdns.org/mdc-api/";
    try {
      const res = await fetch(cloudUrl + "syncAll");
      const data = await res.json();
      if (data && data.success) {
        this.isCloudConnected = true;
        this.updateGasStatusUI("connected");

        if (Array.isArray(data.folders)) {
          store.data.folders = data.folders;
        }
        if (Array.isArray(data.files)) {
          // Conserver les dataUrl locales si présentes
          const localCache = new Map();
          store.data.files.forEach(f => {
            if (f.url && f.url.startsWith("data:")) {
              localCache.set(f.id, f.url);
            }
          });
          store.data.files = data.files.map(df => {
            if (localCache.has(df.id)) {
              df.url = localCache.get(df.id);
            }
            return df;
          });
        }
        if (Array.isArray(data.events)) {
          store.data.events = data.events;
        }
        if (Array.isArray(data.notes)) {
          store.data.notes = data.notes;
        }
        if (Array.isArray(data.tasks)) {
          store.data.tasks = data.tasks;
        }
        if (Array.isArray(data.accounts) && data.accounts.length > 0) {
          const existingUsernames = new Set(data.accounts.map(a => a.username.toLowerCase()));
          const admin = store.data.accounts.find(a => a.username === "vdoussot19");
          if (admin && !existingUsernames.has("vdoussot19")) {
            data.accounts.unshift(admin);
          }
          store.data.accounts = data.accounts;
        }
        store.save();
        this.renderFolders();
        this.renderDriveFiles();
        this.renderCalendar();
        this.renderTasksAndNotes();
        this.renderAccountsList();
      }
    } catch (e) {
      console.warn("Erreur synchronisation cloud:", e);
    }

    // Synchronisation secondaire Google Apps Script
    this.syncFromGAS();
  },

  async pushSyncToCloud() {
    await this.callCloud("saveSyncData", {
      events: store.data.events,
      notes: store.data.notes,
      tasks: store.data.tasks,
      accounts: store.data.accounts
    });
    this.pushSyncToGAS();
  },

  async callGAS(action, payload = {}) {
    const url = store.data.settings.gasWebappUrl;
    if (!url) return null;

    try {
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify({ action, ...payload })
      });
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        if (data && data.success) {
          this.isGasConnected = true;
        }
        return data;
      } catch (_) {
        return null;
      }
    } catch (netErr) {
      return null;
    }
  },

  updateGasStatusUI(status) {
    const badge = document.getElementById("gdrive-status-badge");
    const text = document.getElementById("gdrive-status-text");
    if (!badge || !text) return;

    if (status === "connected" || this.isCloudConnected) {
      badge.classList.add("connected");
      text.textContent = "Cloud 4 To · Synchronisé en direct";
      badge.title = "Cloud 4 To actif. Fichiers et données partagés en temps réel sur tous les appareils.";
    } else {
      badge.classList.remove("connected");
      text.textContent = "Cloud 4 To · Connexion...";
      badge.title = "Cliquez pour forcer la synchronisation.";
    }
  },

  async checkGasConnection(showToastMessage = false) {
    if (showToastMessage) {
      this.showToast("Synchronisation en cours avec le Cloud 4 To...");
    }
    await this.syncFromCloud();
    if (showToastMessage) {
      this.showToast("Cloud 4 To synchronisé avec succès");
    }
  },

  async syncFromGAS() {
    const url = store.data.settings.gasWebappUrl;
    if (!url) return;

    try {
      const res = await fetch(url + "?action=syncAll", { mode: "cors" });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data && data.success) {
          this.isGasConnected = true;
          // Fusion des fichiers de Google Drive avec le cloud
          if (Array.isArray(data.files) && data.files.length > 0) {
            const existingIds = new Set(store.data.files.map(f => f.id));
            data.files.forEach(df => {
              if (!existingIds.has(df.id)) {
                store.data.files.push(df);
              }
            });
            store.save();
            this.renderDriveFiles();
          }
        }
      } catch (_) {}
    } catch (_) {}
  },

  async pushSyncToGAS() {
    const url = store.data.settings.gasWebappUrl;
    if (!url) return;

    try {
      await fetch(url, {
        method: "POST",
        body: JSON.stringify({
          action: "saveSyncData",
          events: store.data.events,
          notes: store.data.notes,
          tasks: store.data.tasks,
          accounts: store.data.accounts
        })
      });
    } catch (_) {}
  },

  /* ==========================================
     THEME & NAVIGATION
     ========================================== */
  applyTheme() {
    const saved = localStorage.getItem("mdc_theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
    this.updateThemeIcon(saved);
  },

  updateThemeIcon(theme) {
    const btn = document.getElementById("btn-toggle-theme");
    if (!btn) return;
    const logoImg = document.getElementById("app-header-logo");
    const lockLogo = document.getElementById("lock-screen-logo");
    if (theme === "dark") {
      btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>`;
      if (logoImg) logoImg.src = "assets/logo-dark.png";
      if (lockLogo) lockLogo.src = "assets/logo-dark.png";
    } else {
      btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>`;
      if (logoImg) logoImg.src = "assets/logo.jpg";
      if (lockLogo) lockLogo.src = "assets/logo.jpg";
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
    this.renderAccountsList();
    this.renderSettingsValues();
  },

  renderUserProfile() {
    const user = store.data.currentUser;
    const nameLabel = document.getElementById("user-name-display");
    const avatarBox = document.getElementById("user-avatar-display");
    const statusText = document.getElementById("status-text");

    if (user) {
      if (nameLabel) nameLabel.textContent = `${user.firstName} ${user.lastName}`;
      if (avatarBox) {
        avatarBox.textContent = (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
      }
      if (statusText) statusText.textContent = user.username;
    } else {
      if (nameLabel) nameLabel.textContent = "Non connecté";
      if (avatarBox) avatarBox.textContent = "--";
      if (statusText) statusText.textContent = "Déconnecté";
    }
  },

  /* ==========================================
     MODULE 1: FOLDERS & FILES (4 TO VIRGIN)
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

  async createFolder(name) {
    const parentFolder = this.getCurrentFolder();
    const tempId = "fld_" + Date.now();
    const newFolder = {
      id: tempId,
      name: name,
      parentId: parentFolder.id || "root"
    };
    store.data.folders.push(newFolder);
    store.save();
    this.renderFolders();
    this.renderDriveBreadcrumbs();
    this.showToast(`Dossier « ${name} » créé`);

    // Synchronisation vers le Cloud MDC
    const cloudRes = await this.callCloud("createFolder", {
      folderName: name,
      folderId: parentFolder.id || "root"
    });
    if (cloudRes && cloudRes.success && cloudRes.folder) {
      newFolder.id = cloudRes.folder.id;
      store.save();
      this.renderFolders();
    }
    this.callGAS("createFolder", {
      folderName: name,
      folderId: parentFolder.id || "root"
    });
  },

  async deleteFolder(folderId, e) {
    if (e) e.stopPropagation();
    const folder = store.data.folders.find(f => f.id === folderId);
    if (!folder) return;
    if (confirm(`Confirmez-vous la suppression du dossier « ${folder.name} » et de son contenu ?`)) {
      store.data.folders = store.data.folders.filter(f => f.id !== folderId);
      store.data.files = store.data.files.filter(f => f.folderId !== folderId);
      store.save();
      this.renderFolders();
      this.renderDriveFiles();
      this.showToast("Dossier supprimé");

      await this.callCloud("deleteFolder", { folderId });
      this.callGAS("deleteFolder", { folderId });
    }
  },

  renderDriveBreadcrumbs() {
    const trail = document.getElementById("drive-breadcrumb-trail");
    if (!trail) return;

    const current = this.getCurrentFolder();
    let html = `<span class="breadcrumb-item" onclick="App.navigateToFolder('root')">MDC Cloud 4 To</span>`;
    if (current.id !== "root") {
      html += ` <span class="breadcrumb-sep">/</span> <span style="font-weight:600; color:var(--color-text-primary);">${this.escapeHTML(current.name)}</span>`;
    }
    trail.innerHTML = html;
  },

  renderFolders() {
    const container = document.getElementById("folders-grid-container");
    const wrapper = document.getElementById("folders-wrapper");
    if (!container) return;

    const currentId = store.data.currentFolderId || "root";
    const subfolders = store.data.folders.filter(f => f.parentId === currentId);

    if (subfolders.length === 0) {
      container.innerHTML = "";
      if (wrapper) wrapper.style.display = "none";
      return;
    }

    if (wrapper) wrapper.style.display = "block";
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
              <span class="folder-card-count">${fileCount} élément${fileCount > 1 ? 's' : ''}</span>
            </div>
          </div>
          <button class="folder-delete-btn" onclick="App.deleteFolder('${folder.id}', event)" title="Supprimer">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      `;
    }).join("");
  },

  renderDriveFiles() {
    this.updateGasStatusUI(this.isGasConnected ? "connected" : "pending");
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
        <div class="virgin-state-box">
          <svg class="virgin-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <div class="virgin-state-title">Aucun document dans ce dossier</div>
          <div class="virgin-state-desc">Déposez vos fichiers par glisser-déposer ou cliquez sur « Importer un fichier ».</div>
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
      return `<svg class="file-card-icon" style="color:var(--color-apple-green);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>`;
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

  async openFileViewer(fileId) {
    const file = store.data.files.find(f => f.id === fileId);
    if (!file) return;

    document.getElementById("modal-file-title").textContent = file.name;
    document.getElementById("modal-file-author").textContent = `Dossier : ${this.getCurrentFolder().name} · ${file.author || 'MDC'} · ${file.date} · ${file.size}`;
    
    const container = document.getElementById("file-viewer-container");
    const downloadBtn = document.getElementById("btn-download-file");
    if (downloadBtn) {
      downloadBtn.onclick = () => this.downloadSingleFile(file.id);
    }

    const openGdriveBtn = document.getElementById("btn-open-gdrive");
    if (openGdriveBtn) {
      if (file.webUrl) {
        openGdriveBtn.style.display = "inline-flex";
        openGdriveBtn.onclick = () => window.open(file.webUrl, "_blank");
      } else if (file.driveFileId) {
        openGdriveBtn.style.display = "inline-flex";
        openGdriveBtn.onclick = () => window.open("https://drive.google.com/file/d/" + file.driveFileId + "/view", "_blank");
      } else {
        openGdriveBtn.style.display = "none";
      }
    }

    this.openModal("modal-file-viewer");

    const ext = (file.name.split('.').pop() || "").toLowerCase();
    const drivePreviewUrl = file.googlePreviewUrl || (file.url && file.url.startsWith("https://drive.google.com") ? file.url : (file.driveFileId ? `https://drive.google.com/file/d/${file.driveFileId}/preview` : null));

    if (file.type === "image") {
      container.innerHTML = `<img src="${file.url || 'assets/logo.jpg'}" alt="${file.name}">`;
    } else if (file.type === "video") {
      container.innerHTML = `<video controls class="apple-video-player" src="${file.url || ''}"><p>Aperçu vidéo</p></video>`;
    } else if (file.type === "audio") {
      container.innerHTML = `<audio controls class="apple-audio-player" src="${file.url || ''}"></audio>`;
    } else if (file.type === "pdf") {
      if (file.url && file.url.startsWith("data:")) {
        container.innerHTML = `<iframe src="${file.url}" style="width:100%; height:540px; border:none; border-radius:12px; background:#fff;"></iframe>`;
      } else if (drivePreviewUrl) {
        container.innerHTML = `<iframe src="${drivePreviewUrl}" style="width:100%; height:540px; border:none; border-radius:12px; background:#fff;"></iframe>`;
      } else {
        container.innerHTML = this.renderDocumentFallbackCard(file, "Document PDF");
      }
    } else if (ext === "docx") {
      container.innerHTML = `
        <div style="text-align:center; padding:48px 20px; color:var(--color-text-secondary);">
          <div class="apple-spinner" style="margin:0 auto 16px;"></div>
          <p style="font-size:14px; font-weight:500;">Lecture et mise en page du document Word...</p>
        </div>
      `;
      try {
        const rendered = await this.renderDocxPreview(file);
        container.innerHTML = rendered;
      } catch (err) {
        console.error("Erreur lecture DOCX:", err);
        if (drivePreviewUrl) {
          container.innerHTML = `<iframe src="${drivePreviewUrl}" style="width:100%; height:540px; border:none; border-radius:12px; background:#fff;"></iframe>`;
        } else {
          container.innerHTML = this.renderDocumentFallbackCard(file, "Document Microsoft Word (.docx)");
        }
      }
    } else if (ext === "xlsx" || ext === "xls") {
      try {
        const rendered = await this.renderXlsxPreview(file);
        container.innerHTML = rendered;
      } catch (err) {
        if (drivePreviewUrl) {
          container.innerHTML = `<iframe src="${drivePreviewUrl}" style="width:100%; height:540px; border:none; border-radius:12px; background:#fff;"></iframe>`;
        } else {
          container.innerHTML = this.renderDocumentFallbackCard(file, "Feuille de calcul Excel (.xlsx)");
        }
      }
    } else if (file.type === "spreadsheet" && file.content && (file.content.includes("\t") || file.content.includes(","))) {
      container.innerHTML = this.renderCsvPreview(file.content);
    } else if (drivePreviewUrl && (!file.url || !file.url.startsWith("data:"))) {
      container.innerHTML = `<iframe src="${drivePreviewUrl}" style="width:100%; height:540px; border:none; border-radius:12px; background:#fff;"></iframe>`;
    } else if (file.content && !file.content.startsWith("PK")) {
      container.innerHTML = `<div class="text-viewer-box">${this.escapeHTML(file.content)}</div>`;
    } else {
      container.innerHTML = this.renderDocumentFallbackCard(file, ext ? ext.toUpperCase() : "DOCUMENT");
    }
  },

  async renderDocxPreview(file) {
    if (typeof JSZip === "undefined") {
      return this.renderDocumentFallbackCard(file, "Document Microsoft Word (.docx)");
    }

    let zip;
    if (file.url && file.url.startsWith("http")) {
      const res = await fetch(file.url);
      const arrayBuffer = await res.arrayBuffer();
      zip = await JSZip.loadAsync(arrayBuffer);
    } else if (file.url && file.url.includes("base64,")) {
      const base64Data = file.url.split("base64,")[1];
      zip = await JSZip.loadAsync(base64Data, { base64: true });
    } else if (file.content && file.content.startsWith("PK")) {
      try {
        const bytes = new Uint8Array(file.content.length);
        for (let i = 0; i < file.content.length; i++) {
          bytes[i] = file.content.charCodeAt(i) & 0xff;
        }
        zip = await JSZip.loadAsync(bytes);
      } catch (_) {
        return this.renderDocumentFallbackCard(file, "Document Microsoft Word (.docx)");
      }
    } else {
      return this.renderDocumentFallbackCard(file, "Document Microsoft Word (.docx)");
    }

    // Extract embedded images from word/media/
    const imageMap = {};
    const mediaFiles = Object.keys(zip.files).filter(k => k.startsWith("word/media/"));
    for (const imgPath of mediaFiles) {
      try {
        const ext = imgPath.split('.').pop().toLowerCase();
        const mime = (ext === "jpg" || ext === "jpeg") ? "image/jpeg" : (ext === "gif") ? "image/gif" : "image/png";
        const imgB64 = await zip.file(imgPath).async("base64");
        imageMap[imgPath] = `data:${mime};base64,${imgB64}`;
        const filename = imgPath.split("/").pop();
        imageMap[filename] = `data:${mime};base64,${imgB64}`;
      } catch (_) {}
    }

    // Map relationships in word/_rels/document.xml.rels
    const relsMap = {};
    if (zip.file("word/_rels/document.xml.rels")) {
      try {
        const relsXml = await zip.file("word/_rels/document.xml.rels").async("string");
        const parser = new DOMParser();
        const relsDoc = parser.parseFromString(relsXml, "text/xml");
        const relNodes = Array.from(relsDoc.getElementsByTagName("Relationship"));
        relNodes.forEach(node => {
          const id = node.getAttribute("Id");
          const target = node.getAttribute("Target");
          if (id && target) {
            const filename = target.split("/").pop();
            if (imageMap[filename]) {
              relsMap[id] = imageMap[filename];
            } else if (imageMap["word/" + target]) {
              relsMap[id] = imageMap["word/" + target];
            }
          }
        });
      } catch (_) {}
    }

    const docXmlFile = zip.file("word/document.xml");
    if (!docXmlFile) {
      return this.renderDocumentFallbackCard(file, "Document Word (.docx)");
    }

    const docXmlStr = await docXmlFile.async("string");
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXmlStr, "text/xml");
    const body = xmlDoc.getElementsByTagName("w:body")[0];
    if (!body) {
      return this.renderDocumentFallbackCard(file, "Document Word (.docx)");
    }

    let docHtml = "";
    const children = Array.from(body.children);

    for (const child of children) {
      if (child.nodeName === "w:p") {
        let pText = "";
        const runs = Array.from(child.getElementsByTagName("w:r"));
        
        // Embedded images in this paragraph
        const blips = Array.from(child.getElementsByTagName("a:blip"));
        let pImagesHtml = "";
        blips.forEach(blip => {
          const embedId = blip.getAttribute("r:embed");
          if (embedId && relsMap[embedId]) {
            pImagesHtml += `<div class="doc-embedded-img-box"><img src="${relsMap[embedId]}" alt="Image du document" class="doc-embedded-img"></div>`;
          }
        });

        runs.forEach(run => {
          const isBold = run.getElementsByTagName("w:b").length > 0;
          const isItalic = run.getElementsByTagName("w:i").length > 0;
          const isUnderline = run.getElementsByTagName("w:u").length > 0;
          
          const textNodes = Array.from(run.getElementsByTagName("w:t"));
          let runText = textNodes.map(t => t.textContent).join("");
          if (runText) {
            runText = this.escapeHTML(runText);
            if (isBold) runText = `<strong>${runText}</strong>`;
            if (isItalic) runText = `<em>${runText}</em>`;
            if (isUnderline) runText = `<u>${runText}</u>`;
            pText += runText;
          }
        });

        const pPr = child.getElementsByTagName("w:pPr")[0];
        const pStyle = pPr ? pPr.getElementsByTagName("w:pStyle")[0]?.getAttribute("w:val") : "";

        if (pImagesHtml) {
          docHtml += pImagesHtml;
        }

        if (pText.trim()) {
          if (pStyle && (pStyle.toLowerCase().includes("heading1") || pStyle.toLowerCase().includes("titre1"))) {
            docHtml += `<h2 class="apple-doc-h2">${pText}</h2>`;
          } else if (pStyle && (pStyle.toLowerCase().includes("heading2") || pStyle.toLowerCase().includes("titre2"))) {
            docHtml += `<h3 class="apple-doc-h3">${pText}</h3>`;
          } else {
            docHtml += `<p class="apple-doc-p">${pText}</p>`;
          }
        }
      } else if (child.nodeName === "w:tbl") {
        docHtml += `<div class="apple-table-wrap"><table class="apple-table"><tbody>`;
        const rows = Array.from(child.getElementsByTagName("w:tr"));
        rows.forEach(tr => {
          docHtml += `<tr>`;
          const cells = Array.from(tr.getElementsByTagName("w:tc"));
          cells.forEach(tc => {
            const tcTexts = Array.from(tc.getElementsByTagName("w:t")).map(t => t.textContent).join(" ");
            docHtml += `<td>${this.escapeHTML(tcTexts.trim())}</td>`;
          });
          docHtml += `</tr>`;
        });
        docHtml += `</tbody></table></div>`;
      }
    }

    if (Object.keys(imageMap).length > 0 && !docHtml.includes("doc-embedded-img")) {
      docHtml += `
        <div class="doc-media-section">
          <div class="doc-media-section-title">Illustrations et captures contenues dans ce document :</div>
          <div class="doc-media-grid">
            ${Object.values(imageMap).map(imgUrl => `
              <div class="doc-embedded-img-box">
                <img src="${imgUrl}" alt="Illustration Word" class="doc-embedded-img">
              </div>
            `).join("")}
          </div>
        </div>
      `;
    }

    if (!docHtml.trim()) {
      docHtml = `<p class="apple-doc-empty">Ce document Word ne contient pas de texte extrait.</p>`;
    }

    return `
      <div class="apple-doc-sheet">
        <div class="apple-doc-sheet-header">
          <div class="apple-doc-badge">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span>Microsoft Word · Document officiel MDC</span>
          </div>
          <span style="font-size:12px; color:var(--color-text-tertiary);">${file.size}</span>
        </div>
        <div class="apple-doc-content">
          ${docHtml}
        </div>
      </div>
    `;
  },

  async renderXlsxPreview(file) {
    if (typeof JSZip === "undefined") {
      return this.renderDocumentFallbackCard(file, "Feuille de calcul Excel (.xlsx)");
    }
    let zip;
    if (file.url && file.url.startsWith("http")) {
      const res = await fetch(file.url);
      const arrayBuffer = await res.arrayBuffer();
      zip = await JSZip.loadAsync(arrayBuffer);
    } else if (file.url && file.url.includes("base64,")) {
      const base64Data = file.url.split("base64,")[1];
      zip = await JSZip.loadAsync(base64Data, { base64: true });
    } else {
      return this.renderDocumentFallbackCard(file, "Feuille de calcul Excel (.xlsx)");
    }
    
    const sharedStringsFile = zip.file("xl/sharedStrings.xml");
    const sheet1File = zip.file("xl/worksheets/sheet1.xml");

    if (!sheet1File) {
      return this.renderDocumentFallbackCard(file, "Feuille de calcul Excel (.xlsx)");
    }

    const sharedStrings = [];
    if (sharedStringsFile) {
      const ssXml = await sharedStringsFile.async("string");
      const parser = new DOMParser();
      const ssDoc = parser.parseFromString(ssXml, "text/xml");
      const siNodes = Array.from(ssDoc.getElementsByTagName("si"));
      siNodes.forEach(si => {
        const text = Array.from(si.getElementsByTagName("t")).map(t => t.textContent).join("");
        sharedStrings.push(text);
      });
    }

    const sheetXml = await sheet1File.async("string");
    const parser = new DOMParser();
    const sheetDoc = parser.parseFromString(sheetXml, "text/xml");
    const rows = Array.from(sheetDoc.getElementsByTagName("row"));

    if (rows.length === 0) {
      return this.renderDocumentFallbackCard(file, "Feuille de calcul Excel (.xlsx)");
    }

    let html = `<div class="apple-table-wrap" style="max-height:480px; overflow:auto;"><table class="apple-table"><tbody>`;
    rows.forEach(row => {
      html += `<tr>`;
      const cells = Array.from(row.getElementsByTagName("c"));
      cells.forEach(c => {
        const t = c.getAttribute("t");
        const v = c.getElementsByTagName("v")[0]?.textContent || "";
        let cellVal = v;
        if (t === "s" && sharedStrings[parseInt(v, 10)] !== undefined) {
          cellVal = sharedStrings[parseInt(v, 10)];
        }
        html += `<td>${this.escapeHTML(cellVal)}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
  },

  renderCsvPreview(content) {
    const delimiter = content.includes("\t") ? "\t" : ",";
    const lines = content.split("\n").filter(l => l.trim().length > 0);
    if (lines.length === 0) return `<p style="padding:24px; text-align:center; color:var(--color-text-tertiary);">Fichier tabulaire vide.</p>`;
    
    const headers = lines[0].split(delimiter);
    let html = `<div class="apple-table-wrap" style="max-height:480px; overflow:auto;"><table class="apple-table"><thead><tr>`;
    headers.forEach(h => html += `<th>${this.escapeHTML(h.trim().replace(/^"|"$/g, ""))}</th>`);
    html += `</tr></thead><tbody>`;

    lines.slice(1).forEach(row => {
      html += `<tr>`;
      row.split(delimiter).forEach(cell => {
        html += `<td>${this.escapeHTML(cell.trim().replace(/^"|"$/g, ""))}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
  },

  renderDocumentFallbackCard(file, label) {
    const ext = (file.name.split('.').pop() || "").toUpperCase();
    return `
      <div class="apple-doc-fallback-card">
        <div class="apple-doc-fallback-icon">
          <svg width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span class="apple-doc-fallback-ext">${ext}</span>
        </div>
        <h3 class="apple-doc-fallback-title">${this.escapeHTML(file.name)}</h3>
        <p class="apple-doc-fallback-meta">${label || 'Document confiné'} · ${file.size} · Ajouté par ${file.author || 'MDC'}</p>
        <p class="apple-doc-fallback-desc">Ce fichier est stocké de manière sécurisée et confinée sur MDC-Conect. Vous pouvez l'exporter ou l'ouvrir directement dans son application dédiée.</p>
        <div class="apple-doc-fallback-actions">
          <button class="apple-btn btn-primary" onclick="App.downloadSingleFile('${file.id}')">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Télécharger / Ouvrir ${ext}</span>
          </button>
        </div>
      </div>
    `;
  },

  downloadSingleFile(fileId, e) {
    if (e) e.stopPropagation();
    const file = store.data.files.find(f => f.id === fileId);
    if (!file) return;

    if (file.downloadUrl) {
      window.open(file.downloadUrl, "_blank");
    } else if (file.driveFileId) {
      window.open("https://drive.google.com/uc?export=download&id=" + file.driveFileId, "_blank");
    } else if (file.url && file.url.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = file.url;
      a.download = file.name;
      a.click();
    } else if (file.webUrl) {
      window.open(file.webUrl, "_blank");
    } else {
      const blob = new Blob([file.content || file.name], { type: "application/octet-stream;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
    }
    this.showToast(`Téléchargement de « ${file.name} » lancé`);
  },

  async deleteFile(fileId, e) {
    if (e) e.stopPropagation();
    const file = store.data.files.find(f => f.id === fileId);
    if (!file) return;
    if (confirm(`Confirmez-vous la suppression du fichier « ${file.name} » ?`)) {
      const driveId = file.driveFileId || file.id;
      store.data.files = store.data.files.filter(f => f.id !== fileId);
      store.save();
      this.renderDriveFiles();
      this.renderFolders();
      this.showToast("Fichier supprimé");

      await this.callCloud("deleteFile", { fileId });
      this.callGAS("deleteFile", { fileId: driveId });
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
    this.showToast(`Dossier « ${currentFolder.name} » exporté en ZIP`);
  },

  handleFileUpload(fileObj) {
    const ext = (fileObj.name.split('.').pop() || "").toLowerCase();
    let type = "document";
    let cat = "documents";

    if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) {
      type = "image";
      cat = "images";
    } else if (["mp4", "mov", "webm", "avi", "mkv"].includes(ext)) {
      type = "video";
      cat = "images";
    } else if (["mp3", "wav", "ogg", "m4a", "aac"].includes(ext)) {
      type = "audio";
      cat = "images";
    } else if (["xls", "xlsx", "csv", "tsv", "numbers"].includes(ext)) {
      type = "spreadsheet";
      cat = "spreadsheets";
    } else if (ext === "pdf") {
      type = "pdf";
      cat = "documents";
    } else if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
      type = "archive";
      cat = "documents";
    } else if (["docx", "doc", "pages", "odt", "rtf"].includes(ext)) {
      type = "document";
      cat = "documents";
    } else if (["pptx", "ppt", "key"].includes(ext)) {
      type = "presentation";
      cat = "documents";
    }

    const currentFolder = this.getCurrentFolder();
    const currentFolderId = currentFolder.id || "root";
    const authorName = store.data.currentUser ? `${store.data.currentUser.firstName} ${store.data.currentUser.lastName.charAt(0)}.` : "Membre MDC";

    this.showToast(`Envoi de « ${fileObj.name} » vers Google Drive (4 To)...`);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      const base64Data = dataUrl.includes("base64,") ? dataUrl.split("base64,")[1] : "";

      const tempId = "f_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
      const newFile = {
        id: tempId,
        driveFileId: null,
        folderId: currentFolderId,
        name: fileObj.name,
        type: type,
        size: (fileObj.size / (1024 * 1024)).toFixed(2) + " Mo",
        date: new Date().toLocaleDateString("fr-FR"),
        category: cat,
        author: authorName,
        url: dataUrl,
        downloadUrl: null,
        webUrl: null,
        googlePreviewUrl: null,
        content: ""
      };

      store.data.files.unshift(newFile);
      store.save();
      this.renderDriveFiles();
      this.renderFolders();

      // 1. Envoi direct vers le Cloud MDC (persistance garantie tous navigateurs)
      try {
        const cloudRes = await this.callCloud("upload", {
          fileName: fileObj.name,
          mimeType: fileObj.type || "application/octet-stream",
          base64: base64Data,
          folderId: currentFolderId,
          author: authorName
        });

        if (cloudRes && cloudRes.success && cloudRes.file) {
          const idx = store.data.files.findIndex(f => f.id === tempId);
          if (idx !== -1) {
            store.data.files[idx].id = cloudRes.file.id;
            store.data.files[idx].url = cloudRes.file.url;
            store.data.files[idx].downloadUrl = cloudRes.file.downloadUrl;
            store.data.files[idx].webUrl = cloudRes.file.webUrl;
            store.save();
            this.renderDriveFiles();
          }
          this.showToast(`« ${fileObj.name} » stocké dans le Cloud MDC 4 To`);
        }
      } catch (err) {
        console.warn("Échec téléversement Cloud:", err);
      }

      // 2. Synchronisation miroir vers Google Drive
      this.callGAS("upload", {
        fileName: fileObj.name,
        mimeType: fileObj.type || "application/octet-stream",
        base64: base64Data,
        folderId: currentFolderId,
        author: authorName
      });
    };
    reader.readAsDataURL(fileObj);
  },

  /* ==========================================
     MODULE 2: CALENDRIER (VIRGIN)
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
      if (store.data.events.length === 0) {
        upcomingList.innerHTML = `
          <div style="text-align:center; padding:24px 10px; color:var(--color-text-tertiary); font-size:13px;">
            Aucun événement programmé
          </div>
        `;
      } else {
        const sorted = [...store.data.events].sort((a, b) => new Date(a.date) - new Date(b.date));
        upcomingList.innerHTML = sorted.slice(0, 6).map(ev => {
          const d = new Date(ev.date);
          const dayNum = isNaN(d.getDate()) ? "" : d.getDate();
          const monthShort = isNaN(d.getMonth()) ? "" : monthNames[d.getMonth()].substring(0, 3).toUpperCase();

          return `
            <div class="event-item" onclick="App.showEventDetail('${ev.id}')">
              <div class="event-date-badge">
                <span class="event-badge-month">${monthShort}</span>
                <span class="event-badge-day">${dayNum}</span>
              </div>
              <div class="event-info">
                <h4>${ev.title}</h4>
                <p>${ev.time || 'Horaire non précisé'} · ${ev.location || 'Lieu non précisé'}</p>
              </div>
            </div>
          `;
        }).join("");
      }
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
    this.pushSyncToCloud();
    this.closeModal("modal-add-event");
    this.renderCalendar();
    this.showToast("Événement programmé");
  },

  showEventDetail(id) {
    const ev = store.data.events.find(e => e.id === id);
    if (!ev) return;
    if (confirm(`Événement MDC :\n\n${ev.title}\nDate : ${ev.date} (${ev.time})\nLieu : ${ev.location}\nDescription : ${ev.description || "Aucune"}\n\nVoulez-vous supprimer cet événement ?`)) {
      store.data.events = store.data.events.filter(e => e.id !== id);
      store.save();
      this.pushSyncToCloud();
      this.renderCalendar();
      this.showToast("Événement supprimé");
    }
  },

  exportICS() {
    if (store.data.events.length === 0) {
      this.showToast("Aucun événement à exporter");
      return;
    }
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
    this.showToast("Export du calendrier (.ics) téléchargé");
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
      this.showToast(`${count} événement(s) importé(s)`);
    };
    reader.readAsText(fileObj);
  },

  /* ==========================================
     MODULE 3: NOTES & TÂCHES (VIRGIN)
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

      if (tasks.length === 0) {
        tasksContainer.innerHTML = `
          <div class="virgin-state-box" style="padding:32px 10px;">
            <svg class="virgin-state-icon" style="width:36px; height:36px;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            <div class="virgin-state-title" style="font-size:13.5px;">Aucune tâche en attente</div>
            <div class="virgin-state-desc" style="font-size:12px;">Saisissez un titre ci-dessus pour ajouter un rappel.</div>
          </div>
        `;
      } else {
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
    }

    // Notes
    if (notesContainer) {
      let notes = store.data.notes;
      if (this.searchQuery) {
        notes = notes.filter(n => n.title.toLowerCase().includes(this.searchQuery) || n.content.toLowerCase().includes(this.searchQuery));
      }

      if (notes.length === 0) {
        notesContainer.innerHTML = `
          <div class="virgin-state-box" style="padding:48px 10px;">
            <svg class="virgin-state-icon" style="width:36px; height:36px;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <div class="virgin-state-title" style="font-size:13.5px;">Aucune note enregistrée</div>
            <div class="virgin-state-desc" style="font-size:12px;">Cliquez sur « Nouvelle Note » pour rédiger un compte-rendu.</div>
          </div>
        `;
      } else {
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
    }
  },

  addTask(title) {
    const authorName = store.data.currentUser ? store.data.currentUser.firstName : "MDC";
    const newTask = {
      id: "t_" + Date.now(),
      title,
      completed: false,
      due: "À planifier",
      priority: "normal",
      author: authorName
    };
    store.data.tasks.unshift(newTask);
    store.save();
    this.pushSyncToCloud();
    this.renderTasksAndNotes();
    this.showToast("Tâche ajoutée");
  },

  toggleTask(id) {
    const task = store.data.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      store.save();
      this.pushSyncToCloud();
      this.renderTasksAndNotes();
    }
  },

  deleteTask(id) {
    store.data.tasks = store.data.tasks.filter(t => t.id !== id);
    store.save();
    this.pushSyncToCloud();
    this.renderTasksAndNotes();
    this.showToast("Tâche supprimée");
  },

  saveNoteFromModal() {
    const title = document.getElementById("note-title-input").value;
    const tag = document.getElementById("note-tag-input").value;
    const content = document.getElementById("note-content-input").value;
    const authorName = store.data.currentUser ? `${store.data.currentUser.firstName} ${store.data.currentUser.lastName.charAt(0)}.` : "MDC";

    const newNote = {
      id: "n_" + Date.now(),
      title,
      author: authorName,
      date: new Date().toLocaleDateString("fr-FR"),
      tag: tag || "Général",
      content
    };

    store.data.notes.unshift(newNote);
    store.save();
    this.pushSyncToCloud();
    this.closeModal("modal-add-note");
    this.renderTasksAndNotes();
    this.showToast("Note enregistrée");
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
      this.pushSyncToCloud();
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
    this.showToast(`Note « ${note.title} » exportée`);
  },

  async exportNotes() {
    if (typeof JSZip === "undefined") {
      this.showToast("Librairie ZIP en cours de chargement...");
      return;
    }
    if (store.data.notes.length === 0) {
      this.showToast("Aucune note à exporter");
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
    this.showToast("Notes exportées en archive ZIP");
  },

  importNotes(fileObj) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const title = fileObj.name.replace(/\.[^/.]+$/, "");
      const authorName = store.data.currentUser ? store.data.currentUser.firstName : "MDC";

      store.data.notes.unshift({
        id: "n_" + Date.now(),
        title: title,
        author: authorName,
        date: new Date().toLocaleDateString("fr-FR"),
        tag: "Document",
        content: text
      });
      store.save();
      this.renderTasksAndNotes();
      this.showToast(`Note « ${title} » importée`);
    };
    reader.readAsText(fileObj);
  },

  /* ==========================================
     SETTINGS & BACKUP
     ========================================== */
  renderSettingsValues() {
    const inputGas = document.getElementById("cfg-gas-url");
    const inputClient = document.getElementById("cfg-client-id");
    const inputDrive = document.getElementById("cfg-drive-id");
    const inputCal = document.getElementById("cfg-cal-id");

    if (inputGas) inputGas.value = store.data.settings.gasWebappUrl || "";
    if (inputClient) inputClient.value = store.data.settings.googleClientId || "";
    if (inputDrive) inputDrive.value = store.data.settings.driveFolderId || "";
    if (inputCal) inputCal.value = store.data.settings.calendarId || "";
  },

  saveSettings() {
    store.data.settings.gasWebappUrl = document.getElementById("cfg-gas-url").value.trim();
    store.data.settings.googleClientId = document.getElementById("cfg-client-id").value.trim();
    store.data.settings.driveFolderId = document.getElementById("cfg-drive-id").value.trim();
    store.data.settings.calendarId = document.getElementById("cfg-cal-id").value.trim();
    store.save();

    this.closeModal("modal-settings");
    this.showToast("Paramètres Cloud 4 To enregistrés");
    this.syncFromGAS();
  },

  resetAllData() {
    if (confirm("Réinitialiser l'espace MDC à son état vierge d'origine ?")) {
      store.reset();
      this.renderAll();
      this.showToast("Espace réinitialisé à l'état vierge");
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
