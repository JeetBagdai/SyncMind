import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove the Settings tab from the array
tabs_block = """    {
      id: 'settings-view',
      label: 'Settings',
      description: 'Configure your preferences',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },"""

if tabs_block in content:
    content = content.replace(tabs_block, "")
    print("Removed Settings tab.")
else:
    print("Could not find Settings tab to remove.")

# 2. Change sidebar logo button onClick
old_sb_brand = """<button className="sb-brand" onClick={() => { setActiveTab('chat-view'); setSidebarOpen(false) }}>"""
new_sb_brand = """<button className="sb-brand" onClick={() => { setActiveTab('settings-view'); setSidebarOpen(false) }}>"""
content = content.replace(old_sb_brand, new_sb_brand)

# 3. Change top nav logo button onClick
old_nav_logo = """<button className="nav-logo" onClick={() => setActiveTab('chat-view')} aria-label="SyncMind home">"""
new_nav_logo = """<button className="nav-logo" onClick={() => setActiveTab('settings-view')} aria-label="SyncMind settings">"""
content = content.replace(old_nav_logo, new_nav_logo)


with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated logo click handlers.")

