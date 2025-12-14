import React from 'react'

function EvolutionsIcon({ className, size = 20 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="evolutionsGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7"/>
          <stop offset="50%" stopColor="#6366f1"/>
          <stop offset="100%" stopColor="#14b8a6"/>
        </linearGradient>
      </defs>
      <path
        d="M30.8,2.6l-1.4-1.4c-0.3-0.3-0.9-0.4-1.3-0.1l-4.3,2.9c-0.2,0.2-0.4,0.4-0.4,0.7c0,0.3,0.1,0.6,0.3,0.8l0,0l-5.3,5.3
        L1.8,15.9c-0.4,0.1-0.7,0.5-0.7,0.9c0,0.4,0.2,0.8,0.6,1l9,3.5l3.5,9c0.1,0.4,0.5,0.6,0.9,0.6c0,0,0,0,0,0c0.4,0,0.8-0.3,0.9-0.7
        L21.4,13l-2.5,2.5c-0.4,0.4-1,0.4-1.4,0c-0.2-0.2-0.3-0.5-0.3-0.7l7.9-7.9l0.7,0.7c0,0,0,0,0,0l0.7,0.7c0.2,0.2,0.4,0.3,0.7,0.3
        c0,0,0.1,0,0.1,0c0.3,0,0.6-0.2,0.7-0.4l2.9-4.3C31.2,3.5,31.2,3,30.8,2.6z M15.8,20.5c-0.2,0.2-0.5,0.3-0.7,0.3s-0.5-0.1-0.7-0.3
        l-2.9-2.9c-0.4-0.4-0.4-1,0-1.4s1-0.4,1.4,0l2.9,2.9C16.2,19.5,16.2,20.1,15.8,20.5z"
        fill="url(#evolutionsGradient)"
      />
    </svg>
  )
}

export default EvolutionsIcon
