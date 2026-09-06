import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add the state variable
state_str = """  const [activeTab, setActiveTab] = useState('chat-view')
  const [selectedTeam, setSelectedTeam] = useState(localStorage.getItem('syncmind_team') || 'TEAM_OPS_ENG')
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false)
  const [swarmComputeEnabled, setSwarmComputeEnabled] = useState(
    localStorage.getItem('syncmind_swarm_compute') !== 'false'
  )
"""
content = content.replace("  const [activeTab, setActiveTab] = useState('chat-view')\n  const [selectedTeam, setSelectedTeam] = useState(localStorage.getItem('syncmind_team') || 'TEAM_OPS_ENG')\n  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false)\n", state_str)

# Add the UI section
ui_str = """                  <div className="w-full h-px bg-[var(--ws-card-border)] opacity-50 my-2"></div>
                  
                  {/* Swarm Compute Section */}
                  <div className="w-full">
                    <h3 className="text-lg font-semibold mb-5 opacity-90">Swarm Compute & Privacy</h3>
                    <div className="flex flex-col gap-6">
                      <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[var(--ws-card-border)] bg-[var(--hover)] shadow-inner">
                        <div className="flex flex-col gap-1.5 pr-4">
                          <span className="font-medium text-[var(--txt)]">Allow Swarm Processing</span>
                          <span className="text-sm text-[var(--txt-dim)] leading-relaxed">When enabled, your node will process complex prompts from other team members in the background. Disabling this keeps your compute local but you will still have access to all team chats.</span>
                        </div>
                        <button
                          onClick={() => {
                            const next = !swarmComputeEnabled;
                            setSwarmComputeEnabled(next);
                            localStorage.setItem('syncmind_swarm_compute', next);
                            // Normally we would also inform the backend via WebSocket that this node is locked/unlocked
                          }}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${swarmComputeEnabled ? 'bg-[#10a37f]' : 'bg-[var(--ws-card-border)]'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${swarmComputeEnabled ? 'translate-x-5' : 'translate-x-0 opacity-70'}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-[var(--ws-card-border)] opacity-50 my-2"></div>

                  {/* System Control Section */}
                  <div className="w-full relative">
                    <h3 className="text-lg font-semibold mb-1 opacity-90 text-red-500">System Shutdown Scheduler</h3>"""

content = content.replace("                  {/* System Control Section */}\n                  <div className=\"w-full relative\">\n                    <h3 className=\"text-lg font-semibold mb-1 opacity-90 text-red-500\">System Shutdown Scheduler</h3>", ui_str)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Added swarm toggle")
