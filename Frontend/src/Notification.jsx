import React, { useEffect, useState } from 'react'
import './Notification.css'

function Notification({ message, type, onClose, duration = 3000 }) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      // Wait for animation to complete before calling onClose
      setTimeout(() => {
        onClose()
      }, 300) // Match animation duration
    }, duration)

    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div className={`notification notification-${type} ${isExiting ? 'notification-exit' : 'notification-enter'}`}>
      <div className="notification-content">
        <div className="notification-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
          </svg>
        </div>
        <span className="notification-message">{message}</span>
      </div>
    </div>
  )
}

export default Notification

