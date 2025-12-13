import React, { useState, useEffect } from 'react'
import './FilterCardsView.css'
import { getCardImageUrl } from './cardUtils'

function FilterCardsView({ cards, selectedCards, excludedCards, onCardToggle, onConfirm, onCancel, onClearFilters, filteredDeckCount }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortMode, setSortMode] = useState('name') // 'name', 'elixir', 'rarity', 'arena'
  const [sortDirection, setSortDirection] = useState('asc') // 'asc' or 'desc'

  const filteredCards = cards.filter(card => 
    card.card_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort the filtered cards
  const sortedCards = [...filteredCards].sort((a, b) => {
    let comparison = 0
    
    switch (sortMode) {
      case 'name':
        comparison = a.card_name.localeCompare(b.card_name)
        break
      case 'elixir':
        const elixirA = parseFloat(a.elixer_cost) || 0
        const elixirB = parseFloat(b.elixer_cost) || 0
        comparison = elixirA - elixirB
        break
      case 'rarity':
        const rarityA = parseFloat(a.rarity) || 0
        const rarityB = parseFloat(b.rarity) || 0
        comparison = rarityA - rarityB
        break
      case 'arena':
        const arenaA = parseFloat(a.arena) || 0
        const arenaB = parseFloat(b.arena) || 0
        comparison = arenaA - arenaB
        break
      default:
        comparison = 0
    }
    
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const toggleSortMode = () => {
    const modes = ['name', 'elixir', 'rarity', 'arena']
    const currentIndex = modes.indexOf(sortMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setSortMode(modes[nextIndex])
  }

  const getSortModeLabel = () => {
    switch (sortMode) {
      case 'name': return 'Name'
      case 'elixir': return 'Elixir Cost'
      case 'rarity': return 'Rarity'
      case 'arena': return 'Arena'
      default: return 'Name'
    }
  }

  return (
    <div className="filter-cards-view">
      <div className="filter-cards-header">
        <h2 className="filter-cards-title">Filter Cards</h2>
        <div className="filter-cards-actions">
          <button className="filter-cards-button filter-cards-clear" onClick={onClearFilters}>
            Clear Filters
          </button>
          <button className="filter-cards-button filter-cards-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button 
            className="filter-cards-button filter-cards-confirm" 
            onClick={onConfirm}
            disabled={filteredDeckCount === 0 || (selectedCards.length === 0 && excludedCards.length === 0)}
          >
            Confirm ({filteredDeckCount} unique decks)
          </button>
        </div>
      </div>

      <div className="filter-cards-controls">
        <div className="filter-cards-search">
          <input
            type="text"
            placeholder="Search cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-cards-search-input"
          />
        </div>
        <div className="filter-cards-sort">
          <div className="sort-controls">
            <button 
              className="sort-mode-button"
              onClick={toggleSortMode}
              title={`Sort by: ${getSortModeLabel()}`}
            >
              <span className="sort-label">Sort by:</span>
              <span className="sort-mode-value">{getSortModeLabel()}</span>
            </button>
            <button 
              className="sort-direction-button"
              onClick={toggleSortDirection}
              title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortDirection === 'asc' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M7 14l5-5 5 5H7z" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M7 10l5 5 5-5H7z" fill="currentColor"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="filter-cards-selected">
        {selectedCards.length > 0 && (
          <div className="selected-cards-list">
            <span className="selected-cards-label">Included: </span>
            {selectedCards.map((cardName, index) => (
              <span key={index} className="selected-card-tag">
                {cardName}
                <button 
                  className="selected-card-remove"
                  onClick={() => onCardToggle(cardName)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {excludedCards.length > 0 && (
          <div className="excluded-cards-list">
            <span className="excluded-cards-label">Excluded: </span>
            {excludedCards.map((cardName, index) => (
              <span key={index} className="excluded-card-tag">
                {cardName}
                <button 
                  className="excluded-card-remove"
                  onClick={() => onCardToggle(cardName)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="filter-cards-grid">
        {sortedCards.map((card) => {
          const isSelected = selectedCards.includes(card.card_name)
          const isExcluded = excludedCards.includes(card.card_name)
          return (
            <div
              key={card.card_name}
              className={`filter-card-item ${isSelected ? 'selected' : ''} ${isExcluded ? 'excluded' : ''}`}
              onClick={() => onCardToggle(card.card_name)}
            >
              <div className="filter-card-image-container">
                <img
                  src={getCardImageUrl(card.card_name)}
                  alt={card.card_name}
                  className="filter-card-image"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    if (e.target.nextSibling) {
                      e.target.nextSibling.style.display = 'flex'
                    }
                  }}
                />
                <div className="filter-card-placeholder" style={{ display: 'none' }}>
                  {card.card_name}
                </div>
                {isSelected && (
                  <div className="filter-card-selected-badge">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="#4caf50"/>
                    </svg>
                  </div>
                )}
                {isExcluded && (
                  <div className="filter-card-excluded-badge">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#f44336"/>
                    </svg>
                  </div>
                )}
              </div>
              <div className="filter-card-name">{card.card_name}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default FilterCardsView

