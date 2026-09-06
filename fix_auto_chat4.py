import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

new_logic = """          const allChats = [
            ...teamChats.map(c => formatChat(c, 'TEAM')),
            ...personalChats.map(c => formatChat(c, deviceId))
          ]
          
          setConversations(allChats)
          
          let createdAny = false;
          if (personalChats.length === 0) {
            await newChat('PERSONAL')
            createdAny = true;
          }
          if (teamChats.length === 0) {
            await newChat('TEAM')
            createdAny = true;
          }
          
          if (!createdAny) {
            if (!activeConvId || !allChats.find(c => c.id === activeConvId)) {
                setActiveConvId(allChats[0].id)
            }
          }"""

content = re.sub(
    r"const allChats = \[\s*\.\.\.teamChats\.map\(c => formatChat\(c, 'TEAM'\)\),\s*\.\.\.personalChats\.map\(c => formatChat\(c, deviceId\)\)\s*\]\s*if \(allChats\.length === 0\) \{\s*await newChat\('PERSONAL'\)\s*\} else \{\s*setConversations\(allChats\)\s*setActiveConvId\(allChats\[0\]\.id\)\s*\}",
    new_logic,
    content,
    flags=re.DOTALL
)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Regex replace applied correctly")
