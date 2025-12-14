import React, { useState, useEffect } from 'react'
import './DeckEditor.css'
import { getCardImageUrl, getCardEvolutionImageUrl, getCardHeroImageUrl } from './cardUtils'

function DeckSlotCardImage({ card, index }) {
  // Determine which variant to try based on card position
  const isEvolution = index < 2 // First two cards (slots 1-2)
  const isHero = index >= 2 && index < 4 // Third and fourth cards (slots 3-4)
  
  const [variantFailed, setVariantFailed] = useState(false)
  
  const evolutionUrl = getCardEvolutionImageUrl(card.name)
  const heroUrl = getCardHeroImageUrl(card.name)
  const normalUrl = getCardImageUrl(card.name)
  
  // Reset variantFailed when card name changes
  useEffect(() => {
    setVariantFailed(false)
  }, [card.name])
  
  // Determine initial image URL
  let imageUrl = normalUrl
  if (isEvolution && !variantFailed) {
    imageUrl = evolutionUrl
  } else if (isHero && !variantFailed) {
    imageUrl = heroUrl
  }
  
  const handleError = (e) => {
    if (!variantFailed) {
      // Variant image failed, try normal image
      setVariantFailed(true)
      e.target.src = normalUrl
    } else {
      // Normal image also failed, show placeholder
      e.target.style.display = 'none'
      if (e.target.nextSibling) {
        e.target.nextSibling.style.display = 'flex'
      }
    }
  }
  
  return (
    <>
      <img
        src={imageUrl}
        alt={card.name}
        className="deck-slot-card-image"
        onError={handleError}
        key={`${card.name}-${index}`}
      />
      <div className="deck-slot-card-placeholder" style={{ display: 'none' }}>
        {card.name}
      </div>
    </>
  )
}

function DeckEditor({ deck, allCards, onSave, onCancel, deckName, onNameChange, categories = [], selectedCategory, onCategoryChange, onCreateCategory, onEditCategory, onDeleteCategory }) {
  const initializeDeckCards = () => {
    // Handle empty deck (new deck creation)
    if (!deck.cards || deck.cards.length === 0) {
      return Array(8).fill(null).map(() => ({ name: null, rarity: 'common' }))
    }
    const cards = deck.cards.map(card => ({ 
      name: card && card.name ? card.name : null, 
      rarity: (card && card.rarity) ? card.rarity : 'common' 
    }))
    // Fill deck slots to 8
    while (cards.length < 8) {
      cards.push({ name: null, rarity: 'common' })
    }
    return cards
  }

  const [deckCards, setDeckCards] = useState(initializeDeckCards)
  const [draggedCard, setDraggedCard] = useState(null)
  const [draggedFromIndex, setDraggedFromIndex] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortMode, setSortMode] = useState('name') // 'name', 'elixir', 'rarity', 'arena'
  const [sortDirection, setSortDirection] = useState('asc') // 'asc' or 'desc'
  const [editedDeckName, setEditedDeckName] = useState(deckName || 'My Favourite Deck')

  // Helper function to check if a card is a champion (rarity 5)
  const isChampion = (cardName) => {
    if (!cardName) return false
    const card = allCards.find(c => c.card_name === cardName)
    return card && parseFloat(card.rarity) === 5
  }

  // Helper function to count champions in deck
  const countChampions = (cards) => {
    return cards.filter(card => card.name && isChampion(card.name)).length
  }

  const handleCardDragStart = (e, card, index, isFromDeck = false) => {
    setDraggedCard(card)
    setDraggedFromIndex({ index, isFromDeck })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleCardDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleCardDrop = (e, targetIndex) => {
    e.preventDefault()
    
    if (!draggedCard || draggedCard.name === null) return

    const newDeckCards = [...deckCards]
    const isDraggedCardChampion = isChampion(draggedCard.name)
    const championSlots = [2, 3] // Slots 3 and 4 (0-indexed: 2, 3)
    
    if (draggedFromIndex.isFromDeck) {
      // Moving from deck slot to deck slot
      if (draggedFromIndex.index === targetIndex) return
      
      const sourceCard = newDeckCards[draggedFromIndex.index]
      const targetCard = newDeckCards[targetIndex]
      const isSourceChampion = isChampion(sourceCard.name)
      const isTargetChampion = isChampion(targetCard.name)
      
      // Validation: Champions can only be in slots 2-3
      if (isSourceChampion && !championSlots.includes(targetIndex)) {
        return // Prevent moving champion to non-champion slot
      }
      if (isTargetChampion && !championSlots.includes(draggedFromIndex.index)) {
        return // Prevent moving non-champion to champion slot if target already has champion
      }
      
      // Swap cards
      newDeckCards[draggedFromIndex.index] = targetCard
      newDeckCards[targetIndex] = sourceCard
    } else {
      // Adding card from card grid to deck slot
      if (newDeckCards[targetIndex].name === draggedCard.name) return
      
      // Validation: Champions can only be added to slots 2-3
      if (isDraggedCardChampion && !championSlots.includes(targetIndex)) {
        return // Prevent adding champion to non-champion slot
      }
      
      // Validation: Check champion count
      const currentChampions = countChampions(newDeckCards)
      const targetSlotHasChampion = isChampion(newDeckCards[targetIndex].name)
      
      // If adding a champion and we're at max (2), only allow if replacing an existing champion
      if (isDraggedCardChampion) {
        if (currentChampions >= 2 && !targetSlotHasChampion) {
          return // Already have 2 champions and not replacing one
        }
      }
      
      newDeckCards[targetIndex] = { ...draggedCard }
    }
    
    setDeckCards(newDeckCards)
    setDraggedCard(null)
    setDraggedFromIndex(null)
  }

  const handleRemoveCard = (index) => {
    const newDeckCards = [...deckCards]
    newDeckCards[index] = { name: null, rarity: 'common' }
    setDeckCards(newDeckCards)
  }

  const handleSave = () => {
    const validCards = deckCards.filter(card => card.name !== null)
    if (validCards.length !== 8) {
      return
    }
    
    const updatedDeck = {
      ...deck,
      cards: validCards,
      cardNames: validCards.map(card => card.name)
    }
    
    // Update deck name if changed
    const finalDeckName = editedDeckName.trim() || 'My Favourite Deck'
    if (onNameChange) {
      onNameChange(finalDeckName)
    }
    
    onSave(updatedDeck, finalDeckName)
  }

  const validCardCount = deckCards.filter(card => card.name !== null).length
  const isDeckComplete = validCardCount === 8

  // Get available cards (filter out cards already in deck)
  const availableCards = allCards.filter(card => {
    return !deckCards.some(dc => dc.name === card.card_name)
  })

  // Filter available cards by search term
  const filteredAvailableCards = availableCards.filter(card => 
    card.card_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Sort the filtered available cards
  const sortedAvailableCards = [...filteredAvailableCards].sort((a, b) => {
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
    <div className="deck-editor">
      <div className="deck-editor-header">
        <h2 className="deck-editor-title">Edit Deck</h2>
        <div className="deck-editor-actions">
          <button className="deck-editor-button deck-editor-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button 
            className="deck-editor-button deck-editor-save" 
            onClick={handleSave}
            disabled={!isDeckComplete}
          >
            Save Deck {!isDeckComplete && `(${validCardCount}/8)`}
          </button>
        </div>
      </div>

      <div className="deck-editor-content">
        <div className="deck-editor-left">
          <div className="deck-editor-name-section">
            <div className="deck-editor-name-input-wrapper">
              <input
                type="text"
                className="deck-editor-name-input"
                value={editedDeckName}
                onChange={(e) => setEditedDeckName(e.target.value)}
                placeholder="My Favourite Deck"
              />
              <svg className="deck-editor-name-pencil-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          
          <div className="deck-editor-category-section">
            <div className="deck-editor-category-select-wrapper">
              <select
                className="deck-editor-category-select"
                value={selectedCategory || ''}
                onChange={(e) => onCategoryChange && onCategoryChange(e.target.value || null)}
              >
                <option value="">No Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <svg className="deck-editor-category-chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <button
              className="deck-editor-category-button deck-editor-category-create"
              onClick={() => onCreateCategory && onCreateCategory()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Create Category
            </button>
            <button
              className="deck-editor-category-button deck-editor-category-edit"
              onClick={() => onEditCategory && onEditCategory(selectedCategory)}
              disabled={!selectedCategory}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Edit Category
            </button>
            <button
              className="deck-editor-category-button deck-editor-category-delete"
              onClick={() => onDeleteCategory && onDeleteCategory(selectedCategory)}
              disabled={!selectedCategory}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Delete Category
            </button>
          </div>
          <div className="deck-slots-grid">
            {deckCards.map((card, index) => (
              <div
                key={index}
                className={`deck-slot ${card.name ? 'filled' : 'empty'}`}
                onDragOver={handleCardDragOver}
                onDrop={(e) => handleCardDrop(e, index)}
              >
                {card.name ? (
                  <>
                    <div
                      className="deck-slot-card"
                      draggable
                      onDragStart={(e) => handleCardDragStart(e, card, index, true)}
                    >
                      <DeckSlotCardImage card={card} index={index} />
                    </div>
                    <button
                      className="deck-slot-remove"
                      onClick={() => handleRemoveCard(index)}
                      title="Remove card"
                    >
                      ×
                    </button>
                    <div className="deck-slot-number">{index + 1}</div>
                  </>
                ) : (
                  <div className="deck-slot-empty-content">
                    <div className="deck-slot-number">{index + 1}</div>
                    <svg className="deck-slot-plus-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4v16m8-8H4" stroke="#ffd700" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="deck-editor-right">
          <h3 className="deck-editor-section-title">Available Cards</h3>
          <div className="deck-editor-controls">
            <div className="deck-editor-search">
              <input
                type="text"
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="deck-editor-search-input"
              />
            </div>
            <div className="deck-editor-sort">
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
          <div className="deck-editor-cards-grid">
            {sortedAvailableCards.map((card) => (
                <div
                  key={card.card_name}
                  className="editor-card-item"
                  draggable
                  onDragStart={(e) => {
                    handleCardDragStart(e, { name: card.card_name, rarity: 'common' }, -1, false)
                  }}
                >
                  <img
                    src={getCardImageUrl(card.card_name)}
                    alt={card.card_name}
                    className="editor-card-image"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      if (e.target.nextSibling) {
                        e.target.nextSibling.style.display = 'flex'
                      }
                    }}
                  />
                  <div className="editor-card-placeholder" style={{ display: 'none' }}>
                    {card.card_name}
                  </div>
                  <div className="editor-card-name">{card.card_name}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeckEditor

