import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern = re.compile(r'\s*\{\s*id:\s*\'settings-view\',[\s\S]*?\},', re.MULTILINE)
content = pattern.sub('', content)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Removed Settings tab using regex.")

