/**
 * 👑 PASSERELLE GOOGLE APPS SCRIPT POUR MDC-CONECT (100% GRATUIT)
 * 
 * Ce script permet de relier votre site GitHub Pages directement à votre dossier Google Drive de 4 To
 * sans aucune limite payante, et sans obliger chaque membre à configurer des identifiants complexes.
 * 
 * INSTRUCTIONS D'INSTALLATION (EN 1 MINUTE) :
 * 1. Allez sur https://script.google.com et cliquez sur "Nouveau projet".
 * 2. Collez tout le contenu de ce fichier dans l'éditeur (en remplaçant le code existant).
 * 3. Modifiez la variable ROOT_FOLDER_ID ci-dessous avec l'ID de votre dossier Drive 4 To.
 * 4. Cliquez sur "Déployer" en haut à droite > "Nouveau déploiement".
 * 5. Type : "Application Web".
 *    - Exécuter en tant que : "Moi" (votre compte avec les 4 To).
 *    - Qui a accès : "Tout le monde" (pour que le site GitHub Pages puisse y accéder).
 * 6. Copiez l'URL de l'application Web générée (ex: https://script.google.com/macros/s/AKfycb.../exec).
 * 7. Dans MDC-Conect > Paramètres (roue crantée) > collez l'URL dans "Passerelle Google Apps Script".
 */

// ⚠️ REMPLACEZ PAR L'IDENTIFIANT DE VOTRE DOSSIER DRIVE 4 TO (partagé ou privé)
var ROOT_FOLDER_ID = "VOTRE_ID_DE_DOSSIER_ICI";

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "list";
  var folderId = (e && e.parameter && e.parameter.folderId) ? e.parameter.folderId : ROOT_FOLDER_ID;

  var response = {};

  try {
    if (action === "list") {
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
      var targetFolderId = data.folderId || ROOT_FOLDER_ID;
      var folder = (targetFolderId === "root" || !targetFolderId) ? DriveApp.getFolderById(ROOT_FOLDER_ID) : DriveApp.getFolderById(targetFolderId);
      
      var decodedBytes = Utilities.base64Decode(data.base64);
      var blob = Utilities.newBlob(decodedBytes, data.mimeType, data.fileName);
      var createdFile = folder.createFile(blob);

      response = {
        success: true,
        file: {
          id: createdFile.getId(),
          name: createdFile.getName(),
          size: createdFile.getSize(),
          mimeType: createdFile.getMimeType(),
          url: createdFile.getUrl()
        }
      };
    } else if (action === "createFolder") {
      var targetFolderId = data.folderId || ROOT_FOLDER_ID;
      var parent = (targetFolderId === "root" || !targetFolderId) ? DriveApp.getFolderById(ROOT_FOLDER_ID) : DriveApp.getFolderById(targetFolderId);
      var newFolder = parent.createFolder(data.folderName);

      response = {
        success: true,
        folder: {
          id: newFolder.getId(),
          name: newFolder.getName()
        }
      };
    } else {
      response = { success: false, error: "Action POST inconnue" };
    }
  } catch (err) {
    response = { success: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function listFilesAndFolders(folderId) {
  var folder = (folderId === "root" || !folderId) ? DriveApp.getFolderById(ROOT_FOLDER_ID) : DriveApp.getFolderById(folderId);

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
    folderName: folder.getName(),
    folders: subfolders,
    files: files
  };
}
