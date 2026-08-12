import React from 'react'
import './FeatureBanner.css'

const COLOR_CLASSES = {
  gold: 'feature-banner-content--gold',
  purple: 'feature-banner-content--purple',
  pink: 'feature-banner-content--pink',
}

function getColorClass(color) {
  const normalized = typeof color === 'string' ? color.trim().toLowerCase() : ''
  return COLOR_CLASSES[normalized] || COLOR_CLASSES.gold
}

function FeatureBanner({ feature, decks, isExpanded, onSeeAll, onBack, hideSeeAll = false }) {
  const colorClass = getColorClass(feature?.color)

  return (
    <div className={`feature-banner ${isExpanded ? 'feature-banner-expanded' : ''}`}>
      <div className={`feature-banner-content ${colorClass}`}>
        <div className="feature-text-section">
          <div className="feature-type">{feature.featured_type}</div>
          <div className="feature-name">{feature.featured_title || feature.featured_text}</div>
          {isExpanded ? (
            <div className="feature-back" onClick={onBack}>
              ← Back
            </div>
          ) : feature.featured_image && !hideSeeAll && (
            <div className="feature-see-all" onClick={onSeeAll}>
              See All →
            </div>
          )}
        </div>
        {feature.featured_image && (
          <div className="feature-image-section">
            <img 
              src={feature.featured_image} 
              alt={feature.featured_title || feature.featured_text}
              className="feature-character-image"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default FeatureBanner
