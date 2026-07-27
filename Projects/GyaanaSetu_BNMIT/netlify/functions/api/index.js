const serverless = require('serverless-http')
const express = require('express')
const cors    = require('cors')
const ncert      = require('./src/ncert')
const attendance = require('./src/attendance')
const timetable  = require('./src/timetable')
const chatbot    = require('./src/chatbot')
const auth       = require('./src/auth')
const dashboard  = require('./src/dashboard')
const app = express()
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    /\.run\.app$/,
    'https://gyaanasetu-frontend-702753836810.asia-south1.run.app'
  ],
  credentials: true,
}))
app.use(express.json())
app.get('/ncert/lessons',   ncert.getLessons)
app.get('/ncert/lesson',    ncert.getLesson)
app.post('/ncert/progress', ncert.postProgress)
app.post('/ncert/quiz-result', ncert.postQuizResult)
app.get('/ncert/generate-quiz', ncert.generateQuiz)
app.post('/ncert/evaluate-answer', ncert.evaluateAnswer)
app.post('/attendance/session', attendance.createSession)
app.post('/attendance/mark',    attendance.markAttendance)
app.get('/attendance/report',   attendance.getReport)
app.post('/timetable/generate', timetable.generate)
app.post('/timetable/save',     timetable.save)
app.get('/timetable/get',       timetable.get)
app.post('/chatbot/message', chatbot.message)
app.post('/auth/setRole',  auth.setRole)
app.get('/auth/profile',   auth.getProfile)
app.get('/dashboard/stats', dashboard.getStats)
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'gyanasetu-api' }))
// Wrap the Express app for Netlify Functions
module.exports.handler = serverless(app, { basePath: '/api' })
