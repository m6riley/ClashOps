import React, { useState } from 'react'
import './AccountView.css'

function AccountView({ isLoggedIn, setIsLoggedIn, isSubscribed, setIsSubscribed, onSubscribe, onNotification, onLogin, onLogout }) {
  const [isSignUp, setIsSignUp] = useState(true) // Toggle between sign up and login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editEmail, setEditEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editConfirmPassword, setEditConfirmPassword] = useState('')
  const [editError, setEditError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
  }

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value)
  }

  const handleSignUp = async () => {
    // Clear previous errors
    setError('')
    
    // Validate inputs
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch('https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/add_account?code=Z7f1S2AuqLIj9H3HvicdkS351FORRERoGVx1RcvNu0TTAzFuQ0VEDg==', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password
        })
      })
      
      if (response.status === 409) {
        // Account already exists
        setError('An account with this email already exists. Please log in instead.')
        setIsSignUp(false) // Switch to login view
        setPassword('')
        setConfirmPassword('')
        return
      }
      
      if (!response.ok) {
        const errorText = await response.text()
        setError(errorText || `Failed to create account. Status: ${response.status}`)
        return
      }
      
      // Success - account created
      const data = await response.json()
      const accountId = data.id || data.account_id
      
      if (onNotification) {
        onNotification({
          message: 'Account created successfully! You are now logged in.',
          type: 'success'
        })
      }
      setIsLoggedIn(true)
      if (onLogin && accountId) {
        onLogin(accountId)
      }
      setPassword('')
      setConfirmPassword('')
      setError('')
    } catch (err) {
      console.error('Error signing up:', err)
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('Network error: Unable to connect to server. Please try again.')
      } else {
        setError(err.message || 'An error occurred while creating your account. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async () => {
    // Clear previous errors
    setError('')
    
    // Validate inputs
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch('https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/get_account?code=3DCBXjji828GQZGeMZrrF6Nz0mXya13nYAM06OX2u5VRAzFuBE9MwQ==', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password
        })
      })
      
      if (response.status === 409) {
        // Account does not exist
        setError('Account does not exist. Please sign up instead.')
        setIsSignUp(true) // Switch to sign up view
        setPassword('')
        return
      }
      
      if (response.status === 408) {
        // Password is incorrect
        setError('Password is incorrect. Please try again.')
        setPassword('')
        return
      }
      
      if (!response.ok) {
        const errorText = await response.text()
        setError(errorText || `Failed to log in. Status: ${response.status}`)
        return
      }
      
      // Success - account verified
      const data = await response.json()
      const accountId = data.id || data.account_id
      
      if (onNotification) {
        onNotification({
          message: 'Logged in successfully!',
          type: 'success'
        })
      }
      setIsLoggedIn(true)
      if (onLogin && accountId) {
        onLogin(accountId)
      }
      setPassword('')
      setError('')
    } catch (err) {
      console.error('Error logging in:', err)
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('Network error: Unable to connect to server. Please try again.')
      } else {
        setError(err.message || 'An error occurred while logging in. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    if (onLogout) {
      onLogout()
    }
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
    setEditError('')
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditEmail(email)
    setCurrentPassword('')
    setEditPassword('')
    setEditConfirmPassword('')
    setEditError('')
  }

  const handleSaveEdit = async () => {
    // Clear previous errors
    setEditError('')
    
    // Validate inputs
    if (!currentPassword) {
      setEditError('Please enter your current password')
      return
    }
    
    // If no new password is provided, nothing to update
    if (!editPassword) {
      setEditError('Please enter a new password to update your account')
      return
    }
    
    if (editPassword !== editConfirmPassword) {
      setEditError('New passwords do not match')
      return
    }
    
    if (editPassword.length < 6) {
      setEditError('New password must be at least 6 characters long')
      return
    }
    
    // Verify current password first
    setIsSaving(true)
    
    try {
      // First, verify the current password
      const verifyResponse = await fetch('https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/get_account?code=3DCBXjji828GQZGeMZrrF6Nz0mXya13nYAM06OX2u5VRAzFuBE9MwQ==', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: currentPassword
        })
      })
      
      if (verifyResponse.status === 408) {
        // Current password is incorrect
        setEditError('Current password is incorrect')
        setCurrentPassword('')
        setIsSaving(false)
        return
      }
      
      if (verifyResponse.status === 409) {
        // Account doesn't exist (shouldn't happen if logged in)
        setEditError('Account not found. Please log out and log back in.')
        setIsSaving(false)
        return
      }
      
      if (!verifyResponse.ok) {
        const errorText = await verifyResponse.text()
        setEditError(errorText || 'Failed to verify current password')
        setIsSaving(false)
        return
      }
      
      // Current password is correct, now update to new password
      const updateResponse = await fetch('https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/edit_account?code=9khy8ssiYDaWELHWSdKpqNRp2QIJs2p9EQ6FrShUjbjLAzFuDL3joQ==', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: editPassword
        })
      })
      
      if (updateResponse.status === 404) {
        setEditError('Account not found. Please log out and log back in.')
        setIsSaving(false)
        return
      }
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        setEditError(errorText || 'Failed to update password')
        setIsSaving(false)
        return
      }
      
      // Success - password updated
      if (onNotification) {
        onNotification({
          message: 'Password updated successfully!',
          type: 'success'
        })
      }
      setIsEditing(false)
      setCurrentPassword('')
      setEditPassword('')
      setEditConfirmPassword('')
      setEditError('')
    } catch (err) {
      console.error('Error updating account:', err)
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setEditError('Network error: Unable to connect to server. Please try again.')
      } else {
        setEditError(err.message || 'An error occurred while updating your account. Please try again.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }
    
    if (!email) {
      if (onNotification) {
        onNotification({
          message: 'Unable to delete account: Email not found',
          type: 'error'
        })
      }
      return
    }
    
    try {
      const response = await fetch('https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/delete_account?code=b-81qak2fzOZYkkxtnZn822F9AFErgXNCZSCd4AS0xJ9AzFuuJCe6g==', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase()
        })
      })
      
      if (response.status === 404) {
        if (onNotification) {
          onNotification({
            message: 'Account not found. You may already be logged out.',
            type: 'error'
          })
        }
        handleLogout()
        return
      }
      
      if (!response.ok) {
        const errorText = await response.text()
        if (onNotification) {
          onNotification({
            message: errorText || 'Failed to delete account',
            type: 'error'
          })
        }
        return
      }
      
      // Success - account deleted
      if (onNotification) {
        onNotification({
          message: 'Account deleted successfully',
          type: 'success'
        })
      }
      handleLogout()
    } catch (err) {
      console.error('Error deleting account:', err)
      if (onNotification) {
        onNotification({
          message: err.name === 'TypeError' && err.message.includes('Failed to fetch')
            ? 'Network error: Unable to connect to server. Please try again.'
            : 'An error occurred while deleting your account. Please try again.',
          type: 'error'
        })
      }
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
              {error && (
                <div className="form-error" style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}
              <button 
                className="account-button account-button-primary" 
                onClick={isSignUp ? handleSignUp : handleLogin}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Login')}
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
                  readOnly
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
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
                <label htmlFor="editPassword" className="form-label">New Password *</label>
                <input
                  type="password"
                  id="editPassword"
                  className="form-input"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
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
              {editError && (
                <div className="form-error" style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  {editError}
                </div>
              )}
              <div className="account-form-actions">
                <button 
                  className="account-button account-button-primary" 
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  className="account-button account-button-secondary" 
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
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

