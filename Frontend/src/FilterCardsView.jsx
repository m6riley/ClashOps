import React, { useState, useEffect } from 'react'
import './FilterCardsView.css'
import { getCardImageUrl, getCardEvolutionImageUrl, getCardHeroImageUrl } from './cardUtils'

function FilterCardsView({ cards, selectedCards, excludedCards, onCardToggle, onConfirm, onCancel, onClearFilters, filteredDeckCount, variantMode, onVariantModeChange }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortMode, setSortMode] = useState('name') // 'name', 'elixir', 'rarity', 'arena'
  const [sortDirection, setSortDirection] = useState('asc') // 'asc' or 'desc'
  const [cardVariantMode, setCardVariantMode] = useState(variantMode || 'basic') // 'basic', 'evolution', 'hero'
  
  // Sync with parent variant mode
  useEffect(() => {
    if (variantMode !== undefined) {
      setCardVariantMode(variantMode)
    }
  }, [variantMode])
  
  // Notify parent when variant mode changes
  const handleVariantModeChange = (newMode) => {
    setCardVariantMode(newMode)
    if (onVariantModeChange) {
      onVariantModeChange(newMode)
    }
  }
  const [cardsWithVariants, setCardsWithVariants] = useState({
    evolution: new Set(),
    hero: new Set()
  })

  // Check which cards have evolution and hero variants
  useEffect(() => {
    const checkVariants = async () => {
      const evolutionSet = new Set()
      const heroSet = new Set()
      
      // Check a sample of cards to see which have variants
      // We'll check all cards but cache the results
      const checkPromises = cards.map(card => {
        return Promise.all([
          new Promise((resolve) => {
            const img = new Image()
            img.onload = () => {
              evolutionSet.add(card.card_name)
              resolve(true)
            }
            img.onerror = () => resolve(false)
            img.src = getCardEvolutionImageUrl(card.card_name)
            setTimeout(() => resolve(false), 1000) // Timeout after 1 second
          }),
          new Promise((resolve) => {
            const img = new Image()
            img.onload = () => {
              heroSet.add(card.card_name)
              resolve(true)
            }
            img.onerror = () => resolve(false)
            img.src = getCardHeroImageUrl(card.card_name)
            setTimeout(() => resolve(false), 1000) // Timeout after 1 second
          })
        ])
      })
      
      await Promise.all(checkPromises)
      setCardsWithVariants({
        evolution: evolutionSet,
        hero: heroSet
      })
    }
    
    checkVariants()
  }, [cards])

  // Filter cards based on variant mode
  const variantFilteredCards = cards.filter(card => {
    if (cardVariantMode === 'basic') {
      return true // Show all cards in basic mode
    } else if (cardVariantMode === 'evolution') {
      return cardsWithVariants.evolution.has(card.card_name)
    } else if (cardVariantMode === 'hero') {
      return cardsWithVariants.hero.has(card.card_name)
    }
    return true
  })

  const filteredCards = variantFilteredCards.filter(card => 
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
            disabled={filteredDeckCount === 0}
          >
            Confirm ({filteredDeckCount} unique decks)
          </button>
        </div>
      </div>

      <div className="filter-cards-controls">
        <div className="filter-cards-controls-row">
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
        <div className="filter-cards-variant-toggle">
          <button
            className={`variant-toggle-button ${cardVariantMode === 'basic' ? 'active' : ''}`}
            onClick={() => handleVariantModeChange('basic')}
            title="Show all cards in basic version"
          >
            Basic
          </button>
          <button
            className={`variant-toggle-button ${cardVariantMode === 'evolution' ? 'active' : ''}`}
            onClick={() => handleVariantModeChange('evolution')}
            title="Show only cards with evolution versions"
          >
            Evolution
          </button>
          <button
            className={`variant-toggle-button ${cardVariantMode === 'hero' ? 'active' : ''}`}
            onClick={() => handleVariantModeChange('hero')}
            title="Show only cards with hero versions"
          >
            Hero
          </button>
        </div>
      </div>

      <div className="filter-cards-selected">
        {selectedCards.length > 0 && (
          <div className="selected-cards-list">
            <span className="selected-cards-label">Included: </span>
            {selectedCards.map((cardItem, index) => {
              const cardName = typeof cardItem === 'string' ? cardItem : cardItem.cardName
              const cardMode = typeof cardItem === 'string' ? 'basic' : (cardItem.mode || 'basic')
              const modeLabel = cardMode === 'evolution' ? 'EVO' : cardMode === 'hero' ? 'HERO' : 'BASIC'
              return (
                <span key={index} className="selected-card-tag">
                  <span className="card-tag-name">{cardName}</span>
                  <span className={`card-tag-mode card-tag-mode-${cardMode}`}>{modeLabel}</span>
                  <button 
                    className="selected-card-remove"
                    onClick={() => onCardToggle({ cardName, mode: cardMode })}
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        )}
        {excludedCards.length > 0 && (
          <div className="excluded-cards-list">
            <span className="excluded-cards-label">Excluded: </span>
            {excludedCards.map((cardItem, index) => {
              const cardName = typeof cardItem === 'string' ? cardItem : cardItem.cardName
              const cardMode = typeof cardItem === 'string' ? 'basic' : (cardItem.mode || 'basic')
              const modeLabel = cardMode === 'evolution' ? 'EVO' : cardMode === 'hero' ? 'HERO' : 'BASIC'
              return (
                <span key={index} className="excluded-card-tag">
                  <span className="card-tag-name">{cardName}</span>
                  <span className={`card-tag-mode card-tag-mode-${cardMode}`}>{modeLabel}</span>
                  <button 
                    className="excluded-card-remove"
                    onClick={() => onCardToggle({ cardName, mode: cardMode })}
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </div>

      <div className="filter-cards-grid">
        {sortedCards.map((card) => {
          // Check if this specific card variant (cardName + mode) is selected/excluded
          const isSelected = selectedCards.some(item => {
            const cardName = typeof item === 'string' ? item : item.cardName
            const cardMode = typeof item === 'string' ? 'basic' : (item.mode || 'basic')
            return cardName === card.card_name && cardMode === cardVariantMode
          })
          const isExcluded = excludedCards.some(item => {
            const cardName = typeof item === 'string' ? item : item.cardName
            const cardMode = typeof item === 'string' ? 'basic' : (item.mode || 'basic')
            return cardName === card.card_name && cardMode === cardVariantMode
          })
          return (
            <div
              key={`${card.card_name}-${cardVariantMode}`}
              className={`filter-card-item ${isSelected ? 'selected' : ''} ${isExcluded ? 'excluded' : ''}`}
              onClick={() => onCardToggle({ cardName: card.card_name, mode: cardVariantMode })}
            >
              <div className="filter-card-image-container">
                <img
                  src={
                    cardVariantMode === 'evolution' 
                      ? getCardEvolutionImageUrl(card.card_name)
                      : cardVariantMode === 'hero'
                      ? getCardHeroImageUrl(card.card_name)
                      : getCardImageUrl(card.card_name)
                  }
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

