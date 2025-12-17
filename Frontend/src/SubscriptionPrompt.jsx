import React, { useState } from 'react'
import './SubscriptionPrompt.css'
import crownIcon from './assets/ClashOps-PNG.png'

function SubscriptionPrompt({ onClose, onSubscribe }) {
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 300) // Match animation duration
  }

  const handleSubscribe = () => {
    setIsClosing(true)
    setTimeout(() => {
      onSubscribe()
    }, 300) // Match animation duration
  }

  return (
    <div className={`subscription-prompt-overlay ${isClosing ? 'fade-out' : 'fade-in'}`} onClick={handleClose}>
      <div className={`subscription-prompt-dialog ${isClosing ? 'fade-out' : 'fade-in'}`} onClick={(e) => e.stopPropagation()}>
        <div className="subscription-prompt-header">
          <div className="subscription-prompt-icon">
            <img 
              src={crownIcon} 
              alt="ClashOps Crown" 
              className="subscription-prompt-crown-icon"
            />
          </div>
          <button className="subscription-prompt-close" onClick={handleClose}>
            ×
          </button>
        </div>
        <div className="subscription-prompt-content">
          <h2 className="subscription-prompt-title">Unlock ClashOps Diamond</h2>
          <p className="subscription-prompt-subtitle">Premium deck analysis and insights</p>
          <div className="subscription-prompt-features">
            <div className="subscription-feature-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
              </svg>
              <span>Advanced deck analysis</span>
            </div>
            <div className="subscription-feature-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
              </svg>
              <span>Detailed statistics and insights</span>
            </div>
            <div className="subscription-feature-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
              </svg>
              <span>Exclusive premium features</span>
            </div>
          </div>
          <div className="subscription-prompt-pricing">
            <div className="pricing-amount">
              <span className="pricing-currency">$</span>
              <span className="pricing-value">4.99</span>
              <span className="pricing-period">/month</span>
            </div>
            <p className="pricing-note">Cancel anytime</p>
          </div>
        </div>
        <div className="subscription-prompt-actions">
          <button className="subscription-prompt-button subscription-prompt-button-primary" onClick={handleSubscribe}>
            Subscribe to ClashOps Diamond
          </button>
          <button className="subscription-prompt-button subscription-prompt-button-secondary" onClick={handleClose}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPrompt

