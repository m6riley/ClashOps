import React, { useState, useEffect } from 'react'
import './OptimizeLoading.css'

function OptimizeLoading({ onClose, onComplete, apiComplete }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        const increment = Math.random() * 6 + 2
        return Math.min(prev + increment, 100)
      })
    }, 200)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Only complete when both progress reaches 100 AND API call is complete
    if (progress === 100 && apiComplete) {
      const timeout = setTimeout(() => {
        if (onComplete) {
          onComplete()
        }
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [progress, apiComplete, onComplete])

  // Neural network structure: input layer (4 nodes), hidden layer 1 (6 nodes), hidden layer 2 (5 nodes), output layer (3 nodes)
  const layers = [
    { nodes: 4, label: 'Input' },
    { nodes: 6, label: 'Hidden 1' },
    { nodes: 5, label: 'Hidden 2' },
    { nodes: 3, label: 'Output' }
  ]

  return (
    <div className="optimize-loading-overlay" onClick={onClose}>
      <div className="optimize-loading-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="optimize-loading-header">
          <h2 className="optimize-loading-title">Optimizing Deck</h2>
          <p className="optimize-loading-subtitle">Analyzing your deck and generating recommendations...</p>
        </div>
        
        <div className="neural-network-container">
          <svg className="neural-network-svg" viewBox="0 0 600 400">
            {/* Draw connections */}
            {layers.map((layer, layerIndex) => {
              if (layerIndex === layers.length - 1) return null
              const nextLayer = layers[layerIndex + 1]
              return (
                <g key={`connections-${layerIndex}`}>
                  {Array.from({ length: layer.nodes }).map((_, i) => 
                    Array.from({ length: nextLayer.nodes }).map((_, j) => {
                      const x1 = 100 + layerIndex * 150
                      const y1 = 80 + (i * (240 / (layer.nodes - 1 || 1)))
                      const x2 = 100 + (layerIndex + 1) * 150
                      const y2 = 80 + (j * (240 / (nextLayer.nodes - 1 || 1)))
                      const delay = (i * nextLayer.nodes + j) * 0.1
                      return (
                        <line
                          key={`${i}-${j}`}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          className="neural-connection"
                          style={{
                            animationDelay: `${delay}s`,
                            opacity: progress > 20 ? 1 : 0.3
                          }}
                        />
                      )
                    })
                  )}
                </g>
              )
            })}
            
            {/* Draw nodes */}
            {layers.map((layer, layerIndex) => (
              <g key={`layer-${layerIndex}`} className="neural-layer">
                {Array.from({ length: layer.nodes }).map((_, i) => {
                  const x = 100 + layerIndex * 150
                  const y = 80 + (i * (240 / (layer.nodes - 1 || 1)))
                  const delay = (layerIndex * 10 + i) * 0.15
                  return (
                    <g key={`node-${i}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r={12}
                        className="neural-node"
                        style={{
                          animationDelay: `${delay}s`
                        }}
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r={8}
                        className="neural-node-core"
                        style={{
                          animationDelay: `${delay + 0.1}s`
                        }}
                      />
                    </g>
                  )
                })}
              </g>
            ))}
          </svg>
        </div>

      </div>
    </div>
  )
}

export default OptimizeLoading

