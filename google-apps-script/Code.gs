/**
 * 👑 PASSERELLE GOOGLE APPS SCRIPT POUR MDC-CONECT (100% GRATUIT)
 * 
 * Synchronise en temps réel :
 * 1. Les fichiers et dossiers de votre Google Drive 4 To
 * 2. L'agenda Google Calendar (ou fichier partagé d'événements)
 * 3. Les notes et tâches d'équipe partagées
 * 
 * DÉPLOIEMENT :
 * 1. Ouvrez https://script.google.com > Ouvrez votre projet existant.
 * 2. Remplacez tout le code par ce fichier.
 * 3. Assurez-vous que ROOT_FOLDER_ID est l'identifiant de votre dossier Drive 4 To.
 * 4. Déployer > Gérer les déploiements > Modifier (crayon) > Nouvelle version > Qui a accès : "Tout le monde" > Déployer.
 */

var ROOT_FOLDER_ID = "VOTRE_ID_DE_DOSSIER_ICI";
var SYNC_FILE_NAME = "_mdc_sync_data.json";

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "syncAll";
  var folderId = (e && e.parameter && e.parameter.folderId) ? e.parameter.folderId : ROOT_FOLDER_ID;

  var response = {};

  try {
    if (action === "syncAll") {
      // Synchronisation complète : Fichiers Drive + Calendrier + Notes + Tâches
      var driveData = listFilesAndFolders(folderId);
      var sharedData = loadSyncFile();
      var calendarEvents = fetchCalendarEvents();

      // Fusionner les événements Google Calendar avec les événements personnalisés
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
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === "upload") {
      // Import de fichier sur les 4 To
      var targetFolderId = data.folderId || ROOT_FOLDER_ID;
      var folder = (targetFolderId === "root" || !targetFolderId) ? getRootFolder() : DriveApp.getFolderById(targetFolderId);
      
      var decodedBytes = Utilities.base64Decode(data.base64);
      var blob = Utilities.newBlob(decodedBytes, data.mimeType, data.fileName);
      var createdFile = folder.createFile(blob);

      response = {
        success: true,
        file: {
          id: createdFile.getId(),
          name: createdFile.getName(),
          size: (createdFile.getSize() / (1024 * 1024)).toFixed(2) + " Mo",
          mimeType: createdFile.getMimeType(),
          url: createdFile.getUrl()
        }
      };
    } else if (action === "createFolder") {
      // Création de dossier sur les 4 To
      var targetFolderId = data.folderId || ROOT_FOLDER_ID;
      var parent = (targetFolderId === "root" || !targetFolderId) ? getRootFolder() : DriveApp.getFolderById(targetFolderId);
      var newFolder = parent.createFolder(data.folderName);

      response = {
        success: true,
        folder: {
          id: newFolder.getId(),
          name: newFolder.getName()
        }
      };
    } else if (action === "saveSyncData") {
      // Sauvegarde des notes, tâches et événements partagés
      saveSyncFile({
        events: data.events || [],
        notes: data.notes || [],
        tasks: data.tasks || [],
        accounts: data.accounts || []
      });
      response = { success: true };
    } else if (action === "createCalendarEvent") {
      // Création directe dans Google Calendar
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

function getRootFolder() {
  if (!ROOT_FOLDER_ID || ROOT_FOLDER_ID === "VOTRE_ID_DE_DOSSIER_ICI") {
    return DriveApp.getRootFolder();
  }
  return DriveApp.getFolderById(ROOT_FOLDER_ID);
}

function listFilesAndFolders(folderId) {
  var folder = (folderId === "root" || !folderId) ? getRootFolder() : DriveApp.getFolderById(folderId);

  var subfolders = [];
  var foldersIter = folder.getFolders();
  while (foldersIter.hasNext()) {
    var f = foldersIter.next();
    subfolders.push({
      id: f.getId(),
      name: f.getName(),
      parentId: folderId
    });
  }

  var files = [];
  var filesIter = folder.getFiles();
  while (filesIter.hasNext()) {
    var file = filesIter.next();
    if (file.getName() === SYNC_FILE_NAME) continue; // Masquer le fichier de données de synchronisation
    files.push({
      id: file.getId(),
      name: file.getName(),
      size: (file.getSize() / (1024 * 1024)).toFixed(2) + " Mo",
      mimeType: file.getMimeType(),
      modifiedTime: file.getLastUpdated().toISOString(),
      url: file.getUrl(),
      downloadUrl: file.getDownloadUrl(),
      folderId: folderId
    });
  }

  return {
    success: true,
    folderId: folderId,
    folders: subfolders,
    files: files
  };
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
  } catch (e) {
    // Si pas d'accès direct au calendrier
  }
  return events;
}

function loadSyncFile() {
  try {
    var folder = getRootFolder();
    var files = folder.getFilesByName(SYNC_FILE_NAME);
    if (files.hasNext()) {
      var file = files.next();
      var content = file.getBlob().getDataAsString();
      return JSON.parse(content);
    }
  } catch (e) {
    // Erreur de lecture
  }
  return { events: [], notes: [], tasks: [], accounts: [] };
}

function saveSyncFile(data) {
  try {
    var folder = getRootFolder();
    var files = folder.getFilesByName(SYNC_FILE_NAME);
    var content = JSON.stringify(data);
    if (files.hasNext()) {
      var file = files.next();
      file.setContent(content);
    } else {
      folder.createFile(SYNC_FILE_NAME, content, MimeType.PLAIN_TEXT);
    }
  } catch (e) {
    // Erreur d'écriture
  }
}
