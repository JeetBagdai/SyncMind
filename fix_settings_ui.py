import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the Display Name Input
old_input = """<input 
                        type="text" 
                        defaultValue={localStorage.getItem('syncmind_username') || ''}
                        placeholder="e.g. Alice"
                        onBlur={(e) => {
                          const val = e.target.value.trim()
                          if (val) {
                            localStorage.setItem('syncmind_username', val)
                          } else {
                            localStorage.removeItem('syncmind_username')
                          }
                        }}
                        className="w-full bg-[var(--bg)] border border-[var(--nav-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-white/20 transition-colors"
                      />"""

new_input = """<input 
                        type="text" 
                        defaultValue={localStorage.getItem('syncmind_username') || ''}
                        placeholder="e.g. Alice"
                        onBlur={(e) => {
                          const val = e.target.value.trim()
                          if (val) {
                            localStorage.setItem('syncmind_username', val)
                          } else {
                            localStorage.removeItem('syncmind_username')
                          }
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-white/30 focus:bg-white/10 transition-all text-white placeholder-white/30 shadow-inner"
                      />"""
content = content.replace(old_input, new_input)

# Replace the Team Select
old_select = """<select 
                        defaultValue={localStorage.getItem('syncmind_team') || 'TEAM'}
                        onChange={(e) => localStorage.setItem('syncmind_team', e.target.value)}
                        className="w-full bg-[var(--bg)] border border-[var(--nav-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-white/20 transition-colors cursor-pointer"
                      >
                        <option value="TEAM">General (All Teams)</option>
                        <option value="TEAM_HR">Human Resources (HR)</option>
                        <option value="TEAM_RND">Research & Development (R&D)</option>
                        <option value="TEAM_SDE">Software Engineering (SDE)</option>
                      </select>"""

new_select = """<div className="relative">
                        <select 
                          defaultValue={localStorage.getItem('syncmind_team') || 'TEAM'}
                          onChange={(e) => localStorage.setItem('syncmind_team', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-white/30 focus:bg-white/10 transition-all text-white appearance-none cursor-pointer shadow-inner pr-10"
                        >
                          <option value="TEAM" className="bg-[#1a1a1a]">General (All Teams)</option>
                          <option value="TEAM_HR" className="bg-[#1a1a1a]">Human Resources (HR)</option>
                          <option value="TEAM_RND" className="bg-[#1a1a1a]">Research & Development (R&D)</option>
                          <option value="TEAM_SDE" className="bg-[#1a1a1a]">Software Engineering (SDE)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none opacity-50">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>"""
content = content.replace(old_select, new_select)


# Replace the Time Picker
old_time = """<input 
                          type="time"
                          id="shutdown-time"
                          className="bg-[var(--bg)] border border-[var(--nav-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500/50 transition-colors"
                        />"""

new_time = """<input 
                          type="time"
                          id="shutdown-time"
                          className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-500/50 focus:bg-red-500/20 transition-all text-red-100 shadow-inner [color-scheme:dark]"
                        />"""
content = content.replace(old_time, new_time)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated UI")
