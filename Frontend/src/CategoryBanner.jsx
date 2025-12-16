import React from 'react'
import './CategoryBanner.css'

function CategoryBanner({ category, isExpanded, onSeeAll, onBack, hideSeeAll = false, getCategoryIconUrl }) {
  const gradientColors = {
    '#ef4444': ['#ef4444', '#dc2626', '#b91c1c'], // Red
    '#3b82f6': ['#3b82f6', '#2563eb', '#1d4ed8'], // Blue
    '#10b981': ['#10b981', '#059669', '#047857'], // Green
    '#a855f7': ['#a855f7', '#9333ea', '#7e22ce'], // Purple
    '#eab308': ['#eab308', '#ca8a04', '#a16207'], // Yellow
    '#f97316': ['#f97316', '#ea580c', '#c2410c'], // Orange
    '#ec4899': ['#ec4899', '#db2777', '#be185d'], // Pink
    '#06b6d4': ['#06b6d4', '#0891b2', '#0e7490'], // Cyan
    '#6366f1': ['#6366f1', '#4f46e5', '#4338ca'], // Indigo
    '#14b8a6': ['#14b8a6', '#0d9488', '#0f766e'], // Teal
    '#f59e0b': ['#f59e0b', '#d97706', '#b45309'], // Amber
    '#f43f5e': ['#f43f5e', '#e11d48', '#be123c']  // Rose
  }

  const getGradient = (color) => {
    const colors = gradientColors[color] || [color, color, color]
    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`
  }

  return (
    <div className={`category-banner ${isExpanded ? 'category-banner-expanded' : ''}`} style={{ background: getGradient(category.color) }}>
      <div className="category-banner-content">
        <div className="category-text-section">
          <div className="category-name">{category.name}</div>
          {isExpanded ? (
            <div className="category-back" onClick={onBack}>
              ← Back
            </div>
          ) : !hideSeeAll && (
            <div className="category-see-all" onClick={onSeeAll}>
              See All →
            </div>
          )}
        </div>
        {category.icon && (
          <div className="category-image-section">
            <img 
              src={getCategoryIconUrl ? getCategoryIconUrl(category.icon) : `/category_icons/${category.icon}${category.icon.includes('.') ? '' : '.png'}`}
              alt={category.name}
              className="category-icon-image"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoryBanner

