const { db, bucket, verifyToken } = require('../utils')
const Groq = require('groq-sdk')

const groq = new Groq({ apiKey: process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY || 'missing' })

// Grade folder name map: Roman → grade number string used in GCS path
const GRADE_MAP = {
  IV: 'grade4', V: 'grade5', VI: 'grade6',
  VII: 'grade7', VIII: 'grade8', IX: 'grade9', X: 'grade10',
}

// GET /ncert/lessons?grade=VI&subject=Science
async function getLessons(req, res) {
  try {
    await verifyToken(req)
    const { grade, subject } = req.query
    if (!grade || !subject) return res.status(400).json({ error: 'grade and subject required' })

    const docId  = `${grade}_${subject}`
    const snap   = await db.collection('syllabusIndex').doc(docId).get()

    if (!snap.exists) {
      return res.json({ chapters: [] })
    }
    return res.json({ chapters: snap.data().chapters || [] })
  } catch (err) {
    console.error('getLessons error:', err)
    res.status(500).json({ error: err.message })
  }
}

async function getLesson(req, res) {
  try {
    await verifyToken(req)
    const { grade, subject, chapter } = req.query
    if (!grade || !subject || !chapter) {
      return res.status(400).json({ error: 'grade, subject, and chapter required' })
    }

    const gradeFolder = GRADE_MAP[grade] || grade.toLowerCase()
    const filePath    = `${gradeFolder}/${subject}/${chapter}`

    // Direct public URL — bucket must have allUsers:objectViewer IAM
    const bucketName = process.env.GCS_BUCKET || 'gyanasetu-ncert'
    const url = `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(gradeFolder)}/${encodeURIComponent(subject)}/${encodeURIComponent(chapter)}`

    return res.json({ url })
  } catch (err) {
    console.error('getLesson error:', err)
    res.status(500).json({ error: err.message })
  }
}

// POST /ncert/progress
async function postProgress(req, res) {
  try {
    const decoded = await verifyToken(req)
    const { grade, subject, chapterId, completedAt } = req.body
    await db.collection('progress').add({
      userId: decoded.uid,
      grade, subject, chapterId, completedAt,
      createdAt: new Date().toISOString(),
    })
    return res.json({ success: true })
  } catch (err) {
    console.error('postProgress error:', err)
    res.status(500).json({ error: err.message })
  }
}

// POST /ncert/quiz-result
async function postQuizResult(req, res) {
  try {
    const decoded = await verifyToken(req)
    const { grade, subject, chapter, scorePercent, weakTopics } = req.body
    await db.collection('quizResults').add({
      userId: decoded.uid,
      grade, subject, chapter,
      scorePercent,
      weakTopics: weakTopics || [],
      createdAt: new Date().toISOString(),
    })
    return res.json({ success: true })
  } catch (err) {
    console.error('postQuizResult error:', err)
    res.status(500).json({ error: err.message })
  }
}

// GET /ncert/generate-quiz
async function generateQuiz(req, res) {
  try {
    await verifyToken(req)
    const { semester, subject, module } = req.query
    if (!semester || !subject || !module) {
      return res.status(400).json({ error: 'semester, subject, and module required' })
    }

    const prompt = `You are an expert Engineering Professor for Semester ${semester} ${subject}.
Generate exactly 20 college-level questions for the module "${module}".
You MUST respond with a valid JSON object containing a single key "questions" which is an array of 20 question objects.
The questions MUST follow this exact distribution:
- 10 MCQs (Direct factual questions)
- 1 Case-Based (A scenario followed by a subjective question)
- 5 Theory-Based (Conceptual subjective questions)
- 4 Application-Based (Real-world application subjective questions)

For each question object, use this exact structure:
{
  "id": <number 1-20>,
  "type": "mcq" or "subjective",
  "category": "MCQ", "Case-Based", "Theory-Based", or "Application-Based",
  "topic": "<Subtopic name>",
  "question": "<The question text. For case-based, include the scenario here.>",
  "options": ["<A>", "<B>", "<C>", "<D>"], // Required ONLY if type is "mcq". For subjective, omit this completely.
  "correctIndex": <0, 1, 2, or 3>, // Required ONLY if type is "mcq". For subjective, omit this completely.
  "expectedAnswer": "<For subjective: detailed college-level expected answer and key technical points. For MCQ: short technical explanation.>"
}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const resultText = completion.choices[0]?.message?.content || '{"questions": []}'
    const resultJson = JSON.parse(resultText)
    return res.json(resultJson)
  } catch (err) {
    console.error('generateQuiz error:', err)
    res.status(500).json({ error: err.message, questions: [] })
  }
}

// POST /ncert/evaluate-answer
async function evaluateAnswer(req, res) {
  try {
    await verifyToken(req)
    const { question, expectedAnswer, imageBase64 } = req.body
    if (!question || !expectedAnswer || !imageBase64) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const prompt = `You are an expert Engineering Professor. 
A college student has submitted a handwritten answer to the following question:
Question: "${question}"
Expected Technical Answer/Key Points: "${expectedAnswer}"

Please read the attached handwritten answer.
Evaluate it against the expected answer and provide a JSON response with this exact structure:
{
  "score": <number out of 5 based on how well it matches the expected points>,
  "feedback": "<Short constructive technical feedback on what they got right>",
  "missedPoints": "<What exact key engineering points, formulas, or keywords they missed, if any>"
}
Ensure the response is ONLY valid JSON, no markdown formatting like \`\`\`json.`

    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ],
      temperature: 0.3
    })

    const resultText = completion.choices[0]?.message?.content || '{"score": 0, "feedback": "Could not evaluate", "missedPoints": "Error"}'
    
    // Clean potential markdown blocks
    const cleanedText = resultText.replace(/```json/g, '').replace(/```/g, '').trim()
    const resultJson = JSON.parse(cleanedText)
    return res.json(resultJson)

  } catch (err) {
    console.error('evaluateAnswer error:', err)
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getLessons, getLesson, postProgress, postQuizResult, generateQuiz, evaluateAnswer }
