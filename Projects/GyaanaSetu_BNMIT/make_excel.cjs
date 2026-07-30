// make_excel.cjs — generate styled Excel from credentials CSV
const path  = require('path')
const fs    = require('fs')

// Use the xlsx package bundled with the netlify functions
const XLSX  = require('./node_modules/xlsx')

const rows = [
  ['#', 'Name', 'Designation', 'Email', 'Password'],
  // --- data ---
  [1,  'Dr. Sheba Selvam',             'Professor & HOD',      'shebaselvam@bnmit.in',           'Bnmit@Sheba2024'],
  [2,  'Dr. Divyashree B A',           'Professor',            'divyashreeba@bnmit.in',          'Bnmit@Divyashree2024'],
  [3,  'Dr. Tejaswini R Murgod',       'Professor',            'tejaswinirmurgod@bnmit.in',      'Bnmit@Tejaswini2024'],
  [4,  'Dr. Kakoli Bora',              'Associate Professor',  'kakolibora@bnmit.in',            'Bnmit@Kakoli2024'],
  [5,  'Dr. Sunitha R',                'Associate Professor',  'sunithar@bnmit.in',              'Bnmit@Sunitha2024'],
  [6,  'Dr. Anitha C',                 'Associate Professor',  'anithac@bnmit.in',               'Bnmit@Anitha2024'],
  [7,  'Dr. Mahanthesha U',            'Associate Professor',  'mahantheshau@bnmit.in',          'Bnmit@Mahanthesha2024'],
  [8,  'Dr. Nagarathna C R',           'Associate Professor',  'nagarathnacr@bnmit.in',          'Bnmit@Nagarathna2024'],
  [9,  'Dr. VANI K A',                 'Associate Professor',  'vanika@bnmit.in',                'Bnmit@VANI2024'],
  [10, 'Dr. Halaharvi Keerthi',        'Associate Professor',  'halaharvikeerthi@bnmit.in',      'Bnmit@Halaharvi2024'],
  [11, 'Mr. Mohanesh B M',             'Assistant Professor',  'mohaneshbm@bnmit.in',            'Bnmit@Mohanesh2024'],
  [12, 'Mrs. Pavithra H C',            'Assistant Professor',  'pavithrahc@bnmit.in',            'Bnmit@Pavithra2024'],
  [13, 'Mrs. Poornima N',              'Assistant Professor',  'poorniman@bnmit.in',             'Bnmit@Poornima2024'],
  [14, 'Mrs. Arpitha Devangavi',       'Assistant Professor',  'arpithadevangavi@bnmit.in',      'Bnmit@Arpitha2024'],
  [15, 'Mrs. Pankaja R',               'Assistant Professor',  'pankajar@bnmit.in',              'Bnmit@Pankaja2024'],
  [16, 'Mr. Pradip Kumar Das',         'Professor of Practice','pradipkumardas@bnmit.in',        'Bnmit@Pradip2024'],
  [17, 'Mrs. Nayana',                  'Assistant Professor',  'nayana@bnmit.in',                'Bnmit@Nayana2024'],
  [18, 'Mrs. Kavya M S',              'Assistant Professor',  'kavyams@bnmit.in',               'Bnmit@Kavya2024'],
  [19, 'Mrs. Abhilasha P Kumar',       'Assistant Professor',  'abhilashapkumar@bnmit.in',       'Bnmit@Abhilasha2024'],
  [20, 'Mrs. Divya M S',              'Assistant Professor',  'divyams@bnmit.in',               'Bnmit@Divya2024'],
  [21, 'Mrs. Trupti Dattatraya Hegde', 'Assistant Professor',  'truptidattatrayahegde@bnmit.in', 'Bnmit@Trupti2024'],
  [22, 'Mrs. Kruthi P',               'Assistant Professor',  'kruthip@bnmit.in',               'Bnmit@Kruthi2024'],
  [23, 'Mrs. Kirti Pavan',            'Assistant Professor',  'kirtipavan@bnmit.in',            'Bnmit@Kirti2024'],
  [24, 'Mrs. Shravya G Gowda',        'Assistant Professor',  'shravyaggowda@bnmit.in',         'Bnmit@Shravya2024'],
]

const wb = XLSX.utils.book_new()
const ws = XLSX.utils.aoa_to_sheet(rows)

// Column widths
ws['!cols'] = [
  { wch: 4 },   // #
  { wch: 34 },  // Name
  { wch: 22 },  // Designation
  { wch: 38 },  // Email
  { wch: 24 },  // Password
]

XLSX.utils.book_append_sheet(wb, ws, 'Teacher Credentials')

const outPath = path.join(__dirname, 'teacher_credentials.xlsx')
XLSX.writeFile(wb, outPath)
console.log(`✅ Excel file saved to: ${outPath}`)
