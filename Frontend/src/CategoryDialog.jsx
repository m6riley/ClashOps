import React, { useState, useEffect } from 'react'
import './CategoryDialog.css'

// Available color options
const COLOR_OPTIONS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' }
]

function CategoryDialog({ category, onSave, onCancel }) {
  const [categoryName, setCategoryName] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value)
  const [selectedIcon, setSelectedIcon] = useState(null)
  const [availableIcons, setAvailableIcons] = useState([])
  const [isClosing, setIsClosing] = useState(false)

  // Load available icons from category_icons.json file
  useEffect(() => {
    const loadIcons = async () => {
      try {
        const response = await fetch('/category_icons.json')
        if (!response.ok) {
          throw new Error('Failed to load category icons')
        }
        const iconsData = await response.json()
        // Store icons as objects with name and url
        setAvailableIcons(iconsData)
      } catch (error) {
        console.error('Error loading category icons:', error)
        setAvailableIcons([])
      }
    }
    
    loadIcons()
  }, [])

  // Initialize form with category data if editing
  useEffect(() => {
    if (category) {
      setCategoryName(category.name || '')
      setSelectedColor(category.color || COLOR_OPTIONS[0].value)
      setSelectedIcon(category.icon || null)
    } else {
      // Reset for new category
      setCategoryName('')
      setSelectedColor(COLOR_OPTIONS[0].value)
      setSelectedIcon(null)
    }
  }, [category])

  const handleSave = () => {
    if (!categoryName.trim()) {
      return // Don't save if name is empty
    }
    
    setIsClosing(true)
    // Wait for fade out animation to complete
    setTimeout(() => {
      onSave({
        name: categoryName.trim(),
        color: selectedColor,
        icon: selectedIcon
      })
    }, 300) // Match animation duration
  }

  const handleCancel = () => {
    setIsClosing(true)
    // Wait for fade out animation to complete
    setTimeout(() => {
      onCancel()
    }, 300) // Match animation duration
  }

  return (
    <div className={`category-dialog-overlay ${isClosing ? 'fade-out' : 'fade-in'}`} onClick={handleCancel}>
      <div className={`category-dialog ${isClosing ? 'fade-out' : 'fade-in'}`} onClick={(e) => e.stopPropagation()}>
        <div className="category-dialog-header">
          <h3 className="category-dialog-title">
            {category ? 'Edit Category' : 'Create Category'}
          </h3>
        </div>
        
        <div className="category-dialog-content">
          {/* Category Name */}
          <div className="category-dialog-field">
            <label className="category-dialog-label">Category Name</label>
            <input
              type="text"
              className="category-dialog-input"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Enter category name"
              maxLength={50}
            />
          </div>

          {/* Color Selection */}
          <div className="category-dialog-field">
            <label className="category-dialog-label">Color</label>
            <div className="category-color-grid">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  className={`category-color-option ${selectedColor === color.value ? 'selected' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div className="category-dialog-field">
            <label className="category-dialog-label">Icon</label>
            <div className="category-icon-grid">
              <button
                className={`category-icon-option ${selectedIcon === null ? 'selected' : ''}`}
                onClick={() => setSelectedIcon(null)}
                title="No Icon"
              >
                <span className="category-icon-placeholder">—</span>
              </button>
              {availableIcons.map((icon) => {
                const iconName = typeof icon === 'string' ? icon : icon.name
                const iconUrl = typeof icon === 'string' ? `/category_icons/${iconName}${iconName.includes('.') ? '' : '.png'}` : icon.url
                return (
                  <button
                    key={iconName}
                    className={`category-icon-option ${selectedIcon === iconName ? 'selected' : ''}`}
                    onClick={() => setSelectedIcon(iconName)}
                    title={iconName.replace(/_/g, ' ').replace(/\.[^/.]+$/, '')}
                  >
                    <img
                      src={iconUrl}
                      alt={iconName}
                      className="category-icon-image"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  </button>
                )
              })}
            </div>
            {availableIcons.length === 0 && (
              <p className="category-dialog-hint">
                No icons found. Add PNG files to the category_icons folder.
              </p>
            )}
          </div>
        </div>

        <div className="category-dialog-actions">
          <button className="category-dialog-button category-dialog-button-cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button 
            className="category-dialog-button category-dialog-button-save" 
            onClick={handleSave}
            disabled={!categoryName.trim()}
          >
            {category ? 'Save Changes' : 'Create Category'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CategoryDialog

