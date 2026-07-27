const TOKEN = "nfc_LgbZkDfoBoB35aWBCXH4N7yVg37F2w87b1d0";
const SITE_ID = "623a53d8-9b05-4e58-9f38-1ab033093e95";

async function main() {
    try {
        const res = await fetch(`https://api.netlify.com/api/v1/sites/${SITE_ID}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: 'gyaanasetu-bnmit' })
        });
        const data = await res.json();
        console.log("Renamed site to:", data.name);
    } catch (e) {
        console.error(e);
    }
}

main();
