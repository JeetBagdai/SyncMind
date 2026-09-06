import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Inject state variables at the top of the App component
state_injection = """  const [selectedTeam, setSelectedTeam] = useState(localStorage.getItem('syncmind_team') || 'TEAM')
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false)
"""
# Find where to inject
target_state = """  const [isCentered, setIsCentered] = useState(false)"""
if target_state in content:
    content = content.replace(target_state, target_state + "\n" + state_injection)
else:
    print("Could not find state insertion point")

# 2. Replace the dropdown and the container classes
old_settings = """              <div className="ws-body p-6 flex flex-col gap-6 text-[var(--txt)] max-w-2xl">
                {/* Profile Section */}
                <div className="bg-[var(--panel-bg)] border border-[var(--nav-border)] rounded-xl p-5">
                  <h3 className="text-lg font-semibold mb-4 opacity-90">Profile & Identity</h3>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium opacity-80 mb-1">Display Name</label>
                      <input 
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
                      />
                      <p className="text-xs opacity-60 mt-1">This name will appear above your messages in Team chats.</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium opacity-80 mb-1">Team / Department</label>
                      <div className="relative">
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
                      </div>
                      <p className="text-xs opacity-60 mt-1">Select your primary department. Note: This will be fully implemented in a future update.</p>
                    </div>
                  </div>
                </div>"""

new_settings = """              <div className="ws-body p-6 flex flex-col gap-6 text-[var(--txt)] max-w-2xl mx-auto w-full mt-4" style={{ alignItems: 'center' }}>
                {/* Profile Section */}
                <div className="bg-[var(--panel-bg)] border border-[var(--nav-border)] rounded-xl p-6 w-full shadow-lg">
                  <h3 className="text-lg font-semibold mb-5 opacity-90">Profile & Identity</h3>
                  <div className="flex flex-col gap-6">
                    <div>
                      <label className="block text-sm font-medium opacity-80 mb-2">Display Name</label>
                      <input 
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
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-white/30 focus:bg-white/10 transition-all text-white placeholder-white/30 shadow-inner"
                      />
                      <p className="text-xs opacity-60 mt-2">This name will appear above your messages in Team chats.</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium opacity-80 mb-2">Team / Department</label>
                      
                      {/* Custom Dropdown */}
                      <div className="relative">
                        <button 
                          onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none hover:border-white/30 hover:bg-white/10 transition-all text-white shadow-inner flex justify-between items-center text-left"
                        >
                          <span className={selectedTeam ? 'opacity-100' : 'opacity-50'}>
                            {selectedTeam === 'TEAM_HR' ? 'Human Resources (HR)' : 
                             selectedTeam === 'TEAM_RND' ? 'Research & Development (R&D)' :
                             selectedTeam === 'TEAM_SDE' ? 'Software Engineering (SDE)' : 
                             'General (All Teams)'}
                          </span>
                          <svg className={`w-4 h-4 text-white opacity-50 transition-transform ${isTeamDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {isTeamDropdownOpen && (
                          <div className="absolute top-full left-0 w-full mt-2 bg-[#1a1a1a] border border-[var(--nav-border)] rounded-lg shadow-2xl z-50 overflow-hidden py-1">
                            {[
                              { id: 'TEAM', label: 'General (All Teams)' },
                              { id: 'TEAM_HR', label: 'Human Resources (HR)' },
                              { id: 'TEAM_RND', label: 'Research & Development (R&D)' },
                              { id: 'TEAM_SDE', label: 'Software Engineering (SDE)' }
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => {
                                  setSelectedTeam(opt.id);
                                  localStorage.setItem('syncmind_team', opt.id);
                                  setIsTeamDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors ${selectedTeam === opt.id ? 'bg-white/5 text-white font-medium' : 'text-white/80'}`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs opacity-60 mt-2">Select your primary department. Note: This will be fully implemented in a future update.</p>
                    </div>
                  </div>
                </div>"""

if old_settings in content:
    content = content.replace(old_settings, new_settings)
else:
    print("Could not find old settings block")

# 3. Add w-full to the shutdown scheduler card
old_scheduler = """                <div className="bg-[var(--panel-bg)] border border-red-900/30 rounded-xl p-5 relative overflow-hidden">"""
new_scheduler = """                <div className="bg-[var(--panel-bg)] border border-red-900/30 rounded-xl p-6 w-full relative overflow-hidden shadow-lg">"""
content = content.replace(old_scheduler, new_scheduler)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated dropdown and alignment")
