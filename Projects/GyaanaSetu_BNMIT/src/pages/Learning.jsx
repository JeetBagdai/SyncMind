// src/pages/Learning.jsx — GyaanaSetu BNMIT
// This page is a placeholder. College-specific content (courses, subjects, modules)
// will be configured here in the BNMIT project chat.
import { motion } from 'framer-motion'
import { BookOpen, FolderOpen, Layers } from 'lucide-react'
import './Learning.css'

export default function Learning() {
  return (
    <div className="page-inner">
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="page-title">📚 Learning</h1>
          <p className="page-subtitle">College Course Library</p>
        </div>
      </motion.div>

      <motion.div
        className="card"
        style={{ padding: '3rem', textAlign: 'center', marginTop: '2rem' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem', opacity: 0.4 }}>
          <BookOpen size={40} color="var(--primary)" />
          <Layers size={40} color="var(--primary)" />
          <FolderOpen size={40} color="var(--primary)" />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text)' }}>
          College Content Coming Soon
        </h2>
        <p className="text-muted" style={{ maxWidth: 480, margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
          This page will host BNMIT's college subjects, lecture materials, and learning modules.
          Configure your departments, subjects, and content in{' '}
          <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 0, fontSize: '0.85em' }}>
            src/data/
          </code>{' '}
          and update this page in the BNMIT project chat.
        </p>
        <div style={{
          display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center',
          background: 'var(--bg)', borderRadius: 0, padding: '1rem 1.5rem',
          border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)'
        }}>
          <span>💡 Tip: Check <strong>CONTEXT.md</strong> at the project root for setup instructions.</span>
        </div>
      </motion.div>
    </div>
  )
}
