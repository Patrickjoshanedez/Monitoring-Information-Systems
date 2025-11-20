require('dotenv').config();
const { google } = require('googleapis');

const required = [
  'GOOGLE_DRIVE_CLIENT_ID',
  'GOOGLE_DRIVE_CLIENT_SECRET',
  'GOOGLE_DRIVE_REDIRECT_URI',
  'GOOGLE_DRIVE_REFRESH_TOKEN',
];

const ensureEnv = () => {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
};

const createDriveClient = () => {
  ensureEnv();
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    process.env.GOOGLE_DRIVE_REDIRECT_URI,
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });
  return google.drive({ version: 'v3', auth });
};

const listFiles = async ({ folderId, pageSize = 20 }) => {
  const drive = createDriveClient();
  const qParts = ["trashed = false"];
  if (folderId) {
    qParts.push(`'${folderId}' in parents`);
  }

  const response = await drive.files.list({
    q: qParts.join(' and '),
    fields: 'files(id, name, mimeType, modifiedTime, webViewLink, webContentLink)',
    pageSize,
    orderBy: 'modifiedTime desc',
  });

  return response.data.files || [];
};

const formatFile = (file) => ({
  id: file.id,
  name: file.name,
  mimeType: file.mimeType,
  modifiedTime: file.modifiedTime,
  webViewLink: file.webViewLink,
  downloadLink: file.webContentLink,
});

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--folder' || arg === '-f') {
      options.folderId = args[i + 1];
      i += 1;
    } else if (arg === '--limit' || arg === '-l') {
      options.pageSize = Number(args[i + 1]) || undefined;
      i += 1;
    }
  }
  return options;
};

const run = async () => {
  try {
    const { folderId, pageSize } = parseArgs();
    const effectiveFolder = folderId || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!effectiveFolder) {
      throw new Error('No folder specified and GOOGLE_DRIVE_ROOT_FOLDER_ID is unset. Pass --folder <ID>.');
    }

    console.log(`📂 Listing up to ${pageSize || 20} files under folder ${effectiveFolder}...`);
    const files = await listFiles({ folderId: effectiveFolder, pageSize });
    if (!files.length) {
      console.log('No files found.');
      return;
    }

    files.map(formatFile).forEach((file, index) => {
      console.log(`\n${index + 1}. ${file.name}`);
      console.log(`   ID: ${file.id}`);
      console.log(`   MIME: ${file.mimeType}`);
      console.log(`   Modified: ${file.modifiedTime}`);
      if (file.webViewLink) console.log(`   View: ${file.webViewLink}`);
      if (file.downloadLink) console.log(`   Download: ${file.downloadLink}`);
    });
  } catch (error) {
    console.error('❌ Failed to list Drive files');
    console.error('   Message:', error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exitCode = 1;
  }
};

if (require.main === module) {
  run();
}

module.exports = { listFiles };
