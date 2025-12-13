import React, { useState, useEffect } from 'react'
import './OptimizeLoading.css'

function OptimizeLoading({ onClose, onComplete }) {
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
    if (progress === 100) {
      const timeout = setTimeout(() => {
        if (onComplete) {
          onComplete()
        }
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [progress, onComplete])

  return (
    <div className="optimize-loading-overlay" onClick={onClose}>
      <div className="optimize-loading-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="optimize-loading-header">
          <h2 className="optimize-loading-title">Optimizing Deck</h2>
          <p className="optimize-loading-subtitle">Analyzing your deck and generating recommendations...</p>
        </div>
        
        <div className="optimize-loading-progress">
          <div className="optimize-loading-progress-bar">
            <div 
              className="optimize-loading-progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="optimize-loading-progress-text">{Math.round(progress)}%</span>
        </div>

        <div className="optimize-loading-steps">
          <div className={`optimize-loading-step ${progress > 30 ? 'completed' : progress > 15 ? 'active' : ''}`}>
            <div className="step-icon">{progress > 30 ? '✓' : progress > 15 ? '⟳' : '○'}</div>
            <div className="step-text">
              <div className="step-title">Recommending Card Swaps</div>
              <div className="step-description">Evaluating alternative cards</div>
            </div>
          </div>
          <div className={`optimize-loading-step ${progress > 60 ? 'completed' : progress > 45 ? 'active' : ''}`}>
            <div className="step-icon">{progress > 60 ? '✓' : progress > 45 ? '⟳' : '○'}</div>
            <div className="step-text">
              <div className="step-title">Recommending Tower Troop</div>
              <div className="step-description">Analyzing tower and troop combinations</div>
            </div>
          </div>
          <div className={`optimize-loading-step ${progress > 90 ? 'completed' : progress > 75 ? 'active' : ''}`}>
            <div className="step-icon">{progress > 90 ? '✓' : progress > 75 ? '⟳' : '○'}</div>
            <div className="step-text">
              <div className="step-title">Recommending Evolutions</div>
              <div className="step-description">Identifying evolution opportunities</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OptimizeLoading

