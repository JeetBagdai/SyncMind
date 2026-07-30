import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const projectMatch = env.match(/VITE_FIREBASE_PROJECT_ID=(.*)/);
const PROJECT = projectMatch[1].trim();

const mappings = {
  'prob-sem3-1': { module: 'Module 2 - Linked List', subModule: '2.1. Practicals', order: 1 },
  'prob-sem3-2': { module: 'Module 1 - Classes and Objects', subModule: '1.1. Practicals', order: 1 },
  'prob-1': { module: 'Module 1 - Basics', subModule: '1.1 Theory', order: 1 },
  'prob-2': { module: 'Module 3 - Deep Learning Models', subModule: '3.1 Code', order: 1 },
  'prob-3': { module: 'Module 4 - Graphs', subModule: '4.1 Algo', order: 1 }
};

async function addModules() {
  for (const [id, data] of Object.entries(mappings)) {
    console.log(`Updating ${id}...`);
    const updateUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/coding_problems/${id}?updateMask.fieldPaths=module&updateMask.fieldPaths=subModule&updateMask.fieldPaths=order`;
    
    const patchRes = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          module: { stringValue: data.module },
          subModule: { stringValue: data.subModule },
          order: { integerValue: data.order }
        }
      })
    });
    
    if (patchRes.ok) {
      console.log(`Successfully updated ${id}`);
    } else {
      console.error(`Failed to update ${id}`, await patchRes.text());
    }
  }
}

addModules();
