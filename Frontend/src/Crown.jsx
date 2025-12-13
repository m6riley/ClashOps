import React from 'react'

function Crown({ className, size = 32 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 0.8}
      viewBox="0 0 120 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Base band */}
      <rect x="10" y="70" width="100" height="8" rx="2" fill="#ffd700"/>
      <rect x="15" y="82" width="90" height="8" rx="2" fill="#ffd700"/>
      
      {/* Left side peak */}
      <path
        d="M 25 70 L 30 30 L 35 70"
        stroke="#ffd700"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="30" cy="25" r="5" fill="#ffd700"/>
      
      {/* Left-center peak */}
      <path
        d="M 40 70 L 45 40 L 50 70"
        stroke="#ffd700"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="45" cy="35" r="4" fill="#ffd700"/>
      
      {/* Center peak (tallest) */}
      <path
        d="M 55 70 L 60 15 L 65 70"
        stroke="#ffd700"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="60" cy="10" r="6" fill="#ffd700"/>
      
      {/* Right-center peak */}
      <path
        d="M 70 70 L 75 40 L 80 70"
        stroke="#ffd700"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="75" cy="35" r="4" fill="#ffd700"/>
      
      {/* Right side peak */}
      <path
        d="M 85 70 L 90 30 L 95 70"
        stroke="#ffd700"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="90" cy="25" r="5" fill="#ffd700"/>
    </svg>
  )
}

export default Crown

