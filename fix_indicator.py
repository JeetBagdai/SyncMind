with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

old_logic = """  const moveSegIndicator = useCallback((animate = true) => {
    const btn = segRefs.current[activeTab]
    const ind = segIndicatorRef.current
    if (!btn || !ind) return

    // Snapping uses set(), not a zero-duration to(): a tween still renders on
    // the next tick, so back-to-back snaps let an older one write its stale
    // position last and strand the pill. set() applies synchronously.
    if (!animate) {
      gsap.set(ind, { x: btn.offsetLeft, width: btn.offsetWidth })
      return
    }
    gsap.to(ind, {
      x: btn.offsetLeft,
      width: btn.offsetWidth,
      duration: 0.5,
      ease: 'power3.out',
      overwrite: 'auto',
    })
  }, [activeTab])"""

new_logic = """  const moveSegIndicator = useCallback((animate = true) => {
    const btn = segRefs.current[activeTab]
    const ind = segIndicatorRef.current
    if (!ind) return

    // If the active tab is hidden from the main tabs (like Settings), hide the indicator
    if (!btn) {
      if (!animate) {
        gsap.set(ind, { width: 0, opacity: 0 })
      } else {
        gsap.to(ind, { width: 0, opacity: 0, duration: 0.3, ease: 'power3.out', overwrite: 'auto' })
      }
      return
    }

    // Snapping uses set(), not a zero-duration to(): a tween still renders on
    // the next tick, so back-to-back snaps let an older one write its stale
    // position last and strand the pill. set() applies synchronously.
    if (!animate) {
      gsap.set(ind, { x: btn.offsetLeft, width: btn.offsetWidth, opacity: 1 })
      return
    }
    gsap.to(ind, {
      x: btn.offsetLeft,
      width: btn.offsetWidth,
      opacity: 1,
      duration: 0.5,
      ease: 'power3.out',
      overwrite: 'auto',
    })
  }, [activeTab])"""

content = content.replace(old_logic, new_logic)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated indicator logic")
