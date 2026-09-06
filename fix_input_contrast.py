with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

old_classes = 'className="w-32 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500/50 focus:bg-red-500/10 transition-all text-red-100 placeholder-red-500/30 shadow-inner text-center font-mono tracking-wider"'
new_classes = 'className="w-36 bg-white/5 border border-red-500/30 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:bg-white/10 transition-all text-red-100 placeholder-red-200/60 shadow-inner text-center font-mono tracking-wider"'

content = content.replace(old_classes, new_classes)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed input contrast")
