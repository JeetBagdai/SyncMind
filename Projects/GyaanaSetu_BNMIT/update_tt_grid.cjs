const fs = require('fs');
let code = fs.readFileSync('src/pages/TimetableManage.jsx', 'utf8');

// 1. Add viewSection toggle above the grid
let renderStart = code.indexOf('{schedule ? (');
let newRender = `{schedule ? (
        <motion.div className="tt-grid-wrapper" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                Timetable · {AIML_SEMESTERS.find(s => s.id === selectedSem)?.label || selectedSem}
              </h2>
              {selectedSem.includes('AIML') && (
                <div style={{ display: 'flex', gap: '0.2rem', background: 'var(--surface)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <button className={\`btn btn-sm \${viewSection === 'A' ? 'btn-primary' : 'btn-secondary'}\`} onClick={() => setViewSection('A')}>Section A</button>
                  <button className={\`btn btn-sm \${viewSection === 'B' ? 'btn-primary' : 'btn-secondary'}\`} onClick={() => setViewSection('B')}>Section B</button>
                </div>
              )}
            </div>
            {loadingTeachers ? (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Loader size={13} className="spin-anim" /> Loading teachers...
              </span>
            ) : (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {allTeachers.length} teacher{allTeachers.length !== 1 ? 's' : ''} available
              </span>
            )}
          </div>

          {/* Grid */}
          <div className="tt-grid">
            <div className="tt-header-cell tt-time-header">Time</div>
            {DAYS.map(d => <div key={d} className="tt-header-cell">{d}</div>)}
            {(schedule[viewSection === 'A' ? 'scheduleA' : 'scheduleB'] || schedule.scheduleA || [])[0]?.slots.map(s => s.time).map(time => (
              <React.Fragment key={time}>
                {time.includes('Break') || time.includes('Lunch') ? (
                  <div className="tt-break-row" style={{ gridColumn: '1 / -1' }}>{time.split(' ')[1] || 'Break'}</div>
                ) : null}
                <div className="tt-time-cell">{time.split(' ')[0]}</div>
                {DAYS.map(day => {
                  const currentSchedule = schedule[viewSection === 'A' ? 'scheduleA' : 'scheduleB'] || schedule.scheduleA || [];
                  const slot = currentSchedule.find(d => d.day === day)?.slots?.find(s => s.time === time);
                  const key  = \`\${viewSection}-\${day}-\${time}\`;
                  const assignedTeachers = slotTeachers[key] || [];
                  
                  if (time.includes('Break') || time.includes('Lunch')) return <div key={key} style={{display: 'none'}}></div>;

                  return (
                    <div key={key} className="tt-cell"
                      style={slot?.subject && slot.subject !== 'Free' ? { background: getColor(slot.subject), color: getText(slot.subject), padding: '0.5rem', flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' } : { padding: '0.5rem' }}>
                      {slot?.subject && slot.subject !== 'Free' ? (
                        <>
                          <span className="tt-subject">{slot.subject}</span>
                          <TeacherPicker
                            allTeachers={allTeachers}
                            selected={assignedTeachers}
                            onChange={teachers => updateSlotTeachers(viewSection + '-' + day, time, teachers)}
                          />
                          {assignedTeachers.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.15rem' }}>
                              {assignedTeachers.map(name => (
                                <span key={name} style={{
                                  fontSize: '0.62rem', padding: '0.1rem 0.4rem', borderRadius: '8px',
                                  background: getText(slot.subject) + '22', color: getText(slot.subject), fontWeight: 600,
                                }}>
                                  {name.split(' ').slice(-1)[0]}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Free</span>}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      ) : (`;

let oldRenderEnd = code.indexOf(') : (', renderStart) + 5;
code = code.substring(0, renderStart) + newRender + code.substring(oldRenderEnd);

// Fix updateSlotTeachers definition
code = code.replace(
  /const updateSlotTeachers = \(day, time, selectedNames\) => {/,
  `const updateSlotTeachers = (dayOrSec, time, selectedNames) => {
    const key = dayOrSec + '-' + time`
);
code = code.replace(/const key = \`\${day}-\${time}\`/, '');

// Fix load timetable
code = code.replace(
  /setSlotTeachers\(slotT\)/,
  `// Update slotTeachers to handle sections if available in loaded data (not fully implemented for legacy, but fine for new structure)
          setSlotTeachers(slotT)`
);

// We need to also inject the generated teachers into slotTeachers when schedule is set!
code = code.replace(
  /setSchedule\(data\.schedule\)/,
  `setSchedule(data.schedule)
      const newSlotT = {}
      if (data.schedule.scheduleA) {
        data.schedule.scheduleA.forEach(d => d.slots.forEach(s => {
          if (s.teacher && s.teacher !== '—') newSlotT['A-' + d.day + '-' + s.time] = [s.teacher];
        }))
        data.schedule.scheduleB.forEach(d => d.slots.forEach(s => {
          if (s.teacher && s.teacher !== '—') newSlotT['B-' + d.day + '-' + s.time] = [s.teacher];
        }))
      }
      setSlotTeachers(newSlotT)`
);


fs.writeFileSync('src/pages/TimetableManage.jsx', code);
console.log('Grid rendering updated.');
