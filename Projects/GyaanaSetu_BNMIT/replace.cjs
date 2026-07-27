const fs = require('fs');
const path = require('path');

const orangeText = '#F77F32';
const orangeBg = '#fff2e8';

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/color:\s*'(#3aafa9|#2563eb|#d97706|#ef4444|#16a34a|#f59e0b)',\s*bg:\s*'(#e4f7ef|#e8f4fd|#fffbeb|#fee2e2|#f0fdf4|#fff3ec)'/g, 
                             "color: '" + orangeText + "', bg: '" + orangeBg + "'");

    content = content.replace(/\{\s*bg:\s*'(#e4f7ef|#e8f4fd|#fffbeb|#fee2e2|#f0fdf4|#fff3ec)',\s*text:\s*'(#3aafa9|#2563eb|#d97706|#ef4444|#16a34a|#f59e0b)'\s*\}/g,
                              "{ bg: '" + orangeBg + "', text: '" + orangeText + "' }");

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
}

['src/pages/Dashboard.jsx', 'src/pages/Timetable.jsx', 'src/pages/TimetableManage.jsx'].forEach(p => replaceInFile(path.join(process.cwd(), p)));
