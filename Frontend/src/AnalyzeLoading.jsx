import React, { useState, useEffect } from 'react'
import './AnalyzeLoading.css'

function AnalyzeLoading({ onClose, onComplete }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        // Random increment between 2-8% for more realistic feel
        const increment = Math.random() * 6 + 2
        return Math.min(prev + increment, 100)
      })
    }, 200) // Update every 200ms

    return () => clearInterval(interval)
  }, [])

  // Handle completion when progress reaches 100%
  useEffect(() => {
    if (progress >= 100 && onComplete) {
      // Wait a brief moment before completing
      const timeout = setTimeout(() => {
        onComplete()
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [progress, onComplete])

  return (
    <div className="analyze-loading-overlay" onClick={onClose}>
      <div className="analyze-loading-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="analyze-loading-header">
          <div className="analyze-loading-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" className="analyze-loading-circle"/>
              <path d="M12 2 L12 8 L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <button className="analyze-loading-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="analyze-loading-content">
          <h2 className="analyze-loading-title">Analyzing Deck</h2>
          <p className="analyze-loading-subtitle">Processing your deck composition...</p>
          
          <div className="analyze-loading-progress-container">
            <div className="analyze-loading-progress-bar">
              <div 
                className="analyze-loading-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="analyze-loading-progress-text">
              {Math.round(progress)}%
            </div>
          </div>

          <div className="analyze-loading-steps">
            <div className={`analyze-loading-step ${progress > 20 ? 'completed' : progress > 10 ? 'active' : ''}`}>
              <div className="step-icon">
                {progress > 20 ? '✓' : progress > 10 ? '⟳' : '○'}
              </div>
              <div className="step-text">
                <div className="step-title">Analyzing Offense</div>
                <div className="step-description">Evaluating offensive capabilities</div>
              </div>
            </div>
            <div className={`analyze-loading-step ${progress > 40 ? 'completed' : progress > 30 ? 'active' : ''}`}>
              <div className="step-icon">
                {progress > 40 ? '✓' : progress > 30 ? '⟳' : '○'}
              </div>
              <div className="step-text">
                <div className="step-title">Analyzing Defense</div>
                <div className="step-description">Assessing defensive strategies</div>
              </div>
            </div>
            <div className={`analyze-loading-step ${progress > 60 ? 'completed' : progress > 50 ? 'active' : ''}`}>
              <div className="step-icon">
                {progress > 60 ? '✓' : progress > 50 ? '⟳' : '○'}
              </div>
              <div className="step-text">
                <div className="step-title">Analyzing Synergy</div>
                <div className="step-description">Evaluating card interactions</div>
              </div>
            </div>
            <div className={`analyze-loading-step ${progress > 80 ? 'completed' : progress > 70 ? 'active' : ''}`}>
              <div className="step-icon">
                {progress > 80 ? '✓' : progress > 70 ? '⟳' : '○'}
              </div>
              <div className="step-text">
                <div className="step-title">Analyzing Versatility</div>
                <div className="step-description">Measuring adaptability</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyzeLoading

