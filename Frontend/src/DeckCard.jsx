import React, { useState } from 'react'
import './DeckCard.css'
import ElixirIcon from './assets/Elixir.svg'
import CycleIcon from './assets/Cycle.svg'
import { getCardImageUrl, getCardEvolutionImageUrl, getCardHeroImageUrl } from './cardUtils'

function CardImage({ card, index, onVariantLoaded }) {
  // Determine which variant to try based on card position
  const isEvolution = index < 2 // First two cards (slots 1-2)
  const isHero = index >= 2 && index < 4 // Third and fourth cards (slots 3-4)
  
  const [variantFailed, setVariantFailed] = useState(false)
  
  const evolutionUrl = getCardEvolutionImageUrl(card.name)
  const heroUrl = getCardHeroImageUrl(card.name)
  const normalUrl = getCardImageUrl(card.name)
  
  // Determine initial image URL
  let imageUrl = normalUrl
  if (isEvolution && !variantFailed) {
    imageUrl = evolutionUrl
  } else if (isHero && !variantFailed) {
    imageUrl = heroUrl
  }
  
  const handleLoad = (e) => {
    // Check if the loaded image is the hero variant
    if (isHero && !variantFailed) {
      // If we're trying to load hero and haven't failed, it's the hero variant
      if (onVariantLoaded) {
        onVariantLoaded(true)
      }
    } else if (isEvolution && !variantFailed) {
      // Evolution variant loaded
      if (onVariantLoaded) {
        onVariantLoaded(true)
      }
    } else {
      // Normal image loaded
      if (onVariantLoaded) {
        onVariantLoaded(false)
      }
    }
  }
  
  const handleError = (e) => {
    if (!variantFailed) {
      // Variant image failed, try normal image
      setVariantFailed(true)
      if (onVariantLoaded) {
        onVariantLoaded(false)
      }
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
    <div className="card-image-container">
      <img 
        src={imageUrl}
        alt={card.name}
        className="card-image"
        onLoad={handleLoad}
        onError={handleError}
      />
      <div className="card-placeholder" style={{ display: 'none' }}>
        <span className="card-name">{card.name}</span>
      </div>
    </div>
  )
}

function DeckCard({ deck, isFavourite = false, onToggleFavourite, isInFavouritesView = false, onRemoveFavourite, favouriteIndex, deckName, onEditDeck, onAnalyze }) {
  const [heroVariantLoaded, setHeroVariantLoaded] = useState({})
  
  const handleFavouriteClick = () => {
    if (isInFavouritesView && onRemoveFavourite) {
      onRemoveFavourite(deck.id, favouriteIndex)
    } else if (onToggleFavourite) {
      onToggleFavourite(deck.id)
    }
  }
  
  const handleVariantLoaded = (index, loaded) => {
    setHeroVariantLoaded(prev => ({
      ...prev,
      [index]: loaded
    }))
  }

  return (
    <div className="deck-card">
      {/* Deck name (only in favourites view, not editable) */}
      {isInFavouritesView && (
        <div className="deck-name-container">
          <div className="deck-name-display">
            {deckName || 'My Favourite Deck'}
          </div>
        </div>
      )}

      {/* Top indicators */}
      <div className="deck-stats">
        <div className="stat-item">
          <img src={ElixirIcon} alt="Elixir" className="elixir-icon" />
          <span>{deck.elixirCost}</span>
        </div>
        <div className="stat-item">
          <img src={CycleIcon} alt="Cycle" className="cycle-icon" />
          <span>{deck.cycle}</span>
        </div>
      </div>

      {/* Cards grid */}
      <div className="cards-grid">
        {deck.cards.map((card, index) => {
          const isEvolution = index < 2 && card.name !== null
          const isHero = index >= 2 && index < 4 && card.name !== null
          const heroLoaded = heroVariantLoaded[index] === true
          return (
            <div key={index} className={`card-item ${card.rarity} ${isEvolution ? 'evolution-card' : ''} ${isHero && heroLoaded ? 'hero-card' : ''}`}>
              <CardImage 
                card={card} 
                index={index} 
                onVariantLoaded={(loaded) => handleVariantLoaded(index, loaded)}
              />
          </div>
          )
        })}
      </div>

      {/* Action buttons */}
      <div className="deck-actions">
        <button 
          className="action-btn favorite-btn"
          onClick={handleFavouriteClick}
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
            <path d="M8 1 L10 5 L14 6 L11 9 L11.5 13 L8 11 L4.5 13 L5 9 L2 6 L6 5 Z" fill="currentColor"/>
          </svg>
          {isInFavouritesView ? 'Remove from Favourites' : 'Add to Favourites'}
        </button>
        {isInFavouritesView && onEditDeck && (
          <button 
            className="action-btn edit-btn"
            onClick={() => onEditDeck(deck, favouriteIndex)}
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M11.5 1 L15 4.5 L5.5 14 L2 14 L2 10.5 L11.5 1 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.5 3 L13 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Edit Deck
          </button>
        )}
        <button 
          className="action-btn analyze-btn" 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (onAnalyze) {
              onAnalyze(deck)
            }
          }}
        >
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M8 2 L8 8 L12 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Analyze (beta)
        </button>
      </div>
    </div>
  )
}

export default DeckCard

