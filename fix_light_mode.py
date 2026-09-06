import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Display Name Input
content = content.replace(
    'className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-white/30 focus:bg-white/10 transition-all text-white placeholder-white/30 shadow-inner"',
    'className="w-full bg-[var(--hover)] border border-[var(--ws-card-border)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--txt-dim)] focus:bg-[var(--ws-card-bg)] transition-all text-[var(--txt)] placeholder-[var(--txt-faint)] shadow-inner"'
)

# 2. Dropdown Toggle Button
content = content.replace(
    'className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none hover:border-white/30 hover:bg-white/10 transition-all text-white shadow-inner flex justify-between items-center text-left"',
    'className="w-full bg-[var(--hover)] border border-[var(--ws-card-border)] rounded-lg px-4 py-2.5 text-sm outline-none hover:border-[var(--txt-dim)] hover:bg-[var(--ws-card-bg)] transition-all text-[var(--txt)] shadow-inner flex justify-between items-center text-left"'
)

# 3. Dropdown SVG Icon
content = content.replace(
    'className={`w-4 h-4 text-white opacity-50 transition-transform ${isTeamDropdownOpen ? \'rotate-180\' : \'\'}`}',
    'className={`w-4 h-4 text-[var(--txt-faint)] transition-transform ${isTeamDropdownOpen ? \'rotate-180\' : \'\'}`}'
)

# 4. Dropdown Popup Box
content = content.replace(
    'className="absolute top-full left-0 w-full mt-2 bg-[#1a1a1a] border border-[var(--nav-border)] rounded-lg shadow-2xl z-50 overflow-hidden py-1"',
    'className="absolute top-full left-0 w-full mt-2 bg-[var(--ws-card-bg)] border border-[var(--ws-card-border)] rounded-lg shadow-2xl z-50 overflow-hidden py-1"'
)

# 5. Dropdown Menu Items
content = content.replace(
    'className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors ${selectedTeam === opt.id ? \'bg-white/5 text-white font-medium\' : \'text-white/80\'}`}',
    'className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--hover-strong)] transition-colors ${selectedTeam === opt.id ? \'bg-[var(--hover)] text-[var(--txt)] font-medium\' : \'text-[var(--txt-dim)]\'}`}'
)

# 6. Divider Line
content = content.replace(
    '<div className="w-full h-px bg-white/10"></div>',
    '<div className="w-full h-px bg-[var(--ws-card-border)]"></div>'
)

# 7. Red Shutdown Title
content = content.replace(
    '<h3 className="text-lg font-semibold mb-1 opacity-90 text-red-400">System Shutdown Scheduler</h3>',
    '<h3 className="text-lg font-semibold mb-1 opacity-90 text-red-500">System Shutdown Scheduler</h3>'
)

# 8. Time Input
content = content.replace(
    'className="w-36 bg-white/5 border border-red-500/30 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:bg-white/10 transition-all text-red-100 placeholder-red-200/60 shadow-inner text-center font-mono tracking-wider"',
    'className="w-36 bg-[var(--hover)] border border-red-500/30 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:bg-[var(--ws-card-bg)] transition-all text-[var(--txt)] placeholder-[var(--txt-faint)] shadow-inner text-center font-mono tracking-wider"'
)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated light mode CSS")
