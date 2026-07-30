import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Editor } from '@monaco-editor/react'
import { useAuth } from '../context/AuthContext'
import { useProctoring } from '../hooks/useProctoring'
import { db } from '../firebase'
import { doc, getDoc, getDocs, collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore'
import { Play, Check, ChevronLeft, ChevronDown, ChevronRight, AlertTriangle, Terminal, Lock, FileCode2, CheckCircle, Circle, Copy, Minus, Plus } from 'lucide-react'
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels'
import './Dashboard.css'

export default function CodeITEditor() {
  const { problemId } = useParams()
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  
  const [problem, setProblem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('// Write your code here')
  const [language, setLanguage] = useState('python')
  
  const [executing, setExecuting] = useState(false)
  const [results, setResults] = useState(null)
  
  const [sidebarProblems, setSidebarProblems] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [expandedModules, setExpandedModules] = useState({})
  const [testCasesExpanded, setTestCasesExpanded] = useState(true)

  // Fetch problem
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const snap = await getDoc(doc(db, 'coding_problems', problemId))
        if (snap.exists()) {
          const data = snap.data()
          setProblem({ id: snap.id, ...data })
          if (data.languages?.length) {
            setLanguage(data.languages[0])
          }
          setCode(data.starterCode?.[data.languages?.[0] || 'python'] || '// Write your code here')
        } else {
          // Problem not found
          navigate('/codeit')
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProblem()
  }, [problemId, navigate])

  // Fetch related problems for the sidebar
  useEffect(() => {
    if (!problem?.subjectCode) return
    const fetchRelated = async () => {
      try {
        const qProblems = query(
          collection(db, 'coding_problems'),
          where('subjectCode', '==', problem.subjectCode),
          where('semester', '==', problem.semester)
        )
        const snap = await getDocs(qProblems)
        const pData = []
        snap.forEach(doc => pData.push({ id: doc.id, ...doc.data() }))
        
        // Sort by module and order
        pData.sort((a, b) => (a.order || 0) - (b.order || 0))
        setSidebarProblems(pData)
        
        // Expand the module of the current problem
        const currMod = problem.module || 'General'
        setExpandedModules(prev => ({ ...prev, [currMod]: true }))
        
        // Fetch submissions for checkmarks
        const qSubs = query(
          collection(db, 'submissions'),
          where('studentUSN', '==', profile?.usn || user?.uid)
        )
        const subSnap = await getDocs(qSubs)
        const sMap = {}
        subSnap.forEach(doc => {
          const data = doc.data()
          sMap[data.problemId] = data
        })
        setSubmissions(sMap)
      } catch (err) {
        console.error(err)
      }
    }
    fetchRelated()
  }, [problem?.subjectCode, problem?.semester, profile?.usn, user?.uid])

  const groupedSidebar = sidebarProblems.reduce((acc, p) => {
    const mod = p.module || 'General'
    if (!acc[mod]) acc[mod] = []
    acc[mod].push(p)
    return acc
  }, {})

  const toggleModule = (mod) => {
    setExpandedModules(prev => ({ ...prev, [mod]: !prev[mod] }))
  }

  const { isFullscreen, isBlurred, requestFullscreen, setupMonacoProctoring } = useProctoring(
    problem?.proctored || false
  )

  const handleEditorDidMount = (editor, monaco) => {
    if (problem?.proctored) {
      setupMonacoProctoring(editor, monaco)
    }
  }

  const executeCode = async (code, language, input) => {
    const languageIdMap = {
      python: 92, // Python 3.11.2
      java: 91,   // Java JDK 17
      cpp: 105,   // C++ GCC 14.1
      c: 105      // C (using C++ compiler fallback if needed)
    };

    const response = await fetch("https://ce.judge0.com/submissions?wait=true", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language_id: languageIdMap[language] || 92,
        source_code: code,
        stdin: input
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Execution API failed (${response.status}): ${errorText}`);
    }
    return await response.json();
  };

  const handleRun = async () => {
    if (problem?.proctored && !isFullscreen) return;
    if (!code || code.trim() === '') return;
    
    setExecuting(true);
    setResults(null);
    
    try {
      const runResults = [];
      let passedCount = 0;
      
      const testCases = problem.sampleTestCases || [];
      
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const t0 = performance.now();
        const apiRes = await executeCode(code, language, tc.input);
        const t1 = performance.now();
        
        let output = "";
        let error = "";
        
        if (apiRes.compile_output) {
          error = apiRes.compile_output;
        } else if (apiRes.stderr) {
          error = apiRes.stderr;
        } else if (apiRes.status?.id > 3) {
          // Status ID 3 is Accepted. Any ID > 3 is a failure (compilation, runtime, memory etc)
          error = apiRes.message || apiRes.status?.description || "Execution Error";
        }
        
        if (apiRes.stdout) {
          output = apiRes.stdout;
        }
        
        const normalizedOutput = output.trim().replace(/\r\n/g, '\n');
        const expectedOutput = tc.output.trim().replace(/\r\n/g, '\n');
        
        const passed = (normalizedOutput === expectedOutput) && !error;
        if (passed) passedCount++;
        
        runResults.push({
          testId: i + 1,
          passed,
          output: normalizedOutput,
          expected: expectedOutput,
          error: error.trim(),
          runtime: `${Math.round(t1 - t0)}ms`
        });
      }
      
      setResults({
        type: 'run',
        passed: passedCount,
        total: testCases.length,
        details: runResults
      });
      
    } catch (err) {
      console.error("Run error:", err);
      setResults({
        type: 'run',
        passed: 0,
        total: problem?.sampleTestCases?.length || 0,
        error: `Error: ${String(err.message || err)}. (Check browser console for more details)`
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmit = async () => {
    if (problem?.proctored && !isFullscreen) return;
    if (!code || code.trim() === '') return;
    
    setExecuting(true);
    setResults(null);

    try {
      // In a real app, this would run against hidden test cases. 
      // For now, we run against sample test cases to generate a score.
      const testCases = problem.sampleTestCases || [];
      const runResults = [];
      let passedCount = 0;
      
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const apiRes = await executeCode(code, language, tc.input);
        
        let output = "";
        let error = "";
        
        if (apiRes.compile_output) {
          error = apiRes.compile_output;
        } else if (apiRes.stderr) {
          error = apiRes.stderr;
        } else if (apiRes.status?.id > 3) {
          error = apiRes.message || apiRes.status?.description || "Execution Error";
        }
        
        if (apiRes.stdout) {
          output = apiRes.stdout;
        }
        
        const normalizedOutput = output.trim().replace(/\r\n/g, '\n');
        const expectedOutput = tc.output.trim().replace(/\r\n/g, '\n');
        
        const passed = (normalizedOutput === expectedOutput) && !error;
        if (passed) passedCount++;
        
        runResults.push({
          testId: i + 1,
          passed
        });
      }
      
      const score = testCases.length > 0 ? Math.round((passedCount / testCases.length) * 100) : 100;
      
      const subResult = {
        studentUSN: profile?.usn || user?.uid,
        problemId,
        code,
        language,
        score,
        status: 'completed',
        testResults: runResults,
        submittedAt: serverTimestamp()
      };
      
      try {
        await addDoc(collection(db, 'submissions'), subResult);
      } catch (e) {
        console.error('Failed to save submission', e);
      }
      
      setResults({
        type: 'submit',
        passed: passedCount,
        total: testCases.length,
        score,
        details: runResults
      });
      
    } catch (err) {
      console.error("Submit error:", err);
      setResults({
        type: 'submit',
        passed: 0,
        total: problem?.sampleTestCases?.length || 0,
        error: `Error: ${String(err.message || err)}. (Check browser console for more details)`
      });
    } finally {
      setExecuting(false);
    }
  }

  const handleAutoSubmit = (flags) => {
    // If they get locked out, record an auto-fail submission
    addDoc(collection(db, 'submissions'), {
      studentUSN: profile?.usn || user?.uid,
      problemId,
      code,
      language,
      score: 0,
      status: 'completed',
      lockedOut: true,
      violationCount: flags.length,
      submittedAt: serverTimestamp()
    })
  }

  const renderTextList = (text) => {
    if (!text) return null;
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 1 || lines[0].startsWith('-') || lines[0].startsWith('•')) {
      return (
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          {lines.map((l, i) => <li key={i} style={{ marginBottom: '4px' }}>{l.replace(/^[-•]\s*/, '')}</li>)}
        </ul>
      );
    }
    return <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{text}</div>;
  }

  if (loading) return <div className="page-inner"><div style={{ padding: '3rem', textAlign: 'center' }}>Loading Editor...</div></div>
  if (!problem) return null

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      {/* Header */}
      <header style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate('/codeit')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
            <ChevronLeft size={20} /> Back
          </button>
          <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>{problem.title}</h1>
          {problem.proctored && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
              <Lock size={12} /> PROCTORED
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            value={language} 
            onChange={e => setLanguage(e.target.value)}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
          >
            {(problem.languages || ['python', 'java', 'cpp']).map(l => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={handleRun} disabled={executing} style={{ padding: '0.4rem 1rem' }}>
            <Play size={14} /> Run
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={executing} style={{ padding: '0.4rem 1rem' }}>
            <Check size={14} /> Submit
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', filter: isBlurred && problem?.proctored ? 'blur(12px)' : 'none', transition: 'filter 0.1s' }}>
        <PanelGroup orientation="horizontal">
          
          {/* Far Left Pane: Navigation Sidebar */}
          <Panel defaultSize={20} minSize={15}>
            <div style={{ height: '100%', borderRight: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '4px' }}>
                  {problem.subjectCode}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Practice Module
                </div>
              </div>
              <div style={{ padding: '0.5rem 0' }}>
                {Object.entries(groupedSidebar).map(([moduleName, probs]) => (
                  <div key={moduleName}>
                    <button 
                      onClick={() => toggleModule(moduleName)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'left' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {expandedModules[moduleName] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {moduleName}
                      </div>
                    </button>
                    {expandedModules[moduleName] && (
                      <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '0.5rem' }}>
                        {probs.map(p => {
                          const isActive = p.id === problem.id;
                          const isCompleted = submissions[p.id]?.status === 'completed';
                          return (
                            <button
                              key={p.id}
                              onClick={() => navigate(`/codeit/${p.id}`)}
                              style={{ 
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '0.5rem 1rem 0.5rem 2.2rem', 
                                background: isActive ? 'rgba(234, 88, 12, 0.1)' : 'transparent',
                                border: 'none', borderLeft: isActive ? '3px solid var(--color-orange)' : '3px solid transparent',
                                cursor: 'pointer', textAlign: 'left',
                                color: isActive ? 'var(--color-orange)' : 'var(--text-secondary)',
                                fontSize: '0.8rem'
                              }}
                            >
                              {isCompleted ? <CheckCircle size={14} color="#10b981" /> : <Circle size={14} color="#6b7280" />}
                              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.subModule ? `${p.subModule.split('.')[1] || p.subModule} - ${p.title}` : p.title}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle style={{ width: '8px', cursor: 'col-resize', background: 'transparent' }} />

          {/* Middle Pane: Problem Description */}
          <Panel defaultSize={30} minSize={20}>
            <div style={{ height: '100%', padding: '1.5rem', overflowY: 'auto', borderRight: '1px solid var(--border)', background: 'var(--bg-card)', userSelect: problem?.proctored ? 'none' : 'auto' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>{problem.subjectCode}</span>
                <h2 style={{ fontSize: '1.5rem', margin: '0.5rem 0 1rem', color: 'var(--text-primary)' }}>{problem.title}</h2>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {problem.description}
                </div>
                
                {problem.inputFormat && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Input Format:</h3>
                    {renderTextList(problem.inputFormat)}
                  </div>
                )}
                
                {problem.outputFormat && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Output Format:</h3>
                    {renderTextList(problem.outputFormat)}
                  </div>
                )}

                {problem.note && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Note:</h3>
                    {renderTextList(problem.note)}
                  </div>
                )}

                {problem.sampleTestCases && problem.sampleTestCases.length > 0 && (
                  <div style={{ marginTop: '2rem', background: 'var(--bg-app)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border)' }}>
                    <div 
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: testCasesExpanded ? '1.5rem' : '0' }}
                      onClick={() => setTestCasesExpanded(!testCasesExpanded)}
                    >
                      <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>Sample Test Cases</h3>
                      {testCasesExpanded ? <Minus size={16} color="var(--text-muted)" /> : <Plus size={16} color="var(--text-muted)" />}
                    </div>
                    
                    {testCasesExpanded && problem.sampleTestCases.map((tc, idx) => {
                      const allLines = [
                        ...tc.input.split('\n').filter(l => l.trim().length > 0),
                        ...tc.output.split('\n').filter(l => l.trim().length > 0)
                      ];
                      
                      return (
                        <div key={idx} style={{ marginBottom: idx === problem.sampleTestCases.length - 1 ? 0 : '2rem' }}>
                          <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1rem', fontWeight: 700 }}>Test case {idx + 1}</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {allLines.map((line, lIdx) => (
                              <div key={lIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', color: 'var(--text-secondary)', padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                <span>{line}</span>
                                <Copy size={16} color="var(--text-muted)" style={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => navigator.clipboard.writeText(line)} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <PanelResizeHandle style={{ width: '8px', cursor: 'col-resize', background: 'transparent' }} />

          {/* Right Pane: Editor & Console */}
          <Panel defaultSize={50} minSize={30}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '1rem', background: 'var(--bg-app)', gap: '1rem', position: 'relative' }}>
              
              <PanelGroup orientation="vertical">
                {/* Editor Container */}
                <Panel defaultSize={70} minSize={30}>
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1e1e1e', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
            
            {/* Editor Tab Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', background: '#2d2d2d', padding: '0 1rem', height: '40px', borderBottom: '1px solid #1e1e1e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e1e1e', padding: '8px 16px', borderTop: '2px solid var(--color-orange)', color: '#d4d4d4', fontSize: '0.85rem', fontFamily: 'monospace', borderTopLeftRadius: '6px', borderTopRightRadius: '6px' }}>
                <FileCode2 size={14} style={{ color: 'var(--color-orange)' }} /> 
                solution.{language === 'python' ? 'py' : language === 'java' ? 'java' : 'cpp'}
              </div>
            </div>

            <div style={{ flex: 1, position: 'relative' }}>
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={val => setCode(val)}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                readOnly: problem?.proctored && !isFullscreen,
                padding: { top: 16 }
              }}
            />
                  </div>
                </div>
              </Panel>

                <PanelResizeHandle style={{ height: '8px', cursor: 'row-resize', background: 'transparent' }} />

                {/* Output / Console Pane */}
                <Panel defaultSize={30} minSize={10}>
                  <div style={{ height: '100%', background: '#1e1e1e', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333', color: '#d4d4d4', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                    <div style={{ padding: '0.6rem 1.2rem', background: '#2d2d2d', borderBottom: '1px solid #1e1e1e', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#aaa', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      <Terminal size={12} /> Execution Output
                    </div>
                    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {executing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6' }}>
                          <div className="loading-spinner" style={{ width: 14, height: 14, borderColor: 'rgba(59,130,246,0.3)', borderTopColor: '#3b82f6' }} /> Running code in secure sandbox...
                        </div>
                      ) : results ? (
                        <AnimatePresence>
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {results.error ? (
                              <div style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '0.85rem' }}>{results.error}</div>
                            ) : (
                              <div>
                                <h3 style={{ fontSize: '1rem', color: results.passed === results.total ? '#22c55e' : '#ef4444', marginBottom: '1rem' }}>
                                  {results.type === 'submit' ? 'Submission Complete' : 'Run Complete'} ({results.passed}/{results.total} passed)
                                </h3>
                                {results.type === 'submit' && (
                                  <div style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    Score: {results.score}%
                                  </div>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                  {results.details.map((tc, idx) => (
                                    <div key={idx} style={{ 
                                      display: 'flex', 
                                      flexDirection: 'column',
                                      padding: '1rem', 
                                      background: 'var(--bg-app)', 
                                      borderRadius: '6px', 
                                      border: `1px solid ${tc.passed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ color: tc.passed ? '#22c55e' : '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
                                          Test Case {tc.testId}: {tc.passed ? 'PASSED' : 'FAILED'}
                                        </div>
                                        {tc.runtime && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tc.runtime}</div>}
                                      </div>
                                      
                                      {/* If it failed and we are running (not submitting), show diff */}
                                      {results.type === 'run' && !tc.passed && (
                                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                          {tc.error ? (
                                            <div>
                                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Error Output</div>
                                              <pre style={{ margin: 0, padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '4px', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{tc.error}</pre>
                                            </div>
                                          ) : (
                                            <>
                                              <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Expected Output</div>
                                                <pre style={{ margin: 0, padding: '0.75rem', background: '#1e293b', color: '#e2e8f0', borderRadius: '4px', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{tc.expected}</pre>
                                              </div>
                                              <div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Your Output</div>
                                                <pre style={{ margin: 0, padding: '0.75rem', background: '#1e293b', color: '#ef4444', borderRadius: '4px', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{tc.output || '(No output)'}</pre>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      ) : (
                        <span style={{ color: '#666' }}>Run or Submit your code to see the output.</span>
                      )}
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            </div>
          </Panel>
        </PanelGroup>

        {problem?.proctored && !isFullscreen && (
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
            <div style={{ background: 'var(--bg-card)', padding: '2.5rem', borderRadius: '12px', textAlign: 'center', maxWidth: 420, border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              <Lock size={40} style={{ color: 'var(--color-orange)', margin: '0 auto 1.5rem' }} />
              <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem' }}>Proctored Assessment</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '2rem', lineHeight: 1.5 }}>This coding challenge requires you to remain in fullscreen mode. Tab switching or exiting fullscreen will pause your session.</p>
              <button className="btn btn-primary" onClick={requestFullscreen} style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 600 }}>
                Enter Fullscreen to Continue
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
