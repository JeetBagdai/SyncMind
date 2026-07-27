#!/usr/bin/env node
/**
 * scripts/upload-syllabus.js
 * ──────────────────────────────────────────────────
 * One-time script to upload all NCERT PDFs from your local
 * Syllabus folder to Google Cloud Storage, and build the
 * Firestore syllabusIndex collection.
 *
 * USAGE:
 *   1. Set your GCP project: gcloud config set project YOUR_PROJECT_ID
 *   2. Authenticate: gcloud auth application-default login
 *   3. Set env: set SYLLABUS_PATH=C:\Users\Jeet\Desktop\Projects\GyaanaSetu\Syllabus
 *   4. Run: node scripts/upload-syllabus.js
 */

const { Storage }  = require('@google-cloud/storage')
const admin        = require('firebase-admin')
const path         = require('path')
const fs           = require('fs')

// ── Config ──────────────────────────────────────────
const SYLLABUS_PATH = process.env.SYLLABUS_PATH ||
  path.join('C:\\Users\\Jeet\\Desktop\\Projects\\GyaanaSetu\\Syllabus')
const GCS_BUCKET    = process.env.GCS_BUCKET || 'gyanasetu-ncert'
const GCP_PROJECT   = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT

// Map Roman numeral folder names → GCS grade folder names
const GRADE_MAP = {
  IV: 'grade4', V: 'grade5', VI: 'grade6', VII: 'grade7',
  VIII: 'grade8', IX: 'grade9', X: 'grade10',
}

// ── Init ────────────────────────────────────────────
admin.initializeApp({ projectId: GCP_PROJECT })
const db      = admin.firestore()
const storage = new Storage({ projectId: GCP_PROJECT })
const bucket  = storage.bucket(GCS_BUCKET)

async function run() {
  console.log(`\n🚀 GyaanaSetu Syllabus Uploader`)
  console.log(`📁 Source: ${SYLLABUS_PATH}`)
  console.log(`☁️  Bucket: gs://${GCS_BUCKET}\n`)

  if (!fs.existsSync(SYLLABUS_PATH)) {
    console.error(`❌ Syllabus path not found: ${SYLLABUS_PATH}`)
    process.exit(1)
  }

  const gradeFolders = fs.readdirSync(SYLLABUS_PATH).filter(f =>
    fs.statSync(path.join(SYLLABUS_PATH, f)).isDirectory()
  )

  let totalUploaded = 0
  const indexUpdates = []

  for (const gradeFolder of gradeFolders) {
    const gradeKey    = gradeFolder.toUpperCase()
    const gradeGcs    = GRADE_MAP[gradeKey] || gradeFolder.toLowerCase()
    const gradePath   = path.join(SYLLABUS_PATH, gradeFolder)

    const subjects = fs.readdirSync(gradePath).filter(f =>
      fs.statSync(path.join(gradePath, f)).isDirectory()
    )

    for (const subject of subjects) {
      const subjectPath = path.join(gradePath, subject)
      const pdfs = fs.readdirSync(subjectPath).filter(f => f.endsWith('.pdf')).sort()

      const chapters = []

      for (let i = 0; i < pdfs.length; i++) {
        const filename    = pdfs[i]
        const localFile   = path.join(subjectPath, filename)
        const gcsPath     = `${gradeGcs}/${subject}/${filename}`
        const chapterId   = `${gradeKey}_${subject}_${i + 1}`
        const title       = filename.replace(/^\d+\.\s*/, '').replace('.pdf', '')

        process.stdout.write(`  ⬆️  Uploading ${gradeGcs}/${subject}/${filename}...`)
        try {
          await bucket.upload(localFile, {
            destination: gcsPath,
            metadata: {
              contentType: 'application/pdf',
              metadata: { grade: gradeKey, subject, chapter: `${i + 1}` },
            },
          })
          process.stdout.write(' ✓\n')
          totalUploaded++
        } catch (err) {
          process.stdout.write(` ✗ (${err.message})\n`)
        }

        chapters.push({
          id:       chapterId,
          title,
          filename,
          order:    i + 1,
        })
      }

      // Write to Firestore syllabusIndex
      const docId = `${gradeKey}_${subject}`
      indexUpdates.push(
        db.collection('syllabusIndex').doc(docId).set({
          grade: gradeKey, subject, chapters,
          updatedAt: new Date().toISOString(),
        })
      )

      console.log(`  📚 ${gradeKey}/${subject}: ${chapters.length} chapters indexed`)
    }
  }

  console.log('\n📝 Writing Firestore index...')
  await Promise.all(indexUpdates)

  console.log(`\n✅ Done! Uploaded ${totalUploaded} PDFs and indexed ${indexUpdates.length} subject collections.`)
  console.log(`\nNext steps:`)
  console.log(`  1. Go to GCS console and verify files are in gs://${GCS_BUCKET}`)
  console.log(`  2. Go to Firestore and verify "syllabusIndex" collection exists`)
  console.log(`  3. Set bucket CORS to allow your frontend domain`)
  process.exit(0)
}

run().catch(err => {
  console.error('\n❌ Upload failed:', err)
  process.exit(1)
})
