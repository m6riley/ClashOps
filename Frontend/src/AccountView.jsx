import React, { useState } from 'react'
import './AccountView.css'

function AccountView({ isLoggedIn, setIsLoggedIn, isSubscribed, setIsSubscribed, onSubscribe }) {
  const [isSignUp, setIsSignUp] = useState(true) // Toggle between sign up and login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editEmail, setEditEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editConfirmPassword, setEditConfirmPassword] = useState('')

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
  }

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value)
  }

  const handleSignUp = () => {
    // TODO: Implement sign up functionality
    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    console.log('Signing up:', { email, password: '***' })
    setIsLoggedIn(true)
  }

  const handleLogin = () => {
    // TODO: Implement login functionality
    console.log('Logging in:', { email, password: '***' })
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setIsEditing(false)
    setEditEmail('')
    setCurrentPassword('')
    setEditPassword('')
    setEditConfirmPassword('')
  }

  const handleSubscribe = () => {
    if (onSubscribe) {
      onSubscribe()
    } else {
      // Fallback if onSubscribe is not provided
      setIsSubscribed(true)
      console.log('Subscribing to ClashOps Diamond')
    }
  }

  const handleCancelSubscription = () => {
    // TODO: Implement cancel subscription functionality
    setIsSubscribed(false)
    console.log('Cancelling ClashOps Diamond subscription')
  }

  const handleEditAccount = () => {
    setIsEditing(true)
    setEditEmail(email)
    setCurrentPassword('')
    setEditPassword('')
    setEditConfirmPassword('')
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditEmail(email)
    setCurrentPassword('')
    setEditPassword('')
    setEditConfirmPassword('')
  }

  const handleSaveEdit = () => {
    // TODO: Implement save edit functionality
    if (!currentPassword) {
      alert('Please enter your current password')
      return
    }
    if (editPassword && editPassword !== editConfirmPassword) {
      alert('New passwords do not match')
      return
    }
    if (editPassword && !editConfirmPassword) {
      alert('Please confirm your new password')
      return
    }
    console.log('Saving account changes:', { email: editEmail, currentPassword: '***', newPassword: editPassword ? '***' : 'unchanged' })
    setEmail(editEmail)
    setIsEditing(false)
    setCurrentPassword('')
    setEditPassword('')
    setEditConfirmPassword('')
  }

  const handleDeleteAccount = () => {
    // TODO: Implement delete account functionality
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      console.log('Deleting account')
      handleLogout()
    }
  }

  // Show sign up/login form if not logged in
  if (!isLoggedIn) {
    return (
      <div className="account-view">
        <div className="account-header">
          <h1 className="account-title">Account</h1>
        </div>

        <div className="account-content">
          <div className="account-section">
            <div className="auth-toggle">
              <button
                className={`auth-toggle-button ${isSignUp ? 'active' : ''}`}
                onClick={() => setIsSignUp(true)}
              >
                Sign Up
              </button>
              <button
                className={`auth-toggle-button ${!isSignUp ? 'active' : ''}`}
                onClick={() => setIsSignUp(false)}
              >
                Login
              </button>
            </div>
            <div className="account-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  className="form-input"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                />
              </div>
              {isSignUp && (
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    className="form-input"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder="Confirm your password"
                  />
                </div>
              )}
              <button 
                className="account-button account-button-primary" 
                onClick={isSignUp ? handleSignUp : handleLogin}
              >
                {isSignUp ? 'Sign Up' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show account information if logged in
  return (
    <div className="account-view">
      <div className="account-header">
        <h1 className="account-title">Account</h1>
      </div>

      <div className="account-content">
        <div className="account-section">
          <h2 className="account-section-title">Account Information</h2>
          {!isEditing ? (
            <div className="account-info">
              <div className="account-info-item">
                <span className="account-info-label">Email:</span>
                <span className="account-info-value">{email}</span>
              </div>
              <div className="account-actions">
                <button className="account-button account-button-primary" onClick={handleEditAccount}>
                  Edit Account
                </button>
                <button className="account-button account-button-secondary" onClick={handleLogout}>
                  Logout
                </button>
                <button className="account-button account-button-danger" onClick={handleDeleteAccount}>
                  Delete Account
                </button>
              </div>
            </div>
          ) : (
            <div className="account-form">
              <div className="form-group">
                <label htmlFor="editEmail" className="form-label">Email</label>
                <input
                  type="email"
                  id="editEmail"
                  className="form-input"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="currentPassword" className="form-label">Current Password *</label>
                <input
                  type="password"
                  id="currentPassword"
                  className="form-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="editPassword" className="form-label">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  id="editPassword"
                  className="form-input"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              {editPassword && (
                <div className="form-group">
                  <label htmlFor="editConfirmPassword" className="form-label">Confirm New Password *</label>
                  <input
                    type="password"
                    id="editConfirmPassword"
                    className="form-input"
                    value={editConfirmPassword}
                    onChange={(e) => setEditConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              )}
              <div className="account-form-actions">
                <button className="account-button account-button-primary" onClick={handleSaveEdit}>
                  Save Changes
                </button>
                <button className="account-button account-button-secondary" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="account-section">
          <h2 className="account-section-title">Subscription</h2>
          <div className="subscription-card">
            <div className="subscription-header">
              <div className="subscription-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="subscription-info">
                <h3 className="subscription-name">ClashOps Diamond</h3>
                <p className="subscription-description">Premium deck analysis and insights</p>
              </div>
            </div>
            <div className="subscription-status">
              {isSubscribed ? (
                <>
                  <div className="subscription-active">
                    <span className="subscription-badge">Active</span>
                    <p className="subscription-status-text">Your subscription is active</p>
                  </div>
                  <button className="account-button account-button-secondary" onClick={handleCancelSubscription}>
                    Cancel Subscription
                  </button>
                </>
              ) : (
                <>
                  <div className="subscription-pricing">
                    <div className="pricing-amount">
                      <span className="pricing-currency">$</span>
                      <span className="pricing-value">4.99</span>
                      <span className="pricing-period">/month</span>
                    </div>
                    <p className="pricing-note">Cancel anytime</p>
                  </div>
                  <button className="account-button account-button-premium" onClick={handleSubscribe}>
                    Subscribe to ClashOps Diamond
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountView

