import React, { useState, useEffect, useRef } from 'react'

function CountUpAnimation({ target, duration = 2000, onComplete }) {
  const [count, setCount] = useState(0)
  const startTimeRef = useRef(null)
  const animationFrameRef = useRef(null)
  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (target === 0 || target === null || target === undefined) {
      setCount(0)
      return
    }

    // Reset when target changes
    setCount(0)
    hasStartedRef.current = false

    const animate = (currentTime) => {
      if (!hasStartedRef.current) {
        startTimeRef.current = currentTime
        hasStartedRef.current = true
      }

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Easing function: ease-out (slows down as it approaches target)
      // Using easeOutCubic: 1 - (1 - t)^3
      const easedProgress = 1 - Math.pow(1 - progress, 3)

      const currentCount = Math.floor(easedProgress * target)
      setCount(currentCount)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        // Ensure we end exactly at the target
        setCount(target)
        if (onComplete) {
          onComplete()
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [target, duration, onComplete])

  return <>{count}</>
}

export default CountUpAnimation
