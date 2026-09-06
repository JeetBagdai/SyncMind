with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

old_main = '<main className="flex-1 overflow-hidden relative z-10">'
new_main = '<main className={`flex-1 overflow-hidden relative z-10 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${sidebarOpen ? \'md:ml-[280px]\' : \'\'}`}>'

content = content.replace(old_main, new_main)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated main element with dynamic margin")
