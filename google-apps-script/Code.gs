/**
 * PASSERELLE GOOGLE APPS SCRIPT POUR MDC-CONECT
 * Synchronisation 100% cloud avec votre Google Drive 4 To
 * 
 * Tout fichier importé par vous ou un membre est stocké directement
 * dans votre Google Drive dans le dossier « MDC-Conect ».
 * Tout le monde peut consulter et télécharger les fichiers sans compte Google.
 * 
 * INSTRUCTIONS POUR ACTIVER L'ACCÈS PUBLIC :
 * 1. Ouvrez https://script.google.com et ouvrez votre projet existant.
 * 2. Remplacez TOUT le code par ce fichier et cliquez sur Enregistrer (icône disquette).
 * 3. Cliquez en haut à droite sur « Déployer » > « Gérer les déploiements ».
 * 4. Cliquez sur le CRAYON (Modifier) en face du déploiement actif.
 * 5. TRÈS IMPORTANT :
 *    - Version : Choisissez « Nouvelle version ».
 *    - Exécuter en tant que : « Moi (votre_adresse@gmail.com) »
 *    - Qui a accès : « Tout le monde » (Anyone) <-- OBLIGATOIRE pour que les membres puissent consulter sans se connecter à Google !
 * 6. Cliquez sur « Déployer » et acceptez les autorisations de votre compte Google.
 */

// Si vous souhaitez forcer un dossier spécifique de vos 4 To, mettez son ID ici.
// Si vous laissez "AUTO", le script crée ou utilise automatiquement le dossier "MDC-Conect" à la racine de votre Drive.
var ROOT_FOLDER_ID = "AUTO";
var FOLDER_NAME = "MDC-Conect";
var SYNC_FILE_NAME = "_mdc_sync_data.json";

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "syncAll";
  var folderId = (e && e.parameter && e.parameter.folderId) ? e.parameter.folderId : "root";

  var response = {};

  try {
    if (action === "syncAll") {
      var driveData = listFilesAndFolders(folderId);
      var sharedData = loadSyncFile();
      var calendarEvents = fetchCalendarEvents();
      var mergedEvents = calendarEvents.concat(sharedData.events || []);

      response = {
        success: true,
        folders: driveData.folders,
        files: driveData.files,
        events: mergedEvents,
        notes: sharedData.notes || [],
        tasks: sharedData.tasks || [],
        accounts: sharedData.accounts || []
      };
    } else if (action === "list") {
      response = listFilesAndFolders(folderId);
    } else if (action === "download") {
      var fileId = e.parameter.fileId;
      var file = DriveApp.getFileById(fileId);
      response = {
        success: true,
        name: file.getName(),
        mimeType: file.getMimeType(),
        size: file.getSize(),
        base64: Utilities.base64Encode(file.getBlob().getBytes())
      };
    } else {
      response = { success: false, error: "Action inconnue" };
    }
  } catch (err) {
    response = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var response = {};

  try {
    var contents = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    var data = JSON.parse(contents);
    var action = data.action;

    if (action === "upload") {
      // Import de fichier directement sur vos 4 To
      var root = getMdcRootFolder();
      var targetFolder = root;
      if (data.folderId && data.folderId !== "root" && data.folderId !== root.getId()) {
        try {
          targetFolder = DriveApp.getFolderById(data.folderId);
        } catch (_) {
          targetFolder = root;
        }
      }

      var decodedBytes = Utilities.base64Decode(data.base64);
      var blob = Utilities.newBlob(decodedBytes, data.mimeType || "application/octet-stream", data.fileName);
      var createdFile = targetFolder.createFile(blob);

      if (data.author) {
        createdFile.setDescription("Ajouté par " + data.author + " via MDC-Conect");
      }

      // Rendre le fichier accessible en lecture par lien direct
      try {
        createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (_) {}

      var fileId = createdFile.getId();
      var ext = (data.fileName.split('.').pop() || "").toLowerCase();
      var type = getCategoryFromExt(ext, data.mimeType);

      response = {
        success: true,
        file: {
          id: fileId,
          driveFileId: fileId,
          name: createdFile.getName(),
          size: (createdFile.getSize() / (1024 * 1024)).toFixed(2) + " Mo",
          type: type.type,
          category: type.category,
          date: Utilities.formatDate(createdFile.getLastUpdated(), Session.getScriptTimeZone(), "dd/MM/yyyy"),
          author: data.author || "Membre MDC",
          url: "https://drive.google.com/file/d/" + fileId + "/preview",
          downloadUrl: "https://drive.google.com/uc?export=download&id=" + fileId,
          webUrl: createdFile.getUrl(),
          folderId: targetFolder.getId() === root.getId() ? "root" : targetFolder.getId()
        }
      };
    } else if (action === "deleteFile") {
      // Suppression de fichier de votre Drive
      if (data.fileId) {
        try {
          var f = DriveApp.getFileById(data.fileId);
          f.setTrashed(true);
          response = { success: true };
        } catch (delErr) {
          response = { success: false, error: delErr.toString() };
        }
      }
    } else if (action === "createFolder") {
      // Création de dossier sur vos 4 To
      var rootFolder = getMdcRootFolder();
      var parent = rootFolder;
      if (data.folderId && data.folderId !== "root" && data.folderId !== rootFolder.getId()) {
        try {
          parent = DriveApp.getFolderById(data.folderId);
        } catch (_) {
          parent = rootFolder;
        }
      }
      var newFolder = parent.createFolder(data.folderName);
      try {
        newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (_) {}

      response = {
        success: true,
        folder: {
          id: newFolder.getId(),
          name: newFolder.getName(),
          parentId: parent.getId() === rootFolder.getId() ? "root" : parent.getId()
        }
      };
    } else if (action === "deleteFolder") {
      // Suppression de dossier de votre Drive
      if (data.folderId && data.folderId !== "root") {
        try {
          var fold = DriveApp.getFolderById(data.folderId);
          fold.setTrashed(true);
          response = { success: true };
        } catch (delFoldErr) {
          response = { success: false, error: delFoldErr.toString() };
        }
      }
    } else if (action === "saveSyncData") {
      // Sauvegarde des notes, tâches et comptes partagés
      saveSyncFile({
        events: data.events || [],
        notes: data.notes || [],
        tasks: data.tasks || [],
        accounts: data.accounts || []
      });
      response = { success: true };
    } else if (action === "createCalendarEvent") {
      // Création directe dans votre Google Calendar
      try {
        var cal = CalendarApp.getDefaultCalendar();
        if (cal && data.title && data.date) {
          var dateParts = data.date.split("-");
          var startTime = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 19, 0, 0);
          var endTime = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), 21, 0, 0);
          var ev = cal.createEvent(data.title, startTime, endTime, {
            description: data.description || "",
            location: data.location || "MDC"
          });
          response = { success: true, googleEventId: ev.getId() };
        } else {
          response = { success: true };
        }
      } catch (calErr) {
        response = { success: true, warning: calErr.toString() };
      }
    } else {
      response = { success: false, error: "Action inconnue" };
    }
  } catch (err) {
    response = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function getMdcRootFolder() {
  if (ROOT_FOLDER_ID && ROOT_FOLDER_ID !== "AUTO" && ROOT_FOLDER_ID !== "VOTRE_ID_DE_DOSSIER_ICI") {
    try {
      return DriveApp.getFolderById(ROOT_FOLDER_ID);
    } catch (_) {}
  }

  // Chercher le dossier "MDC-Conect" à la racine de votre Drive
  var folders = DriveApp.getRootFolder().getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }

  // Sinon, créer le dossier automatiquement
  var newRoot = DriveApp.getRootFolder().createFolder(FOLDER_NAME);
  newRoot.setDescription("Dossier Cloud partagé MDC-Conect (4 To)");
  try {
    newRoot.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (_) {}
  return newRoot;
}

function listFilesAndFolders(folderId) {
  var root = getMdcRootFolder();
  var folder = (folderId === "root" || !folderId || folderId === root.getId()) 
    ? root 
    : DriveApp.getFolderById(folderId);

  var subfolders = [];
  var foldersIter = folder.getFolders();
  while (foldersIter.hasNext()) {
    var f = foldersIter.next();
    subfolders.push({
      id: f.getId(),
      name: f.getName(),
      parentId: folderId === root.getId() ? "root" : folderId
    });
  }

  var files = [];
  var filesIter = folder.getFiles();
  while (filesIter.hasNext()) {
    var file = filesIter.next();
    if (file.getName() === SYNC_FILE_NAME) continue;

    var name = file.getName();
    var ext = (name.split('.').pop() || "").toLowerCase();
    var mime = file.getMimeType();
    var catInfo = getCategoryFromExt(ext, mime);

    files.push({
      id: file.getId(),
      driveFileId: file.getId(),
      name: name,
      size: (file.getSize() / (1024 * 1024)).toFixed(2) + " Mo",
      type: catInfo.type,
      category: catInfo.category,
      date: Utilities.formatDate(file.getLastUpdated(), Session.getScriptTimeZone(), "dd/MM/yyyy"),
      author: file.getDescription() || "Victor D.",
      url: "https://drive.google.com/file/d/" + file.getId() + "/preview",
      downloadUrl: "https://drive.google.com/uc?export=download&id=" + file.getId(),
      webUrl: file.getUrl(),
      folderId: folder.getId() === root.getId() ? "root" : folder.getId()
    });
  }

  return {
    success: true,
    folderId: folderId,
    folders: subfolders,
    files: files
  };
}

function getCategoryFromExt(ext, mime) {
  mime = mime || "";
  if (mime.indexOf("image/") === 0 || ["jpg", "jpeg", "png", "webp", "gif", "svg"].indexOf(ext) >= 0) {
    return { type: "image", category: "images" };
  } else if (mime.indexOf("video/") === 0 || ["mp4", "mov", "webm", "avi", "mkv"].indexOf(ext) >= 0) {
    return { type: "video", category: "images" };
  } else if (mime.indexOf("audio/") === 0 || ["mp3", "wav", "ogg", "m4a", "aac"].indexOf(ext) >= 0) {
    return { type: "audio", category: "images" };
  } else if (mime.indexOf("spreadsheet") >= 0 || ["xls", "xlsx", "csv", "tsv"].indexOf(ext) >= 0) {
    return { type: "spreadsheet", category: "spreadsheets" };
  } else if (mime.indexOf("pdf") >= 0 || ext === "pdf") {
    return { type: "pdf", category: "documents" };
  } else if (["zip", "rar", "7z", "tar", "gz"].indexOf(ext) >= 0) {
    return { type: "archive", category: "documents" };
  } else {
    return { type: "document", category: "documents" };
  }
}

function fetchCalendarEvents() {
  var events = [];
  try {
    var cal = CalendarApp.getDefaultCalendar();
    if (cal) {
      var now = new Date();
      var in3Months = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));
      var calEvents = cal.getEvents(now, in3Months);
      for (var i = 0; i < calEvents.length; i++) {
        var ev = calEvents[i];
        events.push({
          id: "gcal_" + ev.getId(),
          title: ev.getTitle(),
          date: Utilities.formatDate(ev.getStartTime(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
          time: Utilities.formatDate(ev.getStartTime(), Session.getScriptTimeZone(), "HH:mm"),
          location: ev.getLocation() || "MDC",
          category: "meeting",
          description: ev.getDescription() || ""
        });
      }
    }
  } catch (e) {}
  return events;
}

function loadSyncFile() {
  try {
    var folder = getMdcRootFolder();
    var files = folder.getFilesByName(SYNC_FILE_NAME);
    if (files.hasNext()) {
      var file = files.next();
      var content = file.getBlob().getDataAsString();
      return JSON.parse(content);
    }
  } catch (e) {}
  return { events: [], notes: [], tasks: [], accounts: [] };
}

function saveSyncFile(data) {
  try {
    var folder = getMdcRootFolder();
    var files = folder.getFilesByName(SYNC_FILE_NAME);
    var content = JSON.stringify(data);
    if (files.hasNext()) {
      var file = files.next();
      file.setContent(content);
    } else {
      var newFile = folder.createFile(SYNC_FILE_NAME, content, MimeType.PLAIN_TEXT);
      try {
        newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (_) {}
    }
  } catch (e) {}
}
