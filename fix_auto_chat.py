with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

import re
match = re.search(r'const allChats = \[\s*\.\.\.teamChats\.map.*?\]\s*if \(allChats\.length === 0\) \{', content, flags=re.DOTALL)
if match:
    print("Found block")
