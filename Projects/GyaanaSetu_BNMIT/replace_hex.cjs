const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace all instances (case-insensitive) of #d35400 with #ea580c
    content = content.replace(/#d35400/gi, '#ea580c');
    
    // Also replace URL encoded versions in case any exist (e.g. %23d35400)
    content = content.replace(/%23d35400/gi, '%23ea580c');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
}

function traverseDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') traverseDir(fullPath);
        } else if (fullPath.endsWith('.css') || fullPath.endsWith('.jsx')) {
            replaceInFile(fullPath);
        }
    });
}

traverseDir(path.join(process.cwd(), 'src'));
console.log('Done');
