// functions/src/dashboard/index.js
// Provides stats for the dashboard depending on user role

const { db, verifyToken } = require('../utils')

// GET /dashboard/stats?role=student&classId=default
async function getStats(req, res) {
  try {
    const decoded = await verifyToken(req)
    const { role, classId } = req.query

    if (role === 'teacher') {
      // Teacher Stats
      const today = new Date().toISOString().split('T')[0]
      const cid = classId || 'default'

      // 1. Students present today
      const attSnap = await db.collection('attendance')
        .doc(cid)
        .collection(today)
        .get()
      const studentsPresentToday = attSnap.size

      // 2. Aggregate individual student progress
      let progQuery = db.collection('progress')
      if (cid !== 'default') {
        progQuery = progQuery.where('grade', '==', cid)
      }
      const progSnap = await progQuery.get()
      
      const totalChaptersRead = progSnap.size
      
      // Get exact class size
      let usersQuery = db.collection('users').where('role', '==', 'student')
      if (cid !== 'default') {
        usersQuery = usersQuery.where('classId', '==', cid)
      }
      const allUsersSnap = await usersQuery.get()
      const estimatedClassSize = allUsersSnap.size || 1
      const avgChapters = totalChaptersRead / estimatedClassSize

      const studentMap = {}

      progSnap.forEach(doc => {
        const uid = doc.data().userId
        if (!studentMap[uid]) studentMap[uid] = { chaptersRead: 0, quizScores: [], weakTopics: new Set() }
        studentMap[uid].chaptersRead += 1
      })

      // 3. Aggregate quiz scores and weak topics
      let quizQuery = db.collection('quizResults')
      if (cid !== 'default') {
        quizQuery = quizQuery.where('grade', '==', cid)
      }
      const quizSnap = await quizQuery.get()
      
      quizSnap.forEach(doc => {
        const data = doc.data()
        const uid = data.userId
        if (!studentMap[uid]) studentMap[uid] = { chaptersRead: 0, quizScores: [], weakTopics: new Set() }
        
        studentMap[uid].quizScores.push(data.scorePercent || 0)
        if (data.weakTopics && Array.isArray(data.weakTopics)) {
          data.weakTopics.forEach(t => studentMap[uid].weakTopics.add(t))
        }
      })

      const uids = Object.keys(studentMap)
      const studentPerformance = []
      
      if (uids.length > 0) {
        // Firestore 'in' limits to 30, slice for safety in MVP
        const usersSnap = await db.collection('users').where('__name__', 'in', uids.slice(0, 30)).get()
        usersSnap.forEach(uDoc => {
          const uid = uDoc.id
          const sm = studentMap[uid]
          
          let avgScore = 0
          if (sm.quizScores && sm.quizScores.length > 0) {
            const sum = sm.quizScores.reduce((acc, val) => acc + val, 0)
            avgScore = Math.round(sum / sm.quizScores.length)
          }

          studentPerformance.push({
            id: uid,
            name: uDoc.data().name || 'Student',
            chaptersRead: sm.chaptersRead || 0,
            score: avgScore,
            weakTopics: sm.weakTopics ? Array.from(sm.weakTopics) : []
          })
        })
      }
      
      // Sort by score descending
      studentPerformance.sort((a, b) => b.score - a.score)

      return res.json({
        studentsPresentToday,
        totalChaptersRead,
        avgChapters: Math.round(avgChapters * 10) / 10,
        estimatedClassSize,
        studentPerformance,
      })
    } else {
      // Student Stats
      const userSnap = await db.collection('users').doc(decoded.uid).get()
      const userData = userSnap.data() || {}
      const attendanceDays = userData.totalAttendanceDays || 0

      // 1. Chapters Read
      const progSnap = await db.collection('progress')
        .where('userId', '==', decoded.uid)
        .get()
      
      const chaptersRead = progSnap.size

      // 2. Average Quiz Score
      const quizSnap = await db.collection('quizResults')
        .where('userId', '==', decoded.uid)
        .get()
      
      let totalScore = 0
      quizSnap.forEach(doc => {
        totalScore += (doc.data().scorePercent || 0)
      })
      const avgQuizScore = quizSnap.size > 0 ? totalScore / quizSnap.size : 0

      // 3. Progress Score (derived metric)
      const progressScore = (chaptersRead * 10) + Math.round(avgQuizScore)

      return res.json({
        chaptersRead,
        progressScore,
        attendanceDays
      })
    }
  } catch (err) {
    console.error('getStats error:', err)
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getStats }
