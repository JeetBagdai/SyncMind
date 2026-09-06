import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Central to dropdown
old_dropdown_list = """                              {[
                                { id: 'TEAM_OPS_ENG', label: 'Operations & Core Engineering Team' },
                                { id: 'TEAM_SUPPORT_ADMIN', label: 'Support & Administrative Team' },
                                { id: 'TEAM_SAFETY_QA', label: 'Safety, Quality & Technical Strategy Team' },
                                { id: 'TEAM_COMM_GOV', label: 'Commercial & Governance Team' }
                              ].map((opt) => ("""

new_dropdown_list = """                              {[
                                { id: 'TEAM_OPS_ENG', label: 'Operations & Core Engineering Team' },
                                { id: 'TEAM_SUPPORT_ADMIN', label: 'Support & Administrative Team' },
                                { id: 'TEAM_SAFETY_QA', label: 'Safety, Quality & Technical Strategy Team' },
                                { id: 'TEAM_COMM_GOV', label: 'Commercial & Governance Team' },
                                { id: 'TEAM_CENTRAL', label: 'Central (All Teams Access)' }
                              ].map((opt) => ("""
content = content.replace(old_dropdown_list, new_dropdown_list)

old_selected = """                             selectedTeam === 'TEAM_COMM_GOV' ? 'Commercial & Governance Team' :
                             'Operations & Core Engineering Team'}"""
new_selected = """                             selectedTeam === 'TEAM_COMM_GOV' ? 'Commercial & Governance Team' :
                             selectedTeam === 'TEAM_CENTRAL' ? 'Central (All Teams Access)' :
                             'Operations & Core Engineering Team'}"""
content = content.replace(old_selected, new_selected)

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

# 3. Fix newChat
old_newchat = """    async function newChat(ownerType) {
      const owner = ownerType === 'TEAM' ? 'TEAM' : deviceId
      try {"""
new_newchat = """    async function newChat(ownerType) {
      const currentTeam = localStorage.getItem('syncmind_team') || 'TEAM_OPS_ENG'
      const owner = ownerType === 'TEAM' ? currentTeam : deviceId
      try {"""
content = content.replace(old_newchat, new_newchat)

# 4. Fix toggleChatPrivacy
old_toggle = """    function toggleChatPrivacy(id, ownerType) {
      const owner = ownerType === 'TEAM' ? 'TEAM' : deviceId
      const newGroup = owner === 'TEAM' ? 'Team Workspace' : 'Personal Workspace'"""
new_toggle = """    function toggleChatPrivacy(id, ownerType) {
      const currentTeam = localStorage.getItem('syncmind_team') || 'TEAM_OPS_ENG'
      const owner = ownerType === 'TEAM' ? currentTeam : deviceId
      const newGroup = ownerType === 'TEAM' ? 'Team Workspace' : 'Personal Workspace'"""
content = content.replace(old_toggle, new_toggle)

# 5. Fix Default Group formatChat
old_format = """            const formatChat = (c, owner) => {
              let defaultGroup = owner === 'TEAM' ? 'Team Workspace' : 'Personal Workspace'"""
new_format = """            const formatChat = (c, owner) => {
              let defaultGroup = owner.startsWith('TEAM') ? 'Team Workspace' : 'Personal Workspace'"""
content = content.replace(old_format, new_format)


with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated App.jsx with team isolation logic")
