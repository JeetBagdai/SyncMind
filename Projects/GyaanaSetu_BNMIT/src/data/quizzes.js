// src/data/quizzes.js
// GyaanaSetu BNMIT — Quiz Data Scaffold
//
// Add your college subjects and quiz questions here.
// Each entry in QUIZ_DATA maps a subject key to an array of question objects.
//
// Question format:
// {
//   id: 'unique-id',
//   question: 'Question text',
//   options: ['Option A', 'Option B', 'Option C', 'Option D'],
//   answer: 'Option A',       // Must match one of the options exactly
//   explanation: 'Why A is correct...',
// }
//
// Example structure (replace with real college content):
// export const QUIZ_DATA = {
//   'data-structures': [
//     {
//       id: 'ds-1',
//       question: 'What is the time complexity of binary search?',
//       options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
//       answer: 'O(log n)',
//       explanation: 'Binary search halves the search space each step, giving O(log n).',
//     },
//   ],
// }

export const QUIZ_DATA = {
  // TODO: Add your college quiz content here
}

// Subject metadata — used to populate the Quiz page subject selector
export const SUBJECTS = [
  // TODO: Add your subjects. Example:
  // { id: 'data-structures', label: 'Data Structures', icon: '🌲' },
  // { id: 'dbms', label: 'Database Management', icon: '🗄️' },
  // { id: 'os', label: 'Operating Systems', icon: '💻' },
]
