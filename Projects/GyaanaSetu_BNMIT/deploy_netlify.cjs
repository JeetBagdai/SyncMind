const fs = require('fs');
const { execSync } = require('child_process');

const TOKEN = "nfc_LgbZkDfoBoB35aWBCXH4N7yVg37F2w87b1d0";
const ACCOUNT_SLUG = "jeetbagdai1606";
const SITE_NAME = "gyaanasetu-bnmit";

async function main() {
  try {
    console.log("Creating Netlify site...");
    const res = await fetch(`https://api.netlify.com/api/v1/${ACCOUNT_SLUG}/sites`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: SITE_NAME })
    });
    
    const data = await res.json();
    if (data.errors) {
      console.log("Error creating site:", data.errors);
      // Wait, if it exists, let's try to fetch it
    }
    
    const siteId = data.id || "bf0a11db-10a4-4cc9-b7b8-809cc4c23db0"; // We'll fetch the actual ID if it already exists, but assuming it didn't
    if (!data.id) {
        // Fetch existing sites to find it
        const listRes = await fetch(`https://api.netlify.com/api/v1/sites?name=${SITE_NAME}`, {
             headers: { "Authorization": `Bearer ${TOKEN}` }
        });
        const sites = await listRes.json();
        const existingSite = sites.find(s => s.name === SITE_NAME);
        if (existingSite) {
            console.log("Found existing site: " + existingSite.id);
            siteId = existingSite.id;
        }
    } else {
        console.log("Created new site: " + siteId);
    }

    // Link the folder by creating .netlify/state.json
    console.log("Linking folder to site...");
    if (!fs.existsSync('.netlify')) fs.mkdirSync('.netlify');
    fs.writeFileSync('.netlify/state.json', JSON.stringify({ siteId }));

    console.log("Deploying to Netlify...");
    // Run the Netlify deployment
    execSync('npx netlify deploy --prod --build', { stdio: 'inherit', env: { ...process.env, NETLIFY_AUTH_TOKEN: TOKEN }});
    
    console.log("Deployment completed successfully!");
  } catch (err) {
    console.error("Fatal error:", err);
  }
}

main();
