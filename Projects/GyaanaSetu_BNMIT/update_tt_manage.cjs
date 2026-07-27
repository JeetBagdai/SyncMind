const fs = require('fs');
let code = fs.readFileSync('src/pages/TimetableManage.jsx', 'utf8');

// 1. Replace states
code = code.replace(
  /const \[subjects, setSubjects\][\s\S]*?const \[newTime, setNewTime\][^\n]*\n/,
  `const [startTime, setStartTime]         = useState('8:15')
  const [subjectConfig, setSubjectConfig] = useState(
    AIML_SUBJECTS.map(name => ({ name, hours: 4, block: false, teacherA: '', teacherB: '' }))
  )
  const [customSubject, setCustomSubject] = useState('')
  const [viewSection, setViewSection]     = useState('A')\n`
);

// 2. Replace handleGenerate
code = code.replace(
  /const handleGenerate = async \(\) => {[\s\S]*?finally { setGenerating\(false\) }\n  }/,
  `const handleGenerate = async () => {
    let totalHrs = subjectConfig.reduce((acc, curr) => acc + Number(curr.hours || 0), 0)
    if (totalHrs > 35) {
      alert('Total hours exceed 35 per week (' + totalHrs + '). Please reduce.');
      return;
    }
    
    setGenerating(true); setSavedOk(false)
    try {
      const token = await getToken()
      const data  = await generateTimetable({
        subjectConfig,
        startTime,
        classId: selectedSem,
      }, token)
      setSchedule(data.schedule) // Assuming backend returns the combined schedule array or we need to handle A/B rendering
    } catch (err) {
      alert('Generation failed: ' + err.message)
    } finally { setGenerating(false) }
  }`
);

// 3. Replace the tt-config-grid
let configStart = code.indexOf('<div className="tt-config-grid">');
let configEnd = code.indexOf('{/* Action buttons */}');
let newConfig = `
<div className="tt-config-grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1rem' }}>
              <label className="form-label" style={{marginBottom: 0}}>Start Time:</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="startTime" checked={startTime === '8:15'} onChange={() => setStartTime('8:15')} /> 8:15 AM
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="startTime" checked={startTime === '8:30'} onChange={() => setStartTime('8:30')} /> 8:30 AM
              </label>
            </div>
            
            <label className="form-label">Subject & Faculty Configuration</label>
            <div style={{ overflowX: 'auto', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', padding: '0.5rem' }}>
              <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.5rem' }}>Subject</th>
                    <th style={{ padding: '0.5rem' }}>Hrs/Wk</th>
                    <th style={{ padding: '0.5rem' }}>Block Hrs</th>
                    <th style={{ padding: '0.5rem' }}>Teacher (Sec A)</th>
                    <th style={{ padding: '0.5rem' }}>Teacher (Sec B)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {subjectConfig.map((sc, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 500 }}>{sc.name}</td>
                      <td style={{ padding: '0.5rem' }}>
                        <input className="input" type="number" min="1" max="10" value={sc.hours} 
                          onChange={e => {
                            const newConfig = [...subjectConfig];
                            newConfig[i].hours = e.target.value;
                            setSubjectConfig(newConfig);
                          }} 
                          style={{width: 60, padding: '0.2rem 0.5rem', minHeight: 'auto'}} 
                        />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <input type="checkbox" className="checkbox" checked={sc.block} 
                          onChange={e => {
                            const newConfig = [...subjectConfig];
                            newConfig[i].block = e.target.checked;
                            setSubjectConfig(newConfig);
                          }} 
                        />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <select className="input" value={sc.teacherA} 
                          onChange={e => {
                            const newConfig = [...subjectConfig];
                            newConfig[i].teacherA = e.target.value;
                            setSubjectConfig(newConfig);
                          }}
                          style={{ padding: '0.2rem 0.5rem', minHeight: 'auto' }}
                        >
                           <option value="">Unassigned</option>
                           {allTeachers.map(t => <option key={t.uid} value={t.name}>{t.name}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <select className="input" value={sc.teacherB} 
                          onChange={e => {
                            const newConfig = [...subjectConfig];
                            newConfig[i].teacherB = e.target.value;
                            setSubjectConfig(newConfig);
                          }}
                          style={{ padding: '0.2rem 0.5rem', minHeight: 'auto' }}
                        >
                           <option value="">Unassigned</option>
                           {allTeachers.map(t => <option key={t.uid} value={t.name}>{t.name}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                         <button className="btn" style={{padding: '0.2rem', color: 'var(--text-muted)'}} onClick={() => {
                            setSubjectConfig(p => p.filter((_, idx) => idx !== i))
                         }}><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', padding: '0 0.5rem' }}>
                <input className="input" placeholder="Add custom subject..." value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customSubject.trim()) {
                      setSubjectConfig(p => [...p, { name: customSubject.trim(), hours: 4, block: false, teacherA: '', teacherB: '' }])
                      setCustomSubject('')
                    }
                  }}
                  style={{ maxWidth: 200, padding: '0.3rem 0.6rem', minHeight: 'auto' }}
                />
                <button className="btn btn-secondary btn-sm" type="button" onClick={() => {
                  if (customSubject.trim()) { 
                    setSubjectConfig(p => [...p, { name: customSubject.trim(), hours: 4, block: false, teacherA: '', teacherB: '' }])
                    setCustomSubject('') 
                  }
                }}>
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          </div>
        </div>\n\n        `;
code = code.substring(0, configStart) + newConfig + code.substring(configEnd);

fs.writeFileSync('src/pages/TimetableManage.jsx', code);
console.log('Replaced successfully.');
