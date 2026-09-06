with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

old_span = '<span className="text-[11px] text-white/50 mb-1 px-2 uppercase tracking-wider font-semibold opacity-70">{msg.sender_name}</span>'
new_span = '<span className="text-xs text-[var(--txt-dim)] mb-1 px-2 font-bold tracking-wide">{msg.sender_name}</span>'

content = content.replace(old_span, new_span)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed username visibility")
