with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

target = "        {/* Network Proof View */}"

settings_view = """
        {/* Settings View */}
        {activeTab === 'settings-view' && (
          <div className="ws-view">
            <section className="ws-panel">
              <header className="ws-head">
                <span className="ws-head-ic">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <div>
                  <h2 className="ws-title">Settings</h2>
                  <p className="ws-subtitle">Configure your preferences and system settings</p>
                </div>
              </header>
              <div className="ws-body p-6 flex flex-col gap-6 text-[var(--txt)] max-w-2xl">
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
                        className="w-full bg-[var(--bg)] border border-[var(--nav-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-white/20 transition-colors"
                      />
                      <p className="text-xs opacity-60 mt-1">This name will appear above your messages in Team chats.</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium opacity-80 mb-1">Team / Department</label>
                      <select 
                        defaultValue={localStorage.getItem('syncmind_team') || 'TEAM'}
                        onChange={(e) => localStorage.setItem('syncmind_team', e.target.value)}
                        className="w-full bg-[var(--bg)] border border-[var(--nav-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-white/20 transition-colors cursor-pointer"
                      >
                        <option value="TEAM">General (All Teams)</option>
                        <option value="TEAM_HR">Human Resources (HR)</option>
                        <option value="TEAM_RND">Research & Development (R&D)</option>
                        <option value="TEAM_SDE">Software Engineering (SDE)</option>
                      </select>
                      <p className="text-xs opacity-60 mt-1">Select your primary department. Note: This will be fully implemented in a future update.</p>
                    </div>
                  </div>
                </div>

                {/* System Control Section */}
                <div className="bg-[var(--panel-bg)] border border-red-900/30 rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
                  <h3 className="text-lg font-semibold mb-1 opacity-90 text-red-400">System Shutdown Scheduler</h3>
                  <p className="text-sm opacity-70 mb-4">Schedule a complete shutdown of all SyncMind backend processes.</p>
                  
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium opacity-80 mb-1">Schedule Shutdown Time</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="time"
                          id="shutdown-time"
                          className="bg-[var(--bg)] border border-[var(--nav-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500/50 transition-colors"
                        />
                        <button 
                          onClick={() => {
                            const timeVal = document.getElementById('shutdown-time').value;
                            if (!timeVal) {
                              alert("Please select a time first.");
                              return;
                            }
                            fetch('/api/system/schedule_shutdown', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ time: timeVal })
                            })
                            .then(res => res.json())
                            .then(data => alert(data.message || data.error))
                            .catch(err => alert("Error scheduling shutdown: " + err));
                          }}
                          className="interactive-el bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                        >
                          Set Schedule
                        </button>
                      </div>
                      <p className="text-xs opacity-60 mt-2">The system will automatically terminate all Python processes related to this application at the specified local time.</p>
                    </div>
                  </div>
                </div>

              </div>
            </section>
          </div>
        )}

"""

if target in content:
    content = content.replace(target, settings_view + target)
    with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Injected Settings View")
else:
    print("Target not found")
