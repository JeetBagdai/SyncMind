import re

with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern = re.compile(
    r'<div\s+key=\{i\}\s+ref=\{\(el\) => \{ msgRefs\.current\[i\] = el \}\}\s+className=\{`max-w-\[95%\] sm:max-w-\[85%\] md:max-w-\[80%\] rounded-2xl px-4 py-3 sm:px-5 sm:py-3\.5 markdown-body \$\{\s*msg\.role === \'user\' \? \'bubble-user self-end\' : \'bubble-ai self-start\'\s*?\}`\}\s+dangerouslySetInnerHTML=\{\{\s*__html: marked\.parse\(msg\.content \|\| \'\'\) \+ \(msg\.streaming \? \'<span class="stream-caret"></span>\' : \'\'\),\s*\}\}\s*/>',
    re.MULTILINE
)

new_render = """<div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end self-end' : 'items-start self-start'} max-w-[95%] sm:max-w-[85%] md:max-w-[80%]`}>
                        {msg.role === 'user' && msg.sender_name && (
                          <span className="text-[11px] text-white/50 mb-1 px-2 uppercase tracking-wider font-semibold opacity-70">{msg.sender_name}</span>
                        )}
                        <div
                          ref={(el) => { msgRefs.current[i] = el }}
                          className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 markdown-body w-full ${
                            msg.role === 'user' ? 'bubble-user' : 'bubble-ai'
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: marked.parse(msg.content || '') + (msg.streaming ? '<span class="stream-caret"></span>' : ''),
                          }}
                        />
                      </div>"""

content = pattern.sub(new_render, content)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Replaced render block.")
