import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# 2. Fix Fetching
old_fetch = """        // Fetch from API
        try {
            const [teamRes, personalRes] = await Promise.all([
              fetch('/api/chats?owner_id=TEAM'),
              fetch(`/api/chats?owner_id=${deviceId}`)
            ])"""

new_fetch = """        // Fetch from API
        try {
            const currentTeam = localStorage.getItem('syncmind_team') || 'TEAM_OPS_ENG'
            const [teamRes, personalRes] = await Promise.all([
              fetch(`/api/chats?owner_id=${currentTeam}`),
              fetch(`/api/chats?owner_id=${deviceId}`)
            ])"""
content = content.replace(old_fetch, new_fetch)

# Add selectedTeam to the dependency array
old_dep = """      }
      loadChats()
    }, [deviceId])"""

new_dep = """      }
      loadChats()
    }, [deviceId, selectedTeam])"""
content = content.replace(old_dep, new_dep)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated App.jsx with dependency array")
