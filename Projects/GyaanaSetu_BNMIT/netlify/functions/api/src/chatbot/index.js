// functions/src/chatbot/index.js
// Groq LLaMA proxy — keeps API key server-side, adds college context

const Groq = require('groq-sdk')
const { verifyToken } = require('../utils')

const groq = new Groq({ apiKey: process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY || 'missing' })

const SYSTEM_PROMPT = `You are an AI Tutor for BNM Institute of Technology (BNMIT), Bangalore, India.
You help students and faculty with:
- Engineering and technology subjects (CS, ECE, Mechanical, Civil, etc.)
- Programming, algorithms, data structures, DBMS, OS, and related topics
- Exam preparation, study strategies, and concept explanations
- Academic schedule and attendance queries

Rules:
- Keep responses clear, concise, and technically accurate
- When explaining complex topics, break them into simple steps with examples
- Use real-world engineering examples where possible
- Be encouraging and constructive in feedback
- If asked about something outside engineering/education scope, gently redirect
- Respond in the same language the student writes in (English or any Indian language)
- Format responses with bullet points or numbered lists when explaining steps or procedures`

// POST /chatbot/message
async function message(req, res) {
  try {
    await verifyToken(req)
    const { messages = [], userRole = 'student', semester = '3' } = req.body

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' })
    }

    const systemWithContext = `${SYSTEM_PROMPT}
\nCurrent user role: ${userRole}
${semester ? `Current academic context: Semester ${semester}` : ''}`

    const completion = await groq.chat.completions.create({
      model:       'llama-3.3-70b-versatile',
      messages:    [
        { role: 'system', content: systemWithContext },
        ...messages.slice(-10).map(m => ({
          role:    m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      ],
      max_tokens:  512,
      temperature: 0.7,
    })

    const reply = completion.choices[0]?.message?.content || 'I could not generate a response.'
    return res.json({ reply })
  } catch (err) {
    console.error('chatbot error:', err)
    res.status(500).json({ error: err.message })
  }
}

module.exports = { message }
