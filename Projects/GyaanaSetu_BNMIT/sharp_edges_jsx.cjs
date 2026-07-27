const fs = require('fs');
const path = require('path');

function processDir(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace inline borderRadius styles
      let newContent = content.replace(/borderRadius:\s*['"]?[a-zA-Z0-9%\-\.\(\)\s]+['"]?/g, 'borderRadius: 0');
      
      if (content !== newContent) {
         fs.writeFileSync(fullPath, newContent);
         console.log('Updated', fullPath);
      }
    }
  });
}

processDir('src');
console.log('Done.');
