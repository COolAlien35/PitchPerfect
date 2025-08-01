const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Load credentials from service account
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../config/drive-service-account.json'),
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Upload a file to Google Drive and return the public URL
 * @param {string} filePath path to local file
 * @param {string} mimeType 
 * @returns {Promise<string>} Public file URL
 */
async function uploadResumeToDrive(filePath, mimeType) {
  const res = await drive.files.create({
    requestBody: {
      name: path.basename(filePath),
      mimeType,
    },
    media: {
      mimeType,
      body: fs.createReadStream(filePath),
    },
    fields: 'id'
  });
  const fileId = res.data.id;

  // Make file public
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });
  const webViewLink = `https://drive.google.com/file/d/${fileId}/view`;

  return webViewLink;
}

module.exports = { uploadResumeToDrive };