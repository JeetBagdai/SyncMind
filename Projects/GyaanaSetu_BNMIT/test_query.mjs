import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const projectMatch = env.match(/VITE_FIREBASE_PROJECT_ID=(.*)/);
const PROJECT = projectMatch[1].trim();

async function check() {
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/coding_problems`);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

check();
