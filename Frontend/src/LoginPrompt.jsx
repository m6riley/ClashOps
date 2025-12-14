import React, { useState } from 'react'
import './LoginPrompt.css'

function LoginPrompt({ onClose, onGoToAccount }) {
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300) // Match animation duration
  }

  const handleGoToAccount = () => {
    setIsClosing(true)
    setTimeout(() => {
      onGoToAccount()
    }, 300) // Match animation duration
  }

  return (
    <div className={`login-prompt-overlay ${isClosing ? 'fade-out' : 'fade-in'}`} onClick={handleClose}>
      <div className={`login-prompt-dialog ${isClosing ? 'fade-out' : 'fade-in'}`} onClick={(e) => e.stopPropagation()}>
        <div className="login-prompt-header">
          <h2 className="login-prompt-title">Login Required</h2>
          <button className="login-prompt-close" onClick={handleClose}>
            ×
          </button>
        </div>
        <div className="login-prompt-content">
          <p className="login-prompt-message">
            You need to be logged in to add decks to favourites or create new decks.
          </p>
          <p className="login-prompt-submessage">
            Please sign up or log in to continue.
          </p>
        </div>
        <div className="login-prompt-actions">
          <button className="login-prompt-button login-prompt-button-primary" onClick={handleGoToAccount}>
            Go to Account
          </button>
          <button className="login-prompt-button login-prompt-button-secondary" onClick={handleClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPrompt

