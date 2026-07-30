const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const sa = require('./gyaanasetu-bnmit-firebase-adminsdk-fbsvc-b711e15f59.json');
admin.initializeApp({
  credential: admin.credential.cert(sa),
  storageBucket: 'gyaanasetu-bnmit.appspot.com'
});

const bucket = admin.storage().bucket();
const sourceDir = 'C:\\Users\\Jeet\\Desktop\\Projects\\GyaanaSetu_BNMIT\\Syllabus\\Sem3\\COA';
const destPrefix = 'syllabus/Sem3/COA/';

async function uploadFiles() {
  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.pdf'));
  const urls = [];
  
  for (const file of files) {
    const filePath = path.join(sourceDir, file);
    const destPath = destPrefix + file;
    const token = uuidv4();
    
    await bucket.upload(filePath, {
      destination: destPath,
      metadata: {
        contentType: 'application/pdf',
        metadata: {
          firebaseStorageDownloadTokens: token
        }
      }
    });
    
    const encodedPath = encodeURIComponent(destPath);
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
    
    urls.push({
      title: file.replace('.pdf', ''),
      file: downloadUrl
    });
    
    console.log(`Uploaded ${file}`);
  }
  
  console.log('\n--- JSON RESULT ---');
  console.log(JSON.stringify(urls, null, 2));
  process.exit(0);
}

uploadFiles().catch(console.error);
