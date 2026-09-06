with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

old_span = '<span className="text-[13px] text-[var(--txt-dim)] mb-1.5 px-2 font-bold tracking-wide">{msg.sender_name}</span>'
new_span = '<span className="text-[13px] text-[var(--txt)] bg-[var(--hover)] border border-[var(--ws-card-border)] rounded-full px-3 py-0.5 mb-2 font-bold tracking-wide shadow-sm">{msg.sender_name}</span>'

content = content.replace(old_span, new_span)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Applied pill style to username")
