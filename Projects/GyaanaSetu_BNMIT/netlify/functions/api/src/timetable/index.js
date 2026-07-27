// functions/src/timetable/index.js
// Advanced constraint-satisfaction timetable generator for dual sections

const { db, verifyToken } = require('../utils')

const DAYS   = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const TIMES_815 = [
  '8:15 - 9:10',
  '9:10 - 10:05',
  '10:05 - 10:35 Break',
  '10:35 - 11:35',
  '11:35 - 12:35',
  '12:35 - 1:15 Lunch',
  '1:15 - 2:10',
  '2:10 - 3:05',
  '3:05 - 4:00'
]

const TIMES_830 = [
  '8:30 - 9:30',
  '9:30 - 10:30',
  '10:30 - 11:00 Break',
  '11:00 - 12:00',
  '12:00 - 1:00',
  '1:00 - 1:40 Lunch',
  '1:40 - 2:40',
  '2:40 - 3:40',
  '3:40 - 4:30'
]

function generateDualSchedule(subjectConfig, timeslots, busy) {
  // Extract only the class slots (ignore break/lunch)
  const classSlotIndices = timeslots
    .map((t, i) => (t.includes('Break') || t.includes('Lunch') ? -1 : i))
    .filter(i => i !== -1) // Should be 7 indices

  const scheduleA = []
  const scheduleB = []

  // Initialize empty schedules
  DAYS.forEach(day => {
    scheduleA.push({ day, slots: timeslots.map(time => ({ time, subject: 'Free', teacher: '—' })) })
    scheduleB.push({ day, slots: timeslots.map(time => ({ time, subject: 'Free', teacher: '—' })) })
  })

  // Prepare remaining hours for A and B
  let remainingA = subjectConfig.map(sc => ({ ...sc, remaining: Number(sc.hours) }))
  let remainingB = subjectConfig.map(sc => ({ ...sc, remaining: Number(sc.hours) }))

  const placeSubject = (dayIdx, slotIdx, section, subjRemainingObj) => {
    const time = timeslots[slotIdx]
    const day = DAYS[dayIdx]
    const sched = section === 'A' ? scheduleA : scheduleB
    const teacher = section === 'A' ? subjRemainingObj.teacherA : subjRemainingObj.teacherB

    // Conflict check
    if (teacher && teacher !== '—' && busy[day] && busy[day][time] && busy[day][time].has(teacher)) {
      return false // Teacher busy
    }

    // Place it
    sched[dayIdx].slots[slotIdx].subject = subjRemainingObj.name
    sched[dayIdx].slots[slotIdx].teacher = teacher || '—'
    subjRemainingObj.remaining -= 1
    
    // Mark teacher busy globally
    if (teacher && teacher !== '—') {
      if (!busy[day]) busy[day] = {}
      if (!busy[day][time]) busy[day][time] = new Set()
      busy[day][time].add(teacher)
    }

    return true
  }

  // To avoid gaps, we must fill from slot 0 to 6 consecutively for each day.
  // We process day by day, slot by slot
  for (let dayIdx = 0; dayIdx < DAYS.length; dayIdx++) {
    for (let slotOffset = 0; slotOffset < classSlotIndices.length; slotOffset++) {
      const slotIdx = classSlotIndices[slotOffset]
      
      // Try to place a subject for Section A
      let placedA = false
      // Sort to prioritize block hours if we have consecutive slots available, or just most remaining
      remainingA.sort((a, b) => b.remaining - a.remaining)
      
      for (let i = 0; i < remainingA.length; i++) {
        const sc = remainingA[i]
        if (sc.remaining <= 0) continue

        // Check block constraint: if block is true, we want to place it if there's a next slot available
        if (sc.block && sc.remaining >= 2 && slotOffset < classSlotIndices.length - 1) {
          const nextSlotIdx = classSlotIndices[slotOffset + 1]
          const teacher = sc.teacherA
          const day = DAYS[dayIdx]
          const time1 = timeslots[slotIdx]
          const time2 = timeslots[nextSlotIdx]
          
          let conflict1 = teacher && teacher !== '—' && busy[day] && busy[day][time1] && busy[day][time1].has(teacher)
          let conflict2 = teacher && teacher !== '—' && busy[day] && busy[day][time2] && busy[day][time2].has(teacher)
          
          if (!conflict1 && !conflict2) {
            placeSubject(dayIdx, slotIdx, 'A', sc)
            // It will be placed in the next slot iteration naturally because it will still have highest remaining?
            // Actually, better to place both NOW to guarantee block
            placeSubject(dayIdx, nextSlotIdx, 'A', sc)
            placedA = true
            break
          }
        } else if (!sc.block || sc.remaining < 2 || slotOffset === classSlotIndices.length - 1) {
          // Normal placement
          if (placeSubject(dayIdx, slotIdx, 'A', sc)) {
            placedA = true
            break
          }
        }
      }

      // Try to place a subject for Section B
      let placedB = false
      remainingB.sort((a, b) => b.remaining - a.remaining)
      
      for (let i = 0; i < remainingB.length; i++) {
        const sc = remainingB[i]
        if (sc.remaining <= 0) continue
        
        // Skip if this slot was already filled by a block assignment in a previous iteration
        if (scheduleB[dayIdx].slots[slotIdx].subject !== 'Free') {
          placedB = true;
          break;
        }

        if (sc.block && sc.remaining >= 2 && slotOffset < classSlotIndices.length - 1) {
          const nextSlotIdx = classSlotIndices[slotOffset + 1]
          const teacher = sc.teacherB
          const day = DAYS[dayIdx]
          const time1 = timeslots[slotIdx]
          const time2 = timeslots[nextSlotIdx]
          
          let conflict1 = teacher && teacher !== '—' && busy[day] && busy[day][time1] && busy[day][time1].has(teacher)
          let conflict2 = teacher && teacher !== '—' && busy[day] && busy[day][time2] && busy[day][time2].has(teacher)
          
          if (!conflict1 && !conflict2) {
            placeSubject(dayIdx, slotIdx, 'B', sc)
            placeSubject(dayIdx, nextSlotIdx, 'B', sc)
            placedB = true
            break
          }
        } else if (!sc.block || sc.remaining < 2 || slotOffset === classSlotIndices.length - 1) {
          if (placeSubject(dayIdx, slotIdx, 'B', sc)) {
            placedB = true
            break
          }
        }
      }
    }
  }

  // Fill break/lunch blocks visually
  DAYS.forEach(day => {
    scheduleA.find(d => d.day === day).slots.forEach(s => {
      if (s.time.includes('Break') || s.time.includes('Lunch')) {
        s.subject = s.time.split(' ')[1] || 'Break'
      }
    })
    scheduleB.find(d => d.day === day).slots.forEach(s => {
      if (s.time.includes('Break') || s.time.includes('Lunch')) {
        s.subject = s.time.split(' ')[1] || 'Break'
      }
    })
  })

  return { scheduleA, scheduleB }
}

// POST /timetable/generate
async function generate(req, res) {
  try {
    await verifyToken(req)
    const {
      subjectConfig = [], // { name, hours, block, teacherA, teacherB }
      startTime = '8:15',
      classId = 'default',
    } = req.body

    const timeslots = startTime === '8:15' ? TIMES_815 : TIMES_830;

    // Fetch all existing timetables to prevent cross-grade conflicts
    const timetablesSnap = await db.collection('timetables').get()
    const allTimetables = timetablesSnap.docs
      .filter(doc => !doc.id.startsWith(classId)) // ignore current class (A/B)
      .map(doc => doc.data().schedule)

    const busy = {}
    DAYS.forEach(d => {
      busy[d] = {}
      timeslots.forEach(t => { busy[d][t] = new Set() })
    })

    // Populate busy from other classes
    allTimetables.forEach(sched => {
      if (!sched) return
      // Extract from { scheduleA, scheduleB } or normal array
      const arrs = sched.scheduleA ? [sched.scheduleA, sched.scheduleB] : [sched]
      arrs.forEach(arr => {
        if (!arr) return
        arr.forEach(dayObj => {
          const d = dayObj.day
          if (!busy[d]) return
          dayObj.slots.forEach(slot => {
            const t = slot.time
            if (busy[d][t] && slot.teacher && slot.teacher !== '—') {
              busy[d][t].add(slot.teacher)
            }
          })
        })
      })
    })

    const { scheduleA, scheduleB } = generateDualSchedule(subjectConfig, timeslots, busy)
    
    return res.json({ schedule: { scheduleA, scheduleB }, classId })
  } catch (err) {
    console.error('generate error:', err)
    res.status(500).json({ error: err.message })
  }
}

// POST /timetable/save
async function save(req, res) {
  try {
    const decoded = await verifyToken(req)
    const { schedule, classId } = req.body

    await db.collection('timetables').doc(classId || 'default').set({
      schedule,
      classId,
      generatedBy: decoded.uid,
      generatedAt: new Date().toISOString(),
    })

    return res.json({ success: true })
  } catch (err) {
    console.error('save error:', err)
    res.status(500).json({ error: err.message })
  }
}

// GET /timetable/get?classId=default
async function get(req, res) {
  try {
    await verifyToken(req)
    const { classId } = req.query
    const snap = await db.collection('timetables').doc(classId || 'default').get()

    if (!snap.exists) return res.json({ schedule: null })
    return res.json(snap.data())
  } catch (err) {
    console.error('get error:', err)
    res.status(500).json({ error: err.message })
  }
}

module.exports = { generate, save, get }
