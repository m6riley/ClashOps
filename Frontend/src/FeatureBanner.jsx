import React from 'react'
import './FeatureBanner.css'

function FeatureBanner({ feature, decks, isExpanded, onSeeAll, onBack, hideSeeAll = false }) {
  return (
    <div className={`feature-banner ${isExpanded ? 'feature-banner-expanded' : ''}`}>
      <div className="feature-banner-content">
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

