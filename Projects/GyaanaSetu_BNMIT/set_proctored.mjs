import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const projectMatch = env.match(/VITE_FIREBASE_PROJECT_ID=(.*)/);
const PROJECT = projectMatch[1].trim();

async function setAllProctored() {
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/coding_problems`;
  
  console.log("Fetching all problems...");
  const res = await fetch(baseUrl);
  const data = await res.json();
  
  if (!data.documents) {
    console.log("No documents found.");
    return;
  }
  
  console.log(`Found ${data.documents.length} problems. Updating them to proctored: true...`);
  
  for (const doc of data.documents) {
    // Only patch if it's currently false
    if (doc.fields.proctored && doc.fields.proctored.booleanValue === false) {
      console.log(`Updating ${doc.name}...`);
      
      const docPath = doc.name.split('/documents/')[1];
      const updateUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${docPath}?updateMask.fieldPaths=proctored`;
      
      const patchRes = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            proctored: {
              booleanValue: true
            }
          }
        })
      });
      
      if (patchRes.ok) {
        console.log(`Successfully updated ${docPath}`);
      } else {
        console.error(`Failed to update ${docPath}`, await patchRes.text());
      }
    } else if (!doc.fields.proctored) {
        // If it doesn't have the proctored field at all, add it
        console.log(`Adding proctored to ${doc.name}...`);
        const docPath = doc.name.split('/documents/')[1];
        const updateUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/${docPath}?updateMask.fieldPaths=proctored`;
        
        const patchRes = await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fields: {
                proctored: {
                  booleanValue: true
                }
              }
            })
          });
    }
  }
  console.log("Done.");
}

setAllProctored();
