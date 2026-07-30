import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const projectMatch = env.match(/VITE_FIREBASE_PROJECT_ID=(.*)/);
const PROJECT = projectMatch[1].trim();

const mappings = {
  'prob-sem3-1': { 
    inputFormat: 'Multiple lines of commands. First integer is N, followed by N lines. Commands can be:\n1 x - Insert x at beginning\n2 x - Insert x at end\n3 - Delete from beginning\n4 - Print list',
    outputFormat: 'For command 4, print the linked list elements separated by space. If list is empty, print "EMPTY".',
    note: 'Use 0-based indexing if required. Time complexity for insert should be O(1) or O(N) depending on the end.',
    sampleTestCases: [
      { input: '5\n1 10\n1 20\n2 30\n3\n4', output: '10 30' },
      { input: '3\n2 5\n3\n4', output: 'EMPTY' }
    ],
    starterCode: {
      python: 'class Node:\n    def __init__(self, data):\n        self.data = data\n        self.next = None\n\nclass LinkedList:\n    def __init__(self):\n        self.head = None\n        \n    # Implement methods here\n',
      java: 'class Node {\n    int data;\n    Node next;\n    Node(int d) { data = d; next = null; }\n}\n\nclass LinkedList {\n    Node head;\n    // Implement methods here\n}\n',
      cpp: '#include <iostream>\nusing namespace std;\n\nstruct Node {\n    int data;\n    Node* next;\n    Node(int d) { data = d; next = nullptr; }\n};\n\nclass LinkedList {\npublic:\n    Node* head;\n    LinkedList() { head = nullptr; }\n    // Implement methods here\n};\n'
    }
  },
  'prob-sem3-2': {
    inputFormat: 'The first line contains a string for the book title.\nThe second line contains a string for the author.',
    outputFormat: 'Print the book details after instantiation.\nThen print the book details after checking it out.',
    note: 'The Book class should encapsulate its properties properly.',
    sampleTestCases: [
      { input: 'The Great Gatsby\nF. Scott Fitzgerald', output: 'Title: The Great Gatsby, Author: F. Scott Fitzgerald, Checked Out: false\nTitle: The Great Gatsby, Author: F. Scott Fitzgerald, Checked Out: true' },
      { input: '1984\nGeorge Orwell', output: 'Title: 1984, Author: George Orwell, Checked Out: false\nTitle: 1984, Author: George Orwell, Checked Out: true' }
    ],
    starterCode: {
      java: 'class Book {\n    String title;\n    String author;\n    boolean isCheckedOut;\n\n    public Book(String title, String author) {\n        // Your code here\n    }\n\n    public void checkOut() {\n        // Your code here\n    }\n\n    public void returnBook() {\n        // Your code here\n    }\n\n    public String getDetails() {\n        // Your code here\n        return "";\n    }\n}\n',
      python: 'class Book:\n    def __init__(self, title, author):\n        pass\n\n    def check_out(self):\n        pass\n\n    def return_book(self):\n        pass\n\n    def get_details(self):\n        return ""\n',
      cpp: '#include <iostream>\n#include <string>\nusing namespace std;\n\nclass Book {\npublic:\n    string title;\n    string author;\n    bool isCheckedOut;\n\n    Book(string t, string a) {\n        // Your code here\n    }\n\n    void checkOut() {\n        // Your code here\n    }\n\n    void returnBook() {\n        // Your code here\n    }\n\n    string getDetails() {\n        // Your code here\n        return "";\n    }\n};\n'
    }
  }
};

async function patchProblems() {
  for (const [id, data] of Object.entries(mappings)) {
    console.log(`Updating ${id}...`);
    
    // We must send an array for sampleTestCases. 
    // And Map for starterCode
    const body = {
      fields: {
        inputFormat: { stringValue: data.inputFormat },
        outputFormat: { stringValue: data.outputFormat },
        note: { stringValue: data.note },
        sampleTestCases: {
          arrayValue: {
            values: data.sampleTestCases.map(tc => ({
              mapValue: {
                fields: {
                  input: { stringValue: tc.input },
                  output: { stringValue: tc.output }
                }
              }
            }))
          }
        },
        starterCode: {
          mapValue: {
            fields: {
              python: { stringValue: data.starterCode.python },
              java: { stringValue: data.starterCode.java },
              cpp: { stringValue: data.starterCode.cpp }
            }
          }
        }
      }
    };

    const updateMasks = Object.keys(body.fields).map(key => `updateMask.fieldPaths=${key}`).join('&');
    const updateUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/coding_problems/${id}?${updateMasks}`;

    const patchRes = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (patchRes.ok) {
      console.log(`Successfully updated ${id}`);
    } else {
      console.error(`Failed to update ${id}`, await patchRes.text());
    }
  }
}

patchProblems();
