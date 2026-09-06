import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# The dropdown list rendering:
old_dropdown_array = """                            {[
                              { id: 'TEAM', label: 'General (All Teams)' },
                              { id: 'TEAM_HR', label: 'Human Resources (HR)' },
                              { id: 'TEAM_RND', label: 'Research & Development (R&D)' },
                              { id: 'TEAM_SDE', label: 'Software Engineering (SDE)' }
                            ].map((opt) => ("""

new_dropdown_array = """                            {[
                              { id: 'TEAM_OPS_ENG', label: 'Operations & Core Engineering Team' },
                              { id: 'TEAM_SUPPORT_ADMIN', label: 'Support & Administrative Team' },
                              { id: 'TEAM_SAFETY_QA', label: 'Safety, Quality & Technical Strategy Team' },
                              { id: 'TEAM_COMM_GOV', label: 'Commercial & Governance Team' }
                            ].map((opt) => ("""

content = content.replace(old_dropdown_array, new_dropdown_array)

# The selected item display logic:
old_selected_logic = """                          <span className={selectedTeam ? 'opacity-100' : 'opacity-50'}>
                            {selectedTeam === 'TEAM_HR' ? 'Human Resources (HR)' : 
                             selectedTeam === 'TEAM_RND' ? 'Research & Development (R&D)' :
                             selectedTeam === 'TEAM_SDE' ? 'Software Engineering (SDE)' : 
                             'General (All Teams)'}
                          </span>"""

new_selected_logic = """                          <span className={selectedTeam ? 'opacity-100' : 'opacity-50'}>
                            {selectedTeam === 'TEAM_OPS_ENG' ? 'Operations & Core Engineering Team' : 
                             selectedTeam === 'TEAM_SUPPORT_ADMIN' ? 'Support & Administrative Team' :
                             selectedTeam === 'TEAM_SAFETY_QA' ? 'Safety, Quality & Technical Strategy Team' :
                             selectedTeam === 'TEAM_COMM_GOV' ? 'Commercial & Governance Team' :
                             'Operations & Core Engineering Team'}
                          </span>"""

content = content.replace(old_selected_logic, new_selected_logic)

# Default fallback if localStorage doesn't have it (or has an old one):
old_useState = "const [selectedTeam, setSelectedTeam] = useState(localStorage.getItem('syncmind_team') || 'TEAM')"
new_useState = "const [selectedTeam, setSelectedTeam] = useState(localStorage.getItem('syncmind_team') || 'TEAM_OPS_ENG')"
content = content.replace(old_useState, new_useState)


with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated teams")
