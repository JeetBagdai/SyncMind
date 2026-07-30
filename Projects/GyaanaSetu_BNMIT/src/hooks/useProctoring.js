import { useState, useEffect } from 'react'

/**
 * Hook to manage client-side browser proctoring.
 * Prevents clipboard events and enforces fullscreen mode.
 */
export function useProctoring(isProctored) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isBlurred, setIsBlurred] = useState(false)

  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      }
      
      // Use the experimental Web Keyboard Lock API (available in Fullscreen)
      // to intercept OS-level hotkeys before the OS can act on them.
      if ('keyboard' in navigator && 'lock' in navigator.keyboard) {
        await navigator.keyboard.lock(['PrintScreen', 'MetaLeft', 'MetaRight', 'AltLeft', 'AltRight', 'Escape'])
        console.log("Keyboard locked successfully")
      }
    } catch (err) {
      console.warn("Fullscreen or keyboard lock request failed", err)
    }
  }

  useEffect(() => {
    if (!isProctored) return

    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement
      setIsFullscreen(isFs)
      
      if (!isFs && 'keyboard' in navigator && 'unlock' in navigator.keyboard) {
        navigator.keyboard.unlock()
      }
    }

    const handleWindowBlur = () => {
      // Synchronous DOM manipulation beats React state for screenshot prevention
      document.body.style.opacity = '0'
      document.body.style.visibility = 'hidden'
      setIsBlurred(true)
    }
    
    const handleWindowFocus = () => {
      document.body.style.opacity = '1'
      document.body.style.visibility = 'visible'
      setIsBlurred(false)
    }

    const handleClipboard = (e) => {
      e.preventDefault()
      e.stopImmediatePropagation()
    }

    const handleKeyDown = (e) => {
      // If they press Meta (Windows key), instantly hide the screen. 
      // This defeats Win+Shift+S because Meta must be held down first.
      if (e.key === 'Meta' || e.metaKey || e.key === 'PrintScreen' || e.keyCode === 44) {
        document.body.style.opacity = '0'
        document.body.style.visibility = 'hidden'
      }
      
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        navigator.clipboard.writeText('Screenshots are disabled during proctored assessments.').catch(()=>{})
        e.preventDefault()
      }
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') {
        navigator.clipboard.writeText('Screenshots are disabled during proctored assessments.').catch(()=>{})
        e.preventDefault()
      }
    }

    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        // Windows only fires keyup for PrintScreen because it intercepts keydown at the OS level.
        // The screenshot is already taken by the time keyup fires, so we instantly overwrite their clipboard.
        navigator.clipboard.writeText('Screenshots are disabled during proctored assessments.').catch(()=>{})
      }

      if (e.key === 'Meta' || e.key === 'PrintScreen' || e.keyCode === 44) {
        // Restore visibility after a delay to ensure the OS screenshot action has completed capturing the blank screen
        setTimeout(() => {
          if (document.hasFocus()) {
            document.body.style.opacity = '1'
            document.body.style.visibility = 'visible'
          }
        }, 500)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('keydown', handleKeyDown, { capture: true })
    document.addEventListener('keyup', handleKeyUp, { capture: true })
    document.addEventListener('copy', handleClipboard, { capture: true })
    document.addEventListener('cut', handleClipboard, { capture: true })
    document.addEventListener('paste', handleClipboard, { capture: true })

    // Check initial state
    setIsFullscreen(!!document.fullscreenElement)
    setIsBlurred(!document.hasFocus())

    return () => {
      document.body.style.opacity = '1'
      document.body.style.visibility = 'visible'
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('keydown', handleKeyDown, { capture: true })
      document.removeEventListener('keyup', handleKeyUp, { capture: true })
      document.removeEventListener('copy', handleClipboard, { capture: true })
      document.removeEventListener('cut', handleClipboard, { capture: true })
      document.removeEventListener('paste', handleClipboard, { capture: true })
    }
  }, [isProctored])

  // A helper function to attach to the Monaco Editor instance
  // Since Monaco intercepts its own clipboard events, we need to block them internally.
  const setupMonacoProctoring = (editor, monaco) => {
    if (!isProctored) return

    editor.onKeyDown((e) => {
      // Prevent Ctrl+C / Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyC') {
        e.preventDefault()
      }
      // Prevent Ctrl+X / Cmd+X
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyX') {
        e.preventDefault()
      }
      // Prevent Ctrl+V / Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyV') {
        e.preventDefault()
      }
    })
  }

  return { isFullscreen, isBlurred, requestFullscreen, setupMonacoProctoring }
}
