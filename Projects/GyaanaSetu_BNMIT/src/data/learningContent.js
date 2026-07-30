// src/data/learningContent.js

export const SEMESTERS = [
  { id: '3', label: 'Semester 3' },
  { id: '4', label: 'Semester 4' },
  { id: '5', label: 'Semester 5' },
  { id: '6', label: 'Semester 6' },
  { id: '7', label: 'Semester 7' },
  { id: '8', label: 'Semester 8' }
]

export const SUBJECTS_BY_SEM = {
  3: ['Fourier Transform, Mathematical Logic & Advanced Linear Algebra','Computer Organization and Architecture','Artificial Intelligence','Data Structures & Applications','Microcontroller and Embedded Systems','Object Oriented Programming using Java (Lab)'],
  4: ['Statistics, Probability and Graph Theory','Operating System','Database Management System','Design and Analysis of Algorithms','Machine Learning','Cloud Computing & Applications (Lab)'],
  5: ['Software Engineering, Project Management & Finance','Automata Theory & Computations','Computer Networks & Security','Advanced Machine Learning','Virtual Reality & Augmented Reality (Lab)','Open Elective - I'],
  6: ['Deep Learning','Natural Language Processing','Generative Artificial Intelligence','Image Processing & Computer Vision (Lab)','Professional Elective - I','Professional Elective - II (MOOC)'],
  7: ['Agentic Artificial Intelligence','Professional Elective - III','Professional Elective - IV (MOOC)','Research Methodology & Intellectual Property Rights'],
  8: ['Professional Elective - V (MOOC)'],
}

// Map Subject -> Modules
export const MODULES_BY_SUBJECT = {
  'Computer Organization and Architecture': [
    { id: 'COA_M1', title: 'Module 1', file: '/content/Sem3/COA/Module_1.pdf' },
    { id: 'COA_M2', title: 'Module 2', file: '/content/Sem3/COA/Module_2(Second Half).pdf' },
    { id: 'COA_M3', title: 'Module 3', file: '/content/Sem3/COA/Module_3.pdf' },
    { id: 'COA_M4', title: 'Module 4', file: '/content/Sem3/COA/Module_4.pdf' },
    { id: 'COA_M5', title: 'Module 5', file: '/content/Sem3/COA/Module_5.pdf' }
  ]
}

// Fallback generator for subjects without explicit PDFs yet
export function getModulesForSubject(subject) {
  if (MODULES_BY_SUBJECT[subject]) {
    return MODULES_BY_SUBJECT[subject]
  }
  // Return empty list so we can show "Coming soon" state
  return []
}
