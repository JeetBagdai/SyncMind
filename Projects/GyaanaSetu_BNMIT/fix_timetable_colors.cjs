const fs = require('fs');

const cssAdditionsLight = `
  /* Semester Colors for Timetable */
  --sem-1-bg: #fff2e8; --sem-1-text: #d35400;
  --sem-2-bg: #e4f7ef; --sem-2-text: #3aafa9;
  --sem-3-bg: #e8f4fd; --sem-3-text: #2563eb;
  --sem-4-bg: #fffbeb; --sem-4-text: #d97706;
  --sem-5-bg: #fee2e2; --sem-5-text: #ef4444;
  --sem-6-bg: #f0fdf4; --sem-6-text: #16a34a;
  --sem-7-bg: #f3e8ff; --sem-7-text: #9333ea;
  --sem-8-bg: #f0f9ff; --sem-8-text: #0284c7;
`;

const cssAdditionsDark = `
    /* Semester Colors for Timetable (Dark Mode) */
    --sem-1-bg: #2e1c08; --sem-1-text: #e67e22;
    --sem-2-bg: #0d2b27; --sem-2-text: #4ecdc4;
    --sem-3-bg: #10213d; --sem-3-text: #60a5fa;
    --sem-4-bg: #2e2308; --sem-4-text: #fbbf24;
    --sem-5-bg: #301414; --sem-5-text: #f87171;
    --sem-6-bg: #0e2a16; --sem-6-text: #4ade80;
    --sem-7-bg: #27143f; --sem-7-text: #c084fc;
    --sem-8-bg: #0b253a; --sem-8-text: #38bdf8;
`;

let cssContent = fs.readFileSync('src/styles/index.css', 'utf8');
cssContent = cssContent.replace('  /* Shorthand aliases used throughout components */', cssAdditionsLight + '\n  /* Shorthand aliases used throughout components */');
cssContent = cssContent.replace('    /* Shorthand aliases — dark overrides */', cssAdditionsDark + '\n    /* Shorthand aliases — dark overrides */');
fs.writeFileSync('src/styles/index.css', cssContent);

let timetableContent = fs.readFileSync('src/pages/Timetable.jsx', 'utf8');
timetableContent = timetableContent.replace(/const SEM_COLORS = \[.*?\]/s, `const SEM_COLORS = [
  { bg: 'var(--sem-1-bg)', text: 'var(--sem-1-text)' },
  { bg: 'var(--sem-2-bg)', text: 'var(--sem-2-text)' },
  { bg: 'var(--sem-3-bg)', text: 'var(--sem-3-text)' },
  { bg: 'var(--sem-4-bg)', text: 'var(--sem-4-text)' },
  { bg: 'var(--sem-5-bg)', text: 'var(--sem-5-text)' },
  { bg: 'var(--sem-6-bg)', text: 'var(--sem-6-text)' },
  { bg: 'var(--sem-7-bg)', text: 'var(--sem-7-text)' },
  { bg: 'var(--sem-8-bg)', text: 'var(--sem-8-text)' },
]`);
fs.writeFileSync('src/pages/Timetable.jsx', timetableContent);

console.log('Restored Timetable semester colors with dark mode support.');
