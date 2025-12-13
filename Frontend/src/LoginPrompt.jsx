import React from 'react'
import './LoginPrompt.css'

function LoginPrompt({ onClose, onGoToAccount }) {
  return (
    <div className="login-prompt-overlay" onClick={onClose}>
      <div className="login-prompt-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="login-prompt-header">
          <h2 className="login-prompt-title">Login Required</h2>
          <button className="login-prompt-close" onClick={onClose}>
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
          <button className="login-prompt-button login-prompt-button-primary" onClick={onGoToAccount}>
            Go to Account
          </button>
          <button className="login-prompt-button login-prompt-button-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPrompt

