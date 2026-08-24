import React, { useState, useEffect } from 'react'
import './DeckEditor.css'
import {
  getCardImageUrl,
  getCardEvolutionImageUrl,
  getCardHeroImageUrl,
  formatDeckCardLabel,
} from './cardUtils'

function DeckSlotCardImage({ card, index }) {
  // Slot 1: evo art; Slot 2: hero art; Slot 3: flags; Slots 4–8: normal
  const isEvolution = index === 0 || (index === 2 && Boolean(card.isEvolution))
  const isHero = index === 1 || (index === 2 && Boolean(card.isHero))

  const [variantFailed, setVariantFailed] = useState(false)

  const evolutionUrl = getCardEvolutionImageUrl(card.name)
  const heroUrl = getCardHeroImageUrl(card.name)
  const normalUrl = getCardImageUrl(card.name)

  // Reset variantFailed when card name or variant flags change
  useEffect(() => {
    setVariantFailed(false)
  }, [card.name, card.isEvolution, card.isHero, index])

  let imageUrl = normalUrl
  if (isEvolution && !variantFailed) {
    imageUrl = evolutionUrl
  } else if (isHero && !variantFailed) {
    imageUrl = heroUrl
  }

  const handleError = (e) => {
    if (!variantFailed) {
      setVariantFailed(true)
      e.target.src = normalUrl
    } else {
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
        key={`${card.name}-${index}-${card.isEvolution ? 'evo' : ''}-${card.isHero ? 'hero' : ''}`}
      />
      <div className="deck-slot-card-placeholder" style={{ display: 'none' }}>
        {card.name}
      </div>
    </>
  )
}

function DeckEditor({ deck, allCards, onSave, onCancel, deckName, onNameChange, categories = [], selectedCategory, onCategoryChange, onCreateCategory, onEditCategory, onDeleteCategory }) {
  const emptySlot = () => ({ name: null, rarity: 'common', isEvolution: false, isHero: false })

  const initializeDeckCards = () => {
    if (!deck.cards || deck.cards.length === 0) {
      return Array(8).fill(null).map(() => emptySlot())
    }
    const cards = deck.cards.map(card => ({
      name: card && card.name ? card.name : null,
      rarity: (card && card.rarity) ? card.rarity : 'common',
      isEvolution: Boolean(card && card.isEvolution),
      isHero: Boolean(card && card.isHero),
    }))
    while (cards.length < 8) {
      cards.push(emptySlot())
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
  const [isInitialMount, setIsInitialMount] = useState(true)
  const [mountKey, setMountKey] = useState(0)

  useEffect(() => {
    setIsInitialMount(true)
    setMountKey(prev => prev + 1)

    const timer = setTimeout(() => {
      setIsInitialMount(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const getCardMeta = (cardName) => {
    if (!cardName) return null
    return allCards.find(c => c.card_name === cardName) || null
  }

  const isChampion = (cardName) => {
    const card = getCardMeta(cardName)
    return card && parseFloat(card.rarity) === 5
  }

  const hasEvo = (cardName) => {
    const card = getCardMeta(cardName)
    return card && String(card.hasEvo).toLowerCase() === 'yes'
  }

  const hasHero = (cardName) => {
    const card = getCardMeta(cardName)
    return card && String(card.hasHero).toLowerCase() === 'yes'
  }

  const canToggleVariant = (cardName) => hasEvo(cardName) && hasHero(cardName)

  const countChampions = (cards) => {
    return cards.filter(card => card.name && isChampion(card.name)).length
  }

  // Champions share hero slots: slots 2 and 3 (0-indexed 1, 2)
  const championSlots = [1, 2]

  const assignSlotFlags = (card, slotIndex) => {
    if (!card || !card.name) {
      return emptySlot()
    }

    const champion = isChampion(card.name)
    let isEvolution = false
    let isHero = false

    if (slotIndex === 0) {
      isEvolution = true
      isHero = false
    } else if (slotIndex === 1) {
      isEvolution = false
      isHero = !champion
    } else if (slotIndex === 2) {
      if (champion) {
        isEvolution = false
        isHero = false
      } else if (hasEvo(card.name) && hasHero(card.name)) {
        // Prefer preserving an existing choice when moving within slot 3; default to evolution
        if (card.isHero && !card.isEvolution) {
          isEvolution = false
          isHero = true
        } else {
          isEvolution = true
          isHero = false
        }
      } else if (hasEvo(card.name)) {
        isEvolution = true
        isHero = false
      } else if (hasHero(card.name)) {
        isEvolution = false
        isHero = true
      }
    }

    return {
      name: card.name,
      rarity: card.rarity || 'common',
      isEvolution,
      isHero,
    }
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

    if (draggedFromIndex.isFromDeck) {
      if (draggedFromIndex.index === targetIndex) return

      const sourceCard = newDeckCards[draggedFromIndex.index]
      const targetCard = newDeckCards[targetIndex]
      const isSourceChampion = isChampion(sourceCard.name)
      const isTargetChampion = isChampion(targetCard.name)

      if (isSourceChampion && !championSlots.includes(targetIndex)) {
        return
      }
      if (isTargetChampion && !championSlots.includes(draggedFromIndex.index)) {
        return
      }

      newDeckCards[draggedFromIndex.index] = assignSlotFlags(targetCard, draggedFromIndex.index)
      newDeckCards[targetIndex] = assignSlotFlags(sourceCard, targetIndex)
    } else {
      if (newDeckCards[targetIndex].name === draggedCard.name) return

      if (isDraggedCardChampion && !championSlots.includes(targetIndex)) {
        return
      }

      const currentChampions = countChampions(newDeckCards)
      const targetSlotHasChampion = isChampion(newDeckCards[targetIndex].name)

      if (isDraggedCardChampion) {
        if (currentChampions >= 2 && !targetSlotHasChampion) {
          return
        }
      }

      newDeckCards[targetIndex] = assignSlotFlags(
        { name: draggedCard.name, rarity: draggedCard.rarity || 'common' },
        targetIndex
      )
    }

    setDeckCards(newDeckCards)
    setDraggedCard(null)
    setDraggedFromIndex(null)
  }

  const handleRemoveCard = (index) => {
    const newDeckCards = [...deckCards]
    newDeckCards[index] = emptySlot()
    setDeckCards(newDeckCards)
  }

  const handleSlotCardClick = (index) => {
    if (index !== 2) return
    const card = deckCards[index]
    if (!card?.name || !canToggleVariant(card.name)) return

    const newDeckCards = [...deckCards]
    newDeckCards[index] = {
      ...card,
      isEvolution: !card.isEvolution,
      isHero: !card.isHero,
    }
    // Ensure exactly one of the two is true after toggle
    if (newDeckCards[index].isEvolution === newDeckCards[index].isHero) {
      newDeckCards[index].isEvolution = true
      newDeckCards[index].isHero = false
    }
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
      // Labeled names for backend persistence (evolved-/hero- prefixes)
      cardNames: validCards.map(card => formatDeckCardLabel(card)),
    }

    const finalDeckName = editedDeckName.trim() || 'My Favourite Deck'
    if (onNameChange) {
      onNameChange(finalDeckName)
    }

    onSave(updatedDeck, finalDeckName)
  }

  const validCardCount = deckCards.filter(card => card.name !== null).length
  const isDeckComplete = validCardCount === 8

  const availableCards = allCards.filter(card => {
    return !deckCards.some(dc => dc.name === card.card_name)
  })

  const filteredAvailableCards = availableCards.filter(card =>
    card.card_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedAvailableCards = [...filteredAvailableCards].sort((a, b) => {
    let comparison = 0

    switch (sortMode) {
      case 'name':
        comparison = a.card_name.localeCompare(b.card_name)
        break
      case 'elixir':
        comparison = (parseFloat(a.elixer_cost) || 0) - (parseFloat(b.elixer_cost) || 0)
        break
      case 'rarity':
        comparison = (parseFloat(a.rarity) || 0) - (parseFloat(b.rarity) || 0)
        break
      case 'arena':
        comparison = (parseFloat(a.arena) || 0) - (parseFloat(b.arena) || 0)
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
          <div className={`deck-slots-grid ${isInitialMount ? 'initial-load' : ''}`} key={`slots-grid-${mountKey}`}>
            {deckCards.map((card, index) => {
              const toggleable = index === 2 && card.name && canToggleVariant(card.name)
              return (
                <div
                  key={`slot-${index}-${mountKey}`}
                  className={`deck-slot ${card.name ? 'filled' : 'empty'} ${isInitialMount ? 'animate-in' : ''}`}
                  onDragOver={handleCardDragOver}
                  onDrop={(e) => handleCardDrop(e, index)}
                >
                  {card.name ? (
                    <>
                      <div
                        className={`deck-slot-card ${toggleable ? 'deck-slot-card-toggleable' : ''}`}
                        draggable
                        onDragStart={(e) => handleCardDragStart(e, card, index, true)}
                        onClick={() => handleSlotCardClick(index)}
                        title={toggleable ? 'Click to toggle evolution / hero' : undefined}
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
              )
            })}
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
          <div className={`deck-editor-cards-grid ${isInitialMount ? 'initial-load' : ''}`} key={`cards-grid-${mountKey}`}>
            {sortedAvailableCards.map((card) => (
                <div
                  key={`${card.card_name}-${mountKey}`}
                  className={`editor-card-item ${isInitialMount ? 'animate-in' : ''}`}
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
