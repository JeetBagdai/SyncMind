with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

target = "const [activeTab, setActiveTab] = useState('chat-view')"
injection = "const [activeTab, setActiveTab] = useState('chat-view')\n  const [selectedTeam, setSelectedTeam] = useState(localStorage.getItem('syncmind_team') || 'TEAM')\n  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false)"

if target in content:
    content = content.replace(target, injection)
    with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
        f.write(content)
    print("Injected state variables")
else:
    print("Could not find activeTab state")
