import React, { useState, useEffect } from 'react'
import './OptimizeLoading.css'

function OptimizeLoading({ onClose, onComplete, apiComplete }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        const increment = Math.random() * 6 + 2
        return Math.min(prev + increment, 100)
      })
    }, 200)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Only complete when both progress reaches 100 AND API call is complete
    if (progress === 100 && apiComplete) {
      const timeout = setTimeout(() => {
        if (onComplete) {
          onComplete()
        }
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [progress, apiComplete, onComplete])

  return (
    <div className="optimize-loading-overlay" onClick={onClose}>
      <div className="optimize-loading-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="optimize-loading-header">
          <div className="optimize-loading-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" className="optimize-loading-circle"/>
              <path d="M12 2 L12 8 L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <button className="optimize-loading-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="optimize-loading-content">
          <h2 className="optimize-loading-title">Optimizing Deck</h2>
          <p className="optimize-loading-subtitle">Analyzing your deck and generating recommendations...</p>
        </div>
      </div>
    </div>
  )
}

export default OptimizeLoading

