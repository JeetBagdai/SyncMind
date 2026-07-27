const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/color:\s*'#d35400',\s*bg:\s*'#fff2e8'/g, 
                             "color: 'var(--color-orange)', bg: 'var(--color-orange-soft)'");

    content = content.replace(/\{\s*bg:\s*'#fff2e8',\s*text:\s*'#d35400'\s*\}/g,
                              "{ bg: 'var(--color-orange-soft)', text: 'var(--color-orange)' }");
                              
    // Also fix the other colors in Dashboard stats and gradients which were hardcoded
    content = content.replace(/background:\s*'#fff2e8',\s*color:\s*'#d35400'/g, 
                             "background: 'var(--color-orange-soft)', color: 'var(--color-orange)'");
    content = content.replace(/background:\s*'#ffedd5',\s*color:\s*'#e85d04'/g, 
                             "background: 'var(--color-orange-soft)', color: 'var(--color-orange)'");
    content = content.replace(/background:\s*'#fee2e2',\s*color:\s*'#ef4444'/g, 
                             "background: 'var(--color-orange-soft)', color: 'var(--color-orange)'");

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
}

['src/pages/Dashboard.jsx', 'src/pages/Timetable.jsx', 'src/pages/TimetableManage.jsx'].forEach(p => replaceInFile(path.join(process.cwd(), p)));
