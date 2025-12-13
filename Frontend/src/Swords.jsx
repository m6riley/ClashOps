import React from 'react'

function Swords({ className, size = 32 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Left sword */}
      <g transform="translate(50, 50) rotate(-45) translate(-50, -50)">
        {/* Blade */}
        <line x1="50" y1="20" x2="50" y2="80" stroke="#ffd700" strokeWidth="4" strokeLinecap="round"/>
        {/* Crossguard */}
        <line x1="40" y1="50" x2="60" y2="50" stroke="#ffd700" strokeWidth="5" strokeLinecap="round"/>
        {/* Handle */}
        <line x1="50" y1="80" x2="50" y2="90" stroke="#ffd700" strokeWidth="3" strokeLinecap="round"/>
        {/* Point */}
        <path d="M 50 20 L 48 15 L 52 15 Z" fill="#ffd700"/>
      </g>
      
      {/* Right sword */}
      <g transform="translate(50, 50) rotate(45) translate(-50, -50)">
        {/* Blade */}
        <line x1="50" y1="20" x2="50" y2="80" stroke="#ffd700" strokeWidth="4" strokeLinecap="round"/>
        {/* Crossguard */}
        <line x1="40" y1="50" x2="60" y2="50" stroke="#ffd700" strokeWidth="5" strokeLinecap="round"/>
        {/* Handle */}
        <line x1="50" y1="80" x2="50" y2="90" stroke="#ffd700" strokeWidth="3" strokeLinecap="round"/>
        {/* Point */}
        <path d="M 50 20 L 48 15 L 52 15 Z" fill="#ffd700"/>
      </g>
    </svg>
  )
}

export default Swords

