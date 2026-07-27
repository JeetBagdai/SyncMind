const fs = require('fs');
const path = require('path');

function processDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      // Update css variables for border-radius
      if (content.includes('--border-radius-')) {
         content = content.replace(/(--border-radius-[a-z]+):\s*[^;]+;/g, '$1: 0px;');
         modified = true;
      }
      
      // Replace hardcoded border-radius (except 50% which are usually avatars/icons)
      let newContent = content.split('\n').map(line => {
         if (line.includes('border-radius:')) {
            // Keep 50% for circles, replace others
            if (!line.includes('50%')) {
               return line.replace(/border-radius:\s*[^;]+;/, 'border-radius: 0px;');
            }
         }
         return line;
      }).join('\n');
      
      if (content !== newContent || modified) {
         fs.writeFileSync(fullPath, newContent);
         console.log('Updated', fullPath);
      }
    }
  });
}

processDir('src');
console.log('Done.');
