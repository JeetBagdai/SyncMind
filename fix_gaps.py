import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# I will remove all dividers inside the ws-body because gap-10 provides enough spacing.
content = re.sub(r'\s*\{\/\* Divider \*\/\}\s*<div className=\"w-full h-px bg-\[var\(--ws-card-border\)\]\"><\/div>', '', content)
content = re.sub(r'\s*<div className=\"w-full h-px bg-\[var\(--ws-card-border\)\] opacity-50 my-2\"><\/div>', '', content)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Removed dividers")
