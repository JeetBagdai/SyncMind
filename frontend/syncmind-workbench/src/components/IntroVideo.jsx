// src/components/IntroVideo.jsx
import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Full-screen intro that plays once on launch, then fades into the app.
 * Fails open: if the video errors, stalls, or autoplay is blocked we hand
 * control to the app rather than trapping the user on a black screen.
 */
export default function IntroVideo({ onDone }) {
  const [leaving, setLeaving] = useState(false)
  const videoRef = useRef(null)
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    setLeaving(true)
    setTimeout(onDone, 650) // matches the CSS fade
  }, [onDone])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return finish()

    // Autoplay only works muted; if the browser still refuses, skip ahead.
    const p = v.play()
    if (p && typeof p.catch === 'function') p.catch(() => finish())

    // Hard ceiling so a stalled download can never block the app.
    const failsafe = setTimeout(finish, 15000)
    return () => clearTimeout(failsafe)
  }, [finish])

  return (
    <div className={`intro ${leaving ? 'leaving' : ''}`}>
      <video
        ref={videoRef}
        className="intro-video"
        src="/intro.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
      />
      <button className="intro-skip" onClick={finish}>
        Skip
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
