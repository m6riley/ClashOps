import React from 'react'

function Trophy({ className, size = 24 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="diamond" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7"/>
          <stop offset="50%" stopColor="#6366f1"/>
          <stop offset="100%" stopColor="#14b8a6"/>
        </linearGradient>
      </defs>
      {/* Cup */}
      <path d="M60 40 h80 v40 c0 35 -25 55 -40 55 s-40 -20 -40 -55 z" fill="url(#diamond)" />
      {/* Left Handle */}
      <path d="M60 50 c-25 0 -25 40 0 40" fill="none" stroke="url(#diamond)" strokeWidth="8" strokeLinecap="round"/>
      {/* Right Handle */}
      <path d="M140 50 c25 0 25 40 0 40" fill="none" stroke="url(#diamond)" strokeWidth="8" strokeLinecap="round"/>
      {/* Stem */}
      <rect x="90" y="135" width="20" height="20" rx="4" fill="#6366f1"/>
      {/* Base */}
      <rect x="65" y="155" width="70" height="14" rx="6" fill="#14b8a6"/>
    </svg>
  )
}

export default Trophy
