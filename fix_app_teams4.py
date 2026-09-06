import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(
    r"const newGroup = owner === 'TEAM' \? 'Team Workspace' : 'Personal Workspace'",
    "const newGroup = ownerType === 'TEAM' ? 'Team Workspace' : 'Personal Workspace'",
    content
)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Regex updated group toggle")
