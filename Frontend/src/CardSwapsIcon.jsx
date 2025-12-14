import React from 'react'

function CardSwapsIcon({ className, size = 20 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="cardSwapsGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7"/>
          <stop offset="50%" stopColor="#6366f1"/>
          <stop offset="100%" stopColor="#14b8a6"/>
        </linearGradient>
      </defs>
      <path
        d="M8 3.5L8 16.5M8 3.5L3.5 7.83333M8 3.5L12.5 7.83333"
        stroke="url(#cardSwapsGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 20.5L17 7.5M17 20.5L21.5 16.1667M17 20.5L12.5 16.1667"
        stroke="url(#cardSwapsGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default CardSwapsIcon
