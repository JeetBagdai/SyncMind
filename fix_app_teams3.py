import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add Central to dropdown items
content = re.sub(
    r"\{ id: 'TEAM_COMM_GOV', label: 'Commercial & Governance Team' \}",
    "{ id: 'TEAM_COMM_GOV', label: 'Commercial & Governance Team' },\n                                { id: 'TEAM_CENTRAL', label: 'Central (All Teams Access)' }",
    content
)

# Fix fetch
content = re.sub(
    r"const \[teamRes, personalRes\] = await Promise.all\(\[\s+fetch\('/api/chats\?owner_id=TEAM'\),",
    "const currentTeam = localStorage.getItem('syncmind_team') || 'TEAM_OPS_ENG';\n            const [teamRes, personalRes] = await Promise.all([\n              fetch(`/api/chats?owner_id=${currentTeam}`),",
    content
)

# Fix newChat
content = re.sub(
    r"const owner = ownerType === 'TEAM' \? 'TEAM' : deviceId",
    "const currentTeam = localStorage.getItem('syncmind_team') || 'TEAM_OPS_ENG'\n      const owner = ownerType === 'TEAM' ? currentTeam : deviceId",
    content
)

# Fix defaultGroup formatChat
content = re.sub(
    r"let defaultGroup = owner === 'TEAM' \? 'Team Workspace' : 'Personal Workspace'",
    "let defaultGroup = owner.startsWith('TEAM') ? 'Team Workspace' : 'Personal Workspace'",
    content
)

# Add selectedTeam to useEffect
content = re.sub(
    r"loadChats\(\)\n\s*\}, \[deviceId\]\)",
    "loadChats()\n    }, [deviceId, selectedTeam])",
    content
)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Regex updated")
