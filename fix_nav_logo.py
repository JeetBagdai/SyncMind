import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

old_nav_logo = """        {/* Brand logo */}
        <button className="nav-logo" onClick={() => setActiveTab('settings-view')} aria-label="SyncMind settings">
          <img src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'} alt="SyncMind" />
        </button>"""

new_nav_logo = """        {/* Brand logo */}
        <button 
          className={`nav-logo overflow-hidden transition-all duration-300 flex items-center justify-center ${activeTab === 'settings-view' ? '!w-auto !px-3 gap-2' : ''}`} 
          onClick={() => setActiveTab('settings-view')} 
          aria-label="SyncMind settings"
        >
          <img 
            src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'} 
            alt="SyncMind" 
            className={`transition-all duration-300 ${activeTab === 'settings-view' ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ''}`}
          />
          {activeTab === 'settings-view' && (
            <span className="font-semibold text-white/90 text-[13.5px] tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] whitespace-nowrap animate-in fade-in zoom-in duration-300">
              Settings
            </span>
          )}
        </button>"""

content = content.replace(old_nav_logo, new_nav_logo)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated nav logo")
