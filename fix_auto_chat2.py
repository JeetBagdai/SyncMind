import re
with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

old_block = """          const allChats = [
            ...teamChats.map(c => formatChat(c, 'TEAM')),
            ...personalChats.map(c => formatChat(c, deviceId))
          ]
          
          if (allChats.length === 0) {
            await newChat('PERSONAL')
          } else {
            setConversations(allChats)
            if (!activeConvId || !allChats.find(c => c.id === activeConvId)) {
              setActiveConvId(allChats[0].id)
            }
          }"""

new_block = """          const allChats = [
            ...teamChats.map(c => formatChat(c, 'TEAM')),
            ...personalChats.map(c => formatChat(c, deviceId))
          ]
          
          setConversations(allChats)
          
          // Ensure there is always at least one Personal and one Team chat
          if (personalChats.length === 0) {
            await newChat('PERSONAL')
          }
          if (teamChats.length === 0) {
            await newChat('TEAM')
          }
          
          // Re-evaluate to set the active Conv ID if needed
          setConversations((prev) => {
            if (!activeConvId || !prev.find(c => c.id === activeConvId)) {
              if (prev.length > 0) setActiveConvId(prev[0].id)
            }
            return prev
          })"""

content = content.replace(old_block, new_block)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated auto-chat creation")
