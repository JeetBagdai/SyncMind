import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# I will replace the two cards with a unified structure that just uses the main container.
# It seems the easiest way is to use regex or replace the blocks exactly.

old_block_start = """              <div className="ws-body p-6 flex flex-col gap-6 text-[var(--txt)] max-w-5xl mx-auto w-full mt-4" style={{ alignItems: 'center' }}>
                {/* Profile Section */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 w-full shadow-2xl">"""

new_block_start = """              <div className="ws-body p-8 flex flex-col gap-10 text-[var(--txt)] max-w-5xl mx-auto w-full mt-2">
                {/* Profile Section */}
                <div className="w-full">"""

content = content.replace(old_block_start, new_block_start)

old_block_mid = """                </div>

                {/* System Control Section */}
                <div className="bg-red-500/[0.02] backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 w-full relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>"""

new_block_mid = """                </div>

                {/* Divider */}
                <div className="w-full h-px bg-white/10"></div>

                {/* System Control Section */}
                <div className="w-full relative">"""

content = content.replace(old_block_mid, new_block_mid)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Merged boxes")
