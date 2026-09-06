import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Expand max width from max-w-2xl to max-w-4xl
content = content.replace("max-w-2xl", "max-w-5xl")

# 2. Upgrade the Cards to a more glassy look matching the pill
old_card1 = """<div className="bg-[var(--panel-bg)] border border-[var(--nav-border)] rounded-xl p-6 w-full shadow-lg">"""
new_card1 = """<div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-8 w-full shadow-2xl">"""
content = content.replace(old_card1, new_card1)

old_card2 = """<div className="bg-[var(--panel-bg)] border border-red-900/30 rounded-xl p-6 w-full relative overflow-hidden shadow-lg">"""
new_card2 = """<div className="bg-red-500/[0.02] backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 w-full relative overflow-hidden shadow-2xl">"""
content = content.replace(old_card2, new_card2)

# 3. Change Time Picker to a sleek Text Input to bypass OS-level styling
old_time_picker = """<input 
                          type="time"
                          id="shutdown-time"
                          className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-red-500/50 focus:bg-red-500/20 transition-all text-red-100 shadow-inner [color-scheme:dark]"
                        />"""

new_time_picker = """<input 
                          type="text"
                          id="shutdown-time"
                          placeholder="HH:MM (24h)"
                          className="w-32 bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-red-500/50 focus:bg-red-500/10 transition-all text-red-100 placeholder-red-500/30 shadow-inner text-center font-mono tracking-wider"
                        />"""
content = content.replace(old_time_picker, new_time_picker)

# 4. Update the onClick validation for the new text input
old_validation = """const timeVal = document.getElementById('shutdown-time').value;
                              if (!timeVal) {
                                alert("Please select a time first.");
                                return;
                              }"""

new_validation = """const timeVal = document.getElementById('shutdown-time').value.trim();
                              if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeVal)) {
                                alert("Please enter a valid time in HH:MM format (24-hour). Example: 18:30");
                                return;
                              }"""
content = content.replace(old_validation, new_validation)


with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Applied final UI polish")
