import React, { useState, useEffect } from 'react'
import './InitialLoading.css'

function InitialLoading({ onComplete }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        // Slower progress at the end for more realistic feel
        const remaining = 100 - prev
        let increment
        if (remaining > 20) {
          increment = Math.random() * 4 + 2 // 2-6% when far from completion
        } else if (remaining > 10) {
          increment = Math.random() * 2 + 1 // 1-3% when getting close
        } else {
          increment = Math.random() * 0.5 + 0.3 // 0.3-0.8% when very close
        }
        return Math.min(prev + increment, 100)
      })
    }, 150) // Update every 150ms
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (progress >= 100) {
      const timeout = setTimeout(() => {
        if (onComplete) {
          onComplete()
        }
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [progress, onComplete])

  return (
    <div className="initial-loading-overlay">
      <div className="initial-loading-content">
        <div className="initial-loading-logo-container">
          <div className="initial-loading-logo">
            <svg className="logo-icon" viewBox="0 0 120 120" fill="none">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="50%" stopColor="#FFA500" />
                  <stop offset="100%" stopColor="#FFD700" />
                </linearGradient>
              </defs>
              {/* Crown base */}
              <rect x="10" y="70" width="100" height="8" rx="2" fill="url(#logoGradient)" className="crown-base"/>
              <rect x="15" y="82" width="90" height="8" rx="2" fill="url(#logoGradient)" className="crown-base"/>
              
              {/* Crown peaks */}
              <path d="M 20 70 L 20 30 L 30 50 L 20 70" fill="url(#logoGradient)" className="crown-peak"/>
              <path d="M 35 70 L 35 25 L 45 50 L 35 70" fill="url(#logoGradient)" className="crown-peak"/>
              <path d="M 50 70 L 50 10 L 60 50 L 50 70" fill="url(#logoGradient)" className="crown-peak"/>
              <path d="M 65 70 L 65 25 L 75 50 L 65 70" fill="url(#logoGradient)" className="crown-peak"/>
              <path d="M 80 70 L 80 30 L 90 50 L 80 70" fill="url(#logoGradient)" className="crown-peak"/>
              
              {/* Crown jewels */}
              <circle cx="30" cy="25" r="5" fill="url(#logoGradient)" className="crown-jewel"/>
              <circle cx="45" cy="35" r="4" fill="url(#logoGradient)" className="crown-jewel"/>
              <circle cx="60" cy="10" r="6" fill="url(#logoGradient)" className="crown-jewel"/>
              <circle cx="75" cy="35" r="4" fill="url(#logoGradient)" className="crown-jewel"/>
              <circle cx="90" cy="25" r="5" fill="url(#logoGradient)" className="crown-jewel"/>
            </svg>
          </div>
          <h1 className="initial-loading-title">ClashOps</h1>
        </div>
        
        <div className="initial-loading-progress-container">
          <div className="initial-loading-progress-bar">
            <div 
              className="initial-loading-progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="initial-loading-progress-text">
            {Math.round(progress)}%
          </div>
        </div>

        <div className="initial-loading-particles">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default InitialLoading

