import React, { useState } from 'react'
import './DeckCard.css'
import ElixirIcon from './assets/Elixir.svg'
import CycleIcon from './assets/Cycle.svg'
import { getCardImageUrl, getCardEvolutionImageUrl, getCardHeroImageUrl } from './cardUtils'

function CardImage({ card, onVariantLoaded }) {
  const isEvolution = Boolean(card?.isEvolution)
  const isHero = Boolean(card?.isHero)
  const [variantFailed, setVariantFailed] = useState(false)

  const evolutionUrl = getCardEvolutionImageUrl(card.name)
  const heroUrl = getCardHeroImageUrl(card.name)
  const normalUrl = getCardImageUrl(card.name)

  let imageUrl = normalUrl
  if (isEvolution && !variantFailed) {
    imageUrl = evolutionUrl
  } else if (isHero && !variantFailed) {
    imageUrl = heroUrl
  }

  const handleLoad = () => {
    if ((isEvolution || isHero) && !variantFailed) {
      onVariantLoaded?.(true)
    } else {
      onVariantLoaded?.(false)
    }
  }

  const handleError = (e) => {
    if (!variantFailed && (isEvolution || isHero)) {
      setVariantFailed(true)
      onVariantLoaded?.(false)
      e.target.src = normalUrl
    } else {
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

function formatPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n.toFixed(1)}%`
}

function formatBattles(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n >= 10000) {
    return `${Math.round(n / 100) / 10}k`
  }
  return Math.round(n).toLocaleString()
}

function DeckCard({ deck, isFavourite = false, onToggleFavourite, isInFavouritesView = false, onRemoveFavourite, favouriteIndex, deckName, onEditDeck, onAnalyze, hideButtons = false }) {
  const [heroVariantLoaded, setHeroVariantLoaded] = useState({})
  const hasPerformanceStats = Number(deck?.numBattles) > 0 || Number(deck?.usage) > 0 || Number(deck?.winRate) > 0

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
          <span>{typeof deck.elixirCost === 'number' ? deck.elixirCost.toFixed(1) : parseFloat(deck.elixirCost || 0).toFixed(1)}</span>
        </div>
        <div className="stat-item">
          <img src={CycleIcon} alt="Cycle" className="cycle-icon" />
          <span>{deck.cycle}</span>
        </div>
      </div>

      {hasPerformanceStats && (
        <div className="deck-meta-stats">
          <div className="meta-stat" title={`Win rate: ${formatPercent(deck.winRate)}`}>
            <span className="meta-stat-value">{formatPercent(deck.winRate)}</span>
            <span className="meta-stat-label">Win Rate</span>
          </div>
          <div className="meta-stat" title={`Total battles: ${Number(deck.numBattles || 0).toLocaleString()}`}>
            <span className="meta-stat-value">{formatBattles(deck.numBattles)}</span>
            <span className="meta-stat-label">Battles</span>
          </div>
          <div className="meta-stat" title={`Usage: ${formatPercent(deck.usage)}`}>
            <span className="meta-stat-value">{formatPercent(deck.usage)}</span>
            <span className="meta-stat-label">Usage</span>
          </div>
        </div>
      )}

      {/* Cards grid */}
      <div className="cards-grid">
        {deck.cards.map((card, index) => {
          const isEvolution = Boolean(card?.isEvolution) && card.name !== null
          const isHero = Boolean(card?.isHero) && card.name !== null
          const heroLoaded = heroVariantLoaded[index] === true
          return (
            <div key={index} className={`card-item ${card.rarity} ${isEvolution ? 'evolution-card' : ''} ${isHero && heroLoaded ? 'hero-card' : ''}`}>
              <CardImage
                card={card}
                onVariantLoaded={(loaded) => handleVariantLoaded(index, loaded)}
              />
          </div>
          )
        })}
      </div>

      {/* Action buttons */}
      {!hideButtons && (
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
            Analyze
          </button>
        </div>
      )}
    </div>
  )
}

export default DeckCard
