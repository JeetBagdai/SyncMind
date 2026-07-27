const { execSync } = require('child_process');

try {
  // First, get the account slug
  const accountsStr = execSync('netlify api listAccountsForUser').toString();
  const accounts = JSON.parse(accountsStr);
  const accountSlug = accounts[0].slug;

  // Now create the site
  const siteStr = execSync(`netlify api createSiteInTeam --data '{"account_slug":"${accountSlug}", "body": {"name":"gyaanasetu-bnmit"}}'`).toString();
  const site = JSON.parse(siteStr);
  
  console.log(`Site created: ${site.id}`);
} catch (e) {
  console.error("Error", e.message);
}
