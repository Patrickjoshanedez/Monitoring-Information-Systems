require('dotenv').config();
const { google } = require('googleapis');

async function testDriveUpload() {
  try {
    const required = [
      'GOOGLE_DRIVE_CLIENT_ID',
      'GOOGLE_DRIVE_CLIENT_SECRET',
      'GOOGLE_DRIVE_REDIRECT_URI',
      'GOOGLE_DRIVE_REFRESH_TOKEN',
    ];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length) {
      throw new Error(`Missing env vars: ${missing.join(', ')}`);
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI,
    );
    auth.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });

    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: `test-upload-${Date.now()}.txt`,
      parents: [process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID],
    };

    const media = {
      mimeType: 'text/plain',
      body: `This is a test upload from BukSU Mentoring System at ${new Date().toISOString()}`,
    };

    console.log('🔄 Attempting to upload test file...');
    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, name, webViewLink, webContentLink',
    });

    console.log('✅ SUCCESS! File uploaded:');
    console.log('   File ID:', response.data.id);
    console.log('   File Name:', response.data.name);
    console.log('   View Link:', response.data.webViewLink);
    console.log('   Download Link:', response.data.webContentLink);
    return response.data;
  } catch (error) {
    console.error('❌ UPLOAD FAILED:');
    console.error('   Error:', error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.errors) {
      console.error('   Errors:', JSON.stringify(error.errors, null, 2));
    }
    return null;
  }
}

if (require.main === module) {
  testDriveUpload();
}

module.exports = { testDriveUpload };
