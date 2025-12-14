import React from 'react'

function TowerTroopIcon({ className, size = 20 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="towerTroopGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7"/>
          <stop offset="50%" stopColor="#6366f1"/>
          <stop offset="100%" stopColor="#14b8a6"/>
        </linearGradient>
      </defs>
      <polygon
        points="244.071,0 244.071,90.26 390.352,46.692"
        fill="url(#towerTroopGradient)"
      />
      <path
        d="M396.059,287.904V133.836h-56.022v49.798h-56.026v-49.798H227.99v49.798h-56.022v-49.798h-56.026v154.068
        H64.587V512h143.787v-78.43c0-26.299,21.326-47.625,47.629-47.625c26.302,0,47.625,21.326,47.625,47.625V512h143.786V287.904
        H396.059z M227.99,287.904h-46.687v-46.691h46.687V287.904z M330.698,287.904h-46.687v-46.691h46.687V287.904z"
        fill="url(#towerTroopGradient)"
      />
    </svg>
  )
}

export default TowerTroopIcon
