import React from 'react'

function OffenseIcon({ className, size = 20 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="offenseGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7"/>
          <stop offset="50%" stopColor="#6366f1"/>
          <stop offset="100%" stopColor="#14b8a6"/>
        </linearGradient>
      </defs>
      <path d="m2.75 9.25 1.5 2.5 2 1.5m-4.5 0 1 1m1.5-2.5-1.5 1.5m3-1 8.5-8.5v-2h-2l-8.5 8.5" stroke="url(#offenseGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="m10.25 12.25-2.25-2.25m2-2 2.25 2.25m1-1-1.5 2.5-2 1.5m4.5 0-1 1m-1.5-2.5 1.5 1.5m-7.25-5.25-4.25-4.25v-2h2l4.25 4.25" stroke="url(#offenseGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default OffenseIcon
