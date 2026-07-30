// src/pages/Quiz.jsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getToken } from '../services/auth'
import { generateQuiz, evaluateAnswer, postQuizResult } from '../services/api'
import {
  Clock, ChevronRight, ChevronLeft, CheckCircle2,
  XCircle, AlertTriangle, BarChart2, RotateCcw, BookOpen, Brain, Camera, Loader
} from 'lucide-react'
import './Quiz.css'

// ── Quiz timer constant ─────────────────────────────
const QUIZ_DURATION_SECONDS = 20 * 60   // 20 minutes

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function analyseWeakTopics(questions, answers) {
  const topicStats = {}
  questions.forEach((q, i) => {
    const topic = q.topic || 'General'
    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 }
    
    const ans = answers[i]
    if (ans) {
      if (q.type === 'mcq') {
        topicStats[topic].total += 1
        if (ans.optionIndex === q.correctIndex) topicStats[topic].correct += 1
      } else {
        topicStats[topic].total += 1
        topicStats[topic].correct += (ans.score || 0) / 5
      }
    } else {
      topicStats[topic].total += 1
    }
  })
  const results = Object.entries(topicStats).map(([topic, { correct, total }]) => ({
    topic,
    score: Math.round((correct / total) * 100),
    correct: Math.round(correct * 10) / 10,
    total,
    isWeak: correct / total < 0.6,
  }))
  return results.sort((a, b) => a.score - b.score)
}

export default function Quiz() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const { semester = '3', subject = 'Science', module = '', timeSpent = 0 } = location.state || {}

  const [phase, setPhase] = useState('loading')
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [current, setCurrent] = useState(0)
  const [quizSeconds, setQuizSeconds] = useState(QUIZ_DURATION_SECONDS)
  const [showExplanation, setShowExplanation] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const timerRef = useRef(null)

  const fetchQuestions = async () => {
    setPhase('loading')
    clearInterval(timerRef.current)
    setAnswers({})
    setCurrent(0)
    setQuizSeconds(QUIZ_DURATION_SECONDS)
    setShowExplanation(false)
    
    try {
      const token = await getToken()
      const data = await generateQuiz(semester, subject, module || subject, token)
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions)
      } else {
        setQuestions([]) // Error fallback
      }
    } catch (e) {
      console.error(e)
      setQuestions([])
    }
    setPhase('active')
  }

  // ── Fetch AI Questions ─────────────────────────────
  useEffect(() => {
    fetchQuestions()
  }, [semester, subject, module])

  // ── Quiz countdown timer ───────────────────────
  useEffect(() => {
    if (phase !== 'active') return
    timerRef.current = setInterval(() => {
      setQuizSeconds(s => {
        if (s <= 1) {
          clearInterval(timerRef.current)
          setPhase('timeout')
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase])

  // ── Answer Actions ───────────────────────────
  const selectAnswer = (optIdx) => {
    if (answers[current] !== undefined) return
    setAnswers(prev => ({ ...prev, [current]: { optionIndex: optIdx } }))
    setShowExplanation(true)
  }

  const handleScanSubmit = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setEvaluating(true)
    try {
      const base64 = await fileToBase64(file)
      const q = questions[current]
      const token = await getToken()
      const result = await evaluateAnswer({
        question: q.question,
        expectedAnswer: q.expectedAnswer,
        imageBase64: base64
      }, token)
      
      setAnswers(prev => ({ ...prev, [current]: { ...result, isSubjective: true } }))
      setShowExplanation(true)
    } catch (err) {
      alert("Failed to evaluate answer. Please try again.")
    } finally {
      setEvaluating(false)
    }
  }

  const handleQuizComplete = async () => {
    clearInterval(timerRef.current)
    setPhase('results')
    
    const tCorrectMCQ = questions.filter((q, i) => q.type === 'mcq' && answers[i]?.optionIndex === q.correctIndex).length
    const tScoreSubj = questions.filter(q => q.type !== 'mcq').reduce((sum, q, i) => sum + ((answers[i]?.score || 0) / 5), 0)
    const tCorrect = tCorrectMCQ + tScoreSubj
    
    const sPercent = questions.length > 0 ? Math.round((tCorrect / questions.length) * 100) : 0
    const analysis = analyseWeakTopics(questions, answers)
    const analysisObj = {}
    analysis.forEach(a => analysisObj[a.topic] = a)

    try {
      const token = await getToken()
      await postQuizResult({
        semester,
        subject,
        module: module || subject,
        scorePercent: sPercent,
        weakTopics: Object.keys(analysisObj).filter(k => analysisObj[k].isWeak)
      }, token)
    } catch (err) {
      console.error('Failed to save quiz results:', err)
    }
  }

  const goNext = () => {
    setShowExplanation(false)
    if (current < questions.length - 1) setCurrent(c => c + 1)
    else handleQuizComplete()
  }

  const goPrev = () => {
    setShowExplanation(false)
    if (current > 0) setCurrent(c => c - 1)
  }

  const submitEarly = () => handleQuizComplete()
  
  const retake = () => {
    clearInterval(timerRef.current)
    setAnswers({})
    setCurrent(0)
    setQuizSeconds(QUIZ_DURATION_SECONDS)
    setShowExplanation(false)
    setPhase('loading')
    window.location.reload()
  }

  // ── Derived results ────────────────────────────
  const totalAnswered = Object.keys(answers).length
  const totalCorrectMCQ = questions.filter((q, i) => q.type === 'mcq' && answers[i]?.optionIndex === q.correctIndex).length
  const totalScoreSubj = questions.filter(q => q.type !== 'mcq').reduce((sum, q, i) => sum + ((answers[i]?.score || 0) / 5), 0)
  const totalCorrect = totalCorrectMCQ + totalScoreSubj
  const scorePercent = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0
  const topicAnalysis = phase === 'results' || phase === 'timeout' ? analyseWeakTopics(questions, answers) : []
  const weakTopics = topicAnalysis.filter(t => t.isWeak)
  const timerCritical = quizSeconds <= 120

  // ════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════

  if (phase === 'loading') {
    return (
      <div className="page-inner quiz-page">
        <div className="quiz-loading">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
            <Brain size={52} color="var(--accent-primary)" />
          </motion.div>
          <h2 className="quiz-loading-title">Generating your quiz...</h2>
          <p className="text-muted text-sm">
            AI is crafting 20 college-level questions for<br />
            <strong>{module || subject}</strong> • Semester {semester}
          </p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="page-inner quiz-page">
        <div className="quiz-loading">
          <AlertTriangle size={52} color="#ef4444" />
          <h2 className="quiz-loading-title">Failed to Generate</h2>
          <button className="btn btn-primary" onClick={fetchQuestions}>Try Again</button>
        </div>
      </div>
    )
  }

  if (phase === 'results' || phase === 'timeout') {
    return (
      <div className="page-inner quiz-page">
        <div className="page-header">
          <h1 className="page-title">🎯 Quiz Results</h1>
          <p className="page-subtitle">{module || subject} • Semester {semester}</p>
        </div>

        <div className="results-layout">
          {/* Score Card */}
          <motion.div className="card score-card text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            {phase === 'timeout' && <div className="timeout-badge"><Clock size={14} /> Time's up!</div>}
            <div className={`score-ring ${scorePercent >= 70 ? 'good' : scorePercent >= 40 ? 'average' : 'poor'}`}>
              <span className="score-percent">{scorePercent}%</span>
            </div>
            <h2 className="score-label">
              {scorePercent >= 70 ? '🎉 Great Work!' : scorePercent >= 40 ? '📚 Keep Practising' : '💪 Needs Improvement'}
            </h2>
            <p className="text-muted text-sm" style={{ marginTop: '0.5rem' }}>
              {Math.round(totalCorrect * 10)/10} / {questions.length} points · {totalAnswered} answered
            </p>
            <div className="results-actions">
              <button className="btn btn-secondary" onClick={retake}><RotateCcw size={14} /> Retake Quiz</button>
              <button className="btn btn-primary" onClick={() => navigate('/learning')}><BookOpen size={14} /> Back to Learning</button>
            </div>
          </motion.div>

          {/* Weak Topics */}
          <div className="analysis-panel">
            <div className="analysis-header">
              <BarChart2 size={18} color="var(--accent-primary)" />
              <h2 className="panel-title">Topic Analysis</h2>
            </div>
            <div className="topic-list">
              {topicAnalysis.map((t, i) => (
                <motion.div key={t.topic} className={`topic-row ${t.isWeak ? 'weak' : 'strong'}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <div className="topic-info">
                    <span className="topic-name">{t.topic}</span>
                    <span className="topic-stat">{t.correct}/{t.total} pts</span>
                  </div>
                  <div className="topic-bar-wrap">
                    <motion.div className="topic-bar-fill" style={{ background: t.isWeak ? '#ef4444' : '#22c55e' }} initial={{ width: 0 }} animate={{ width: `${t.score}%` }} transition={{ delay: i * 0.06 + 0.2, duration: 0.5 }} />
                  </div>
                  <span className={`topic-score ${t.isWeak ? 'score-weak' : 'score-strong'}`}>{t.score}%</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Review List */}
          <div className="review-panel">
            <h2 className="panel-title" style={{ marginBottom: '1rem' }}>Question Review</h2>
            <div className="review-list">
              {questions.map((q, i) => {
                const ans = answers[i]
                const skipped = ans === undefined
                let isCorrect = false
                if (ans && q.type === 'mcq') isCorrect = ans.optionIndex === q.correctIndex
                if (ans && q.type !== 'mcq') isCorrect = ans.score >= 3
                
                return (
                  <details key={q.id} className={`review-item ${skipped ? 'skipped' : isCorrect ? 'correct' : 'wrong'}`}>
                    <summary className="review-summary">
                      {skipped ? <span className="review-dot skipped-dot" /> : isCorrect ? <CheckCircle2 size={15} color="#22c55e" /> : <XCircle size={15} color="#ef4444" />}
                      <span className="review-q-text">Q{i + 1}. [{q.category}] {q.question}</span>
                    </summary>
                    <div className="review-body">
                      {q.type === 'mcq' ? (
                        q.options.map((opt, oi) => (
                          <div key={oi} className={`review-option ${oi === q.correctIndex ? 'correct-opt' : ''} ${oi === ans?.optionIndex && !isCorrect ? 'wrong-opt' : ''}`}>
                            {String.fromCharCode(65 + oi)}. {opt}
                          </div>
                        ))
                      ) : (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                          <p style={{ fontWeight: 600, color: 'var(--primary)' }}>Score: {ans?.score || 0} / 5</p>
                          {ans?.feedback && <p style={{ marginTop: '0.5rem' }}><strong>Feedback:</strong> {ans.feedback}</p>}
                          {ans?.missedPoints && <p style={{ marginTop: '0.5rem', color: '#ef4444' }}><strong>Missed Points:</strong> {ans.missedPoints}</p>}
                          <p style={{ marginTop: '1rem', color: '#16a34a' }}><strong>Expected Answer:</strong> {q.expectedAnswer}</p>
                        </div>
                      )}
                      {q.expectedAnswer && q.type === 'mcq' && <p className="review-explanation">💡 {q.expectedAnswer}</p>}
                    </div>
                  </details>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Active Quiz ─────────────────────────────────
  const q = questions[current]
  const ans = answers[current]
  const isAnswered = ans !== undefined
  const progress = ((current + (isAnswered ? 1 : 0)) / questions.length) * 100

  return (
    <div className="page-inner quiz-page">
      <div className="quiz-header">
        <div className="quiz-meta">
          <h1 className="quiz-chapter-title">{module || subject}</h1>
          <p className="text-muted text-sm">Semester {semester} · {questions.length} Questions</p>
        </div>
        <div className={`quiz-timer ${timerCritical ? 'critical' : ''}`}>
          <Clock size={15} /><span>{formatTime(quizSeconds)}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchQuestions} title="Generate new questions">
            <RotateCcw size={14} /> Refresh
          </button>
          <button className="btn btn-secondary btn-sm" onClick={submitEarly}>Submit Early</button>
        </div>
      </div>

      <div className="quiz-progress-bar">
        <motion.div className="quiz-progress-fill" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
      </div>
      <p className="quiz-progress-label">
        Question {current + 1} of {questions.length} <span>· {totalAnswered} answered</span>
      </p>

      <AnimatePresence mode="wait">
        <motion.div key={current} className="card question-card" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <div className="question-topic-tag">{q?.topic}</div>
            <div className="question-topic-tag" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{q?.category}</div>
          </div>
          <p className="question-text">{q?.question}</p>

          {q?.type === 'mcq' ? (
            <div className="options-grid">
              {q?.options?.map((opt, oi) => {
                let cls = 'option-btn'
                if (isAnswered) {
                  if (oi === q.correctIndex) cls += ' opt-correct'
                  else if (oi === ans?.optionIndex) cls += ' opt-wrong'
                  else cls += ' opt-disabled'
                }
                return (
                  <motion.button key={oi} className={cls} onClick={() => selectAnswer(oi)} whileHover={!isAnswered ? { scale: 1.01 } : {}} whileTap={!isAnswered ? { scale: 0.99 } : {}}>
                    <span className="option-label">{String.fromCharCode(65 + oi)}</span>
                    <span className="option-text">{opt}</span>
                    {isAnswered && oi === q.correctIndex && <CheckCircle2 size={16} />}
                    {isAnswered && oi === ans?.optionIndex && oi !== q.correctIndex && <XCircle size={16} />}
                  </motion.button>
                )
              })}
            </div>
          ) : (
            <div className="subjective-upload" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              {!isAnswered ? (
                <>
                  <p className="text-muted text-sm text-center">Write your answer in a notebook, then tap below to scan and grade it instantly!</p>
                  <label className="btn btn-primary" style={{ padding: '1rem 2rem', cursor: 'pointer', opacity: evaluating ? 0.7 : 1 }}>
                    {evaluating ? <Loader size={20} className="spin-anim" /> : <Camera size={20} />}
                    {evaluating ? 'Grading Answer...' : 'Scan Answer'}
                    <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleScanSubmit} disabled={evaluating} />
                  </label>
                </>
              ) : (
                <div style={{ width: '100%', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 0, padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', marginBottom: '1rem' }}>
                    <CheckCircle2 size={24} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Score: {ans.score} / 5</h3>
                  </div>
                  {ans.feedback && <p style={{ marginBottom: '1rem', color: '#15803d' }}><strong>Feedback:</strong> {ans.feedback}</p>}
                  {ans.missedPoints && <p style={{ marginBottom: '1rem', color: '#dc2626' }}><strong>Missed NCERT Points:</strong> {ans.missedPoints}</p>}
                  <p style={{ color: '#0f766e', fontSize: '0.9rem' }}><strong>Expected Answer:</strong> {q.expectedAnswer}</p>
                </div>
              )}
            </div>
          )}

          <AnimatePresence>
            {showExplanation && isAnswered && q?.type === 'mcq' && q?.expectedAnswer && (
              <motion.div className={`explanation-box ${ans.optionIndex === q.correctIndex ? 'exp-correct' : 'exp-wrong'}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                {ans.optionIndex === q.correctIndex ? <CheckCircle2 size={15} color="#16a34a" /> : <XCircle size={15} color="#ef4444" />}
                <p className="explanation-text">{q.expectedAnswer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      <div className="quiz-nav">
        <button className="btn btn-secondary" onClick={goPrev} disabled={current === 0}>
          <ChevronLeft size={16} /> Previous
        </button>
        <div className="dot-nav" style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
          {questions.map((_, i) => {
            const isAns = answers[i] !== undefined
            let dotCls = ''
            if (isAns) {
              if (questions[i].type === 'mcq') dotCls = answers[i].optionIndex === questions[i].correctIndex ? 'dot-correct' : 'dot-wrong'
              else dotCls = answers[i].score >= 3 ? 'dot-correct' : 'dot-wrong'
            }
            return <button key={i} className={`dot ${i === current ? 'dot-active' : ''} ${dotCls}`} onClick={() => { setShowExplanation(false); setCurrent(i) }} />
          })}
        </div>
        {current < questions.length - 1 ? (
          <button className="btn btn-primary" onClick={goNext}>Next <ChevronRight size={16} /></button>
        ) : (
          <button className="btn btn-primary complete-btn" onClick={submitEarly}><CheckCircle2 size={16} /> Finish</button>
        )}
      </div>
    </div>
  )
}
