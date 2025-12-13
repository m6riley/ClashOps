import React, { useState, useEffect } from 'react'
import './App.css'
import Swords from './Swords'
import DeckCard from './DeckCard'
import FeatureBanner from './FeatureBanner'
import Notification from './Notification'
import ConfirmDialog from './ConfirmDialog'
import FilterCardsView from './FilterCardsView'
import DeckEditor from './DeckEditor'
import CategoryDialog from './CategoryDialog'
import CategoryBanner from './CategoryBanner'
import Particles from './Particles'
import AccountView from './AccountView'
import LoginPrompt from './LoginPrompt'
import SubscriptionPrompt from './SubscriptionPrompt'
import PaymentForm from './PaymentForm'
import AnalyzeLoading from './AnalyzeLoading'
import AnalysisView from './AnalysisView'
import InitialLoading from './InitialLoading'

function App() {
  const [decks, setDecks] = useState([])
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedFeature, setExpandedFeature] = useState(null) // Track which feature is expanded
  const [activeTab, setActiveTab] = useState('catalog') // Track active tab: 'catalog', 'favourites', or 'account'
  const [favouriteDecks, setFavouriteDecks] = useState([]) // Track favourite deck IDs
  const [favouriteDeckNames, setFavouriteDeckNames] = useState({}) // Track favourite deck names: { 'deckId-index': 'name' }
  const [notification, setNotification] = useState(null) // Track notification state
  const [confirmRemove, setConfirmRemove] = useState(null) // Track confirmation state: { deckId, index }
  const [cards, setCards] = useState([]) // All cards data
  const [selectedFilterCards, setSelectedFilterCards] = useState([]) // Selected cards for filtering (must include)
  const [excludedFilterCards, setExcludedFilterCards] = useState([]) // Excluded cards for filtering (must not include)
  const [showFilterView, setShowFilterView] = useState(false) // Show filter cards view
  const [editingDeck, setEditingDeck] = useState(null) // Track which deck is being edited: { deck, index, isNew }
  const [categories, setCategories] = useState([]) // User-created categories: [{ id, name, color, icon }]
  const [deckCategories, setDeckCategories] = useState({}) // Map deck IDs to category IDs: { deckId: categoryId }
  const [categoryDialog, setCategoryDialog] = useState(null) // Track category dialog: { mode: 'create' | 'edit', category: category | null }
  const [expandedCategory, setExpandedCategory] = useState(null) // Track which category is expanded (similar to expandedFeature)
  const [isLoggedIn, setIsLoggedIn] = useState(false) // Track if user is logged in
  const [showLoginPrompt, setShowLoginPrompt] = useState(false) // Show login prompt dialog
  const [showSubscriptionPrompt, setShowSubscriptionPrompt] = useState(false) // Show subscription prompt dialog
  const [showPaymentForm, setShowPaymentForm] = useState(false) // Show payment form dialog
  const [showAnalyzeLoading, setShowAnalyzeLoading] = useState(false) // Show analyze loading screen
  const [showAnalysisView, setShowAnalysisView] = useState(false) // Show analysis view
  const [analyzingDeck, setAnalyzingDeck] = useState(null) // Deck being analyzed
  const [analysisResults, setAnalysisResults] = useState(null) // Analysis results from API
  const [isSubscribed, setIsSubscribed] = useState(true) // Track subscription status (auto-subscribed for dev)

  // Handle analyze deck click
  const handleAnalyzeDeck = (deck) => {
    console.log('handleAnalyzeDeck called', { isLoggedIn, isSubscribed, deck })
    if (!isLoggedIn || !isSubscribed) {
      setShowSubscriptionPrompt(true)
    } else {
      // Store the deck and show loading screen
      setAnalyzingDeck(deck)
      setShowAnalyzeLoading(true)
    }
  }

  // Handle analysis loading complete
  const handleAnalysisComplete = (results) => {
    setAnalysisResults(results)
    setShowAnalyzeLoading(false)
    setShowAnalysisView(true)
  }

  // Handle subscription
  const handleSubscribe = () => {
    if (!isLoggedIn) {
      setShowSubscriptionPrompt(false)
      setShowLoginPrompt(true)
      return
    }
    // Show payment form
    setShowSubscriptionPrompt(false)
    setShowPaymentForm(true)
  }

  // Handle payment form completion
  const handlePaymentComplete = () => {
    setIsSubscribed(true)
    setShowPaymentForm(false)
    setNotification({
      message: 'Welcome to ClashOps Diamond!',
      type: 'success'
    })
  }

  // Cards, features, and decks are now loaded from Azure Functions during initial loading
  
  // Helper function to check if deck matches filter (contains all selected, excludes all excluded)
  const deckMatchesFilter = (deck) => {
    // Check if deck contains all selected cards
    if (selectedFilterCards.length > 0) {
      const hasAllSelected = selectedFilterCards.every(filterCard => 
        deck.cardNames.some(cardName => 
          cardName.toLowerCase() === filterCard.toLowerCase()
        )
      )
      if (!hasAllSelected) return false
    }
    
    // Check if deck excludes all excluded cards
    if (excludedFilterCards.length > 0) {
      const hasExcluded = excludedFilterCards.some(filterCard => 
        deck.cardNames.some(cardName => 
          cardName.toLowerCase() === filterCard.toLowerCase()
        )
      )
      if (hasExcluded) return false
    }
    
    return true
  }

  // Helper function to filter decks by featured card
  const getDecksForFeature = (featureCardName, limit = null) => {
    let filtered = decks.filter(deck => 
      deck.cardNames.some(cardName => 
        cardName.toLowerCase() === featureCardName.toLowerCase()
      )
    )
    // Apply card filter if any cards are selected
    if (selectedFilterCards.length > 0) {
      filtered = filtered.filter(deckMatchesFilter)
    }
    return limit ? filtered.slice(0, limit) : filtered
  }

  // Get filtered decks (applies card filter)
  const getFilteredDecks = () => {
    if (selectedFilterCards.length === 0 && excludedFilterCards.length === 0) return decks
    return decks.filter(deckMatchesFilter)
  }

  // Add deck to favourites (allows duplicates)
  const addToFavourites = (deckId) => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true)
      return
    }
    setFavouriteDecks(prev => {
      const newIndex = prev.length
      // Set default name for the new favourite deck
      setFavouriteDeckNames(names => ({
        ...names,
        [`${deckId}-${newIndex}`]: 'My Favourite Deck'
      }))
      return [...prev, deckId]
    })
    setNotification({
      message: `Deck added to favourites`,
      type: 'success'
    })
  }

  // Show confirmation dialog for removing deck from favourites
  const requestRemoveFromFavourites = (deckId, index) => {
    setConfirmRemove({ deckId, index })
  }

  // Actually remove deck from favourites (after confirmation)
  const confirmRemoveFromFavourites = () => {
    if (confirmRemove) {
      const { deckId, index } = confirmRemove
      setFavouriteDecks(prev => {
        const newFavourites = [...prev]
        newFavourites.splice(index, 1)
        return newFavourites
      })
      // Remove the name for this deck
      setFavouriteDeckNames(prev => {
        const newNames = { ...prev }
        delete newNames[`${deckId}-${index}`]
        // Reindex remaining names
        const reindexed = {}
        Object.keys(newNames).forEach(key => {
          const [id, oldIdx] = key.split('-')
          const numOldIdx = parseInt(oldIdx)
          if (numOldIdx > index) {
            reindexed[`${id}-${numOldIdx - 1}`] = newNames[key]
          } else if (numOldIdx < index) {
            reindexed[key] = newNames[key]
          }
        })
        return reindexed
      })
      setNotification({
        message: `Deck removed from favourites`,
        type: 'info'
      })
      setConfirmRemove(null)
    }
  }

  // Cancel removal
  const cancelRemoveFromFavourites = () => {
    setConfirmRemove(null)
  }

  // Update favourite deck name
  const updateFavouriteDeckName = (deckId, index, newName) => {
    setFavouriteDeckNames(prev => ({
      ...prev,
      [`${deckId}-${index}`]: newName || 'My Favourite Deck'
    }))
  }

  // Toggle card in filter selection (cycles: unselected -> selected -> excluded -> unselected)
  const toggleFilterCard = (cardName) => {
    const isSelected = selectedFilterCards.includes(cardName)
    const isExcluded = excludedFilterCards.includes(cardName)
    
    if (isSelected) {
      // Move from selected to excluded
      setSelectedFilterCards(prev => prev.filter(name => name !== cardName))
      setExcludedFilterCards(prev => [...prev, cardName])
    } else if (isExcluded) {
      // Move from excluded to unselected
      setExcludedFilterCards(prev => prev.filter(name => name !== cardName))
    } else {
      // Move from unselected to selected
      setSelectedFilterCards(prev => [...prev, cardName])
    }
  }

  // Confirm filter and close filter view
  const confirmFilter = () => {
    setShowFilterView(false)
  }

  // Cancel filter view
  const cancelFilter = () => {
    setShowFilterView(false)
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedFilterCards([])
    setExcludedFilterCards([])
  }

  // Calculate average elixir cost (helper function for deck editing)
  const calculateAverageElixirCostForDeck = (cardNames) => {
    const cardElixirMap = {}
    cards.forEach(card => {
      const cardName = card.card_name?.trim()
      const elixirCost = parseFloat(card.elixer_cost) || 0
      if (cardName) {
        cardElixirMap[cardName] = elixirCost
      }
    })
    
    const costs = cardNames
      .map(name => cardElixirMap[name] || 0)
      .filter(cost => cost > 0)
    
    if (costs.length === 0) return 0
    const sum = costs.reduce((acc, cost) => acc + cost, 0)
    return Math.round((sum / costs.length) * 10) / 10
  }

  // Calculate four-card cycle (helper function for deck editing)
  const calculateFourCardCycleForDeck = (cardNames) => {
    const cardElixirMap = {}
    cards.forEach(card => {
      const cardName = card.card_name?.trim()
      const elixirCost = parseFloat(card.elixer_cost) || 0
      if (cardName) {
        cardElixirMap[cardName] = elixirCost
      }
    })
    
    const costs = cardNames
      .map(name => cardElixirMap[name] || 0)
      .filter(cost => cost > 0)
      .sort((a, b) => a - b)
      .slice(0, 4)
    
    if (costs.length === 0) return 0
    const sum = costs.reduce((acc, cost) => acc + cost, 0)
    return Math.round(sum * 10) / 10
  }

  // Handle edit deck
  const handleEditDeck = (deck, index) => {
    setEditingDeck({ deck, index })
  }

  // Handle save edited deck
  const handleSaveEditedDeck = (updatedDeck, savedDeckName) => {
    if (editingDeck) {
      const cardNames = updatedDeck.cardNames
      const elixirCost = calculateAverageElixirCostForDeck(cardNames)
      const cycle = calculateFourCardCycleForDeck(cardNames)
      const deckName = savedDeckName || editingDeck.deckName || 'My Favourite Deck'
      const categoryId = editingDeck.categoryId || (editingDeck.isNew ? null : deckCategories[editingDeck.deck.id] || null)
      
      if (editingDeck.isNew) {
        // Creating a new deck
        const newDeckId = Date.now() // Use timestamp as unique ID
        const newDeck = {
          id: newDeckId,
          cards: updatedDeck.cards,
          cardNames: cardNames,
          elixirCost: elixirCost,
          cycle: cycle,
          score: 0 // New decks start with 0 score
        }
        
        // Add to decks array
        setDecks(prevDecks => [...prevDecks, newDeck])
        
        // Add to favourites
        const newIndex = favouriteDecks.length
        setFavouriteDecks(prev => [...prev, newDeckId])
        
        // Set deck name
        setFavouriteDeckNames(prev => ({
          ...prev,
          [`${newDeckId}-${newIndex}`]: deckName
        }))
        
        // Set category if selected
        if (categoryId) {
          setDeckCategories(prev => ({
            ...prev,
            [newDeckId]: categoryId
          }))
        }
        
        setNotification({
          message: `Deck created successfully`,
          type: 'success'
        })
      } else {
        // Updating existing deck
        const deckId = editingDeck.deck.id
        
        // Update the deck data in the main decks array
        setDecks(prevDecks => {
          const deckIndex = prevDecks.findIndex(d => d.id === deckId)
          if (deckIndex !== -1) {
            const newDecks = [...prevDecks]
            newDecks[deckIndex] = {
              ...newDecks[deckIndex],
              cards: updatedDeck.cards,
              cardNames: cardNames,
              elixirCost: elixirCost,
              cycle: cycle
            }
            return newDecks
          }
          return prevDecks
        })
        
        // Update category if changed
        if (categoryId) {
          setDeckCategories(prev => ({
            ...prev,
            [deckId]: categoryId
          }))
        } else {
          setDeckCategories(prev => {
            const newCategories = { ...prev }
            delete newCategories[deckId]
            return newCategories
          })
        }
        
        setNotification({
          message: `Deck updated successfully`,
          type: 'success'
        })
      }
    }
    setEditingDeck(null)
  }

  // Cancel editing deck
  const handleCancelEditDeck = () => {
    setEditingDeck(null)
  }

  // Handle save category (create or edit)
  const handleSaveCategory = (categoryData) => {
    if (!categoryDialog) return
    
    if (categoryDialog.mode === 'create') {
      // Create new category
      const newCategory = {
        id: Date.now(), // Use timestamp as unique ID
        name: categoryData.name,
        color: categoryData.color,
        icon: categoryData.icon
      }
      setCategories(prev => [...prev, newCategory])
      setNotification({
        message: 'Category created successfully',
        type: 'success'
      })
    } else if (categoryDialog.mode === 'edit' && categoryDialog.category) {
      // Update existing category
      setCategories(prev => prev.map(cat => 
        cat.id === categoryDialog.category.id
          ? { ...cat, ...categoryData }
          : cat
      ))
      setNotification({
        message: 'Category updated successfully',
        type: 'success'
      })
    }
    setCategoryDialog(null)
  }

  // Handle cancel category dialog
  const handleCancelCategoryDialog = () => {
    setCategoryDialog(null)
  }

  // Handle create new deck
  const handleCreateNewDeck = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true)
      return
    }
    const emptyDeck = {
      id: -1, // Temporary ID, will be replaced on save
      cards: Array(8).fill(null).map(() => ({ name: null, rarity: 'common' })),
      cardNames: [],
      elixirCost: 0,
      cycle: 0,
      score: 0
    }
    setEditingDeck({ 
      deck: emptyDeck, 
      index: -1, 
      isNew: true,
      deckName: 'My Favourite Deck',
      categoryId: null
    })
  }
  
  // Group features into pairs for two-per-row display
  const groupedFeatures = []
  for (let i = 0; i < features.length; i += 2) {
    groupedFeatures.push(features.slice(i, i + 2))
  }
  const handleInitialLoadingComplete = async () => {
    // Load features, decks, and cards from Azure Functions
    try {
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      // Load features, decks, and cards in parallel
      const [featuresResponse, decksResponse, cardsResponse] = await Promise.all([
        fetch('https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/get_features?code=DS5LZbckSVcYRHSC2lg1kspMj_9YIUOKwqKI2x2HaP7AAzFu758ciw==', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
          signal: controller.signal
        }),
        fetch('https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/get_decks?code=983cRvpPitpcxlgRcBzjsjLi0dPukNbj7KGxfbUbi-pHAzFuo-FZGw==', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
          signal: controller.signal
        }),
        fetch('https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api/get_cards?code=f2W9t18O5vc0q_U0c_DnSnyyKMZ4xfYMlVen22JUMrw5AzFuHFJHNQ==', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
          signal: controller.signal
        })
      ])
      
      clearTimeout(timeoutId)
      
      // Handle features response
      if (!featuresResponse.ok) {
        const errorText = await featuresResponse.text()
        throw new Error(`Failed to load features: ${featuresResponse.status} ${featuresResponse.statusText}. ${errorText}`)
      }
      
      const featuresData = await featuresResponse.json()
      if (Array.isArray(featuresData)) {
        setFeatures(featuresData)
      } else {
        console.warn('Features data is not an array:', featuresData)
        setFeatures([])
      }
      
      // Handle cards response
      if (!cardsResponse.ok) {
        const errorText = await cardsResponse.text()
        throw new Error(`Failed to load cards: ${cardsResponse.status} ${cardsResponse.statusText}. ${errorText}`)
      }
      
      const cardsData = await cardsResponse.json()
      if (Array.isArray(cardsData)) {
        setCards(cardsData) // Store all cards data for filter view
      } else {
        console.warn('Cards data is not an array:', cardsData)
        setCards([])
      }
      
      // Build card elixir map from cards data
      const cardElixirMap = {}
      if (cardsData && cardsData.length > 0) {
        cardsData.forEach(card => {
          const cardName = card.card_name?.trim()
          const elixirCost = parseFloat(card.elixer_cost) || 0
          if (cardName) {
            cardElixirMap[cardName] = elixirCost
          }
        })
      }
      
      // Handle decks response
      if (!decksResponse.ok) {
        const errorText = await decksResponse.text()
        throw new Error(`Failed to load decks: ${decksResponse.status} ${decksResponse.statusText}. ${errorText}`)
      }
      
      const decksData = await decksResponse.json()
      if (Array.isArray(decksData)) {
        
        // Function to calculate average elixir cost of a deck
        const calculateAverageElixirCost = (cardNames) => {
          if (Object.keys(cardElixirMap).length === 0) return 0
          const costs = cardNames
            .map(name => cardElixirMap[name] || 0)
            .filter(cost => cost > 0)
          
          if (costs.length === 0) return 0
          const sum = costs.reduce((acc, cost) => acc + cost, 0)
          return Math.round((sum / costs.length) * 10) / 10
        }
        
        // Function to calculate four-card cycle (sum of 4 cheapest cards)
        const calculateFourCardCycle = (cardNames) => {
          if (Object.keys(cardElixirMap).length === 0) return 0
          const costs = cardNames
            .map(name => cardElixirMap[name] || 0)
            .filter(cost => cost > 0)
            .sort((a, b) => a - b) // Sort ascending
            .slice(0, 4) // Take 4 cheapest
          
          if (costs.length === 0) return 0
          const sum = costs.reduce((acc, cost) => acc + cost, 0)
          return Math.round(sum * 10) / 10
        }
        
        // Transform the decks data
        const transformedDecks = decksData.map((deck) => {
          const cardsString = deck.cards || ''
          const cardNames = cardsString.split(';').map(name => name.trim()).filter(name => name)
          
          const deckCards = cardNames.map(cardName => ({
            name: cardName,
            rarity: 'common'
          }))
          
          while (deckCards.length < 8) {
            deckCards.push({ name: null, rarity: 'common' })
          }
          
          return {
            id: parseInt(deck.deck_id || deck.id || 0),
            elixirCost: calculateAverageElixirCost(cardNames),
            cycle: calculateFourCardCycle(cardNames),
            score: parseFloat(deck.score || 0),
            cards: deckCards.slice(0, 8),
            cardNames: cardNames // Keep for filtering
          }
        })
        
        // Sort decks by score (descending)
        transformedDecks.sort((a, b) => b.score - a.score)
        
        setDecks(transformedDecks)
      } else {
        console.warn('Decks data is not an array:', decksData)
        setDecks([])
      }
    } catch (err) {
      console.error('Error loading data:', err)
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.')
      } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('Network error: Unable to connect to server. Please check if CORS is enabled on the Azure Function.')
      } else {
        setError(err.message || 'Failed to load data')
      }
      // Set empty arrays as fallback
      setFeatures([])
      setDecks([])
      setCards([])
    } finally {
      setInitialLoading(false)
      setLoading(false)
    }
  }

  return (
    <div className="App">
      {initialLoading && (
        <InitialLoading onComplete={handleInitialLoadingComplete} />
      )}
      {!initialLoading && (
        <>
      {/* Particle Effects */}
      <Particles />
      
      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Confirmation Dialog */}
      {confirmRemove && (
        <ConfirmDialog
          message="Are you sure you want to remove this deck from your favourites?"
          onConfirm={confirmRemoveFromFavourites}
          onCancel={cancelRemoveFromFavourites}
        />
      )}

      {/* Category Dialog */}
      {categoryDialog && (
        <CategoryDialog
          category={categoryDialog.category}
          onSave={handleSaveCategory}
          onCancel={handleCancelCategoryDialog}
        />
      )}

      {/* Login Prompt Dialog */}
      {showLoginPrompt && (
        <LoginPrompt
          onClose={() => setShowLoginPrompt(false)}
          onGoToAccount={() => {
            setShowLoginPrompt(false)
            setActiveTab('account')
          }}
        />
      )}

      {/* Subscription Prompt Dialog */}
      {showSubscriptionPrompt && (
        <SubscriptionPrompt
          onClose={() => setShowSubscriptionPrompt(false)}
          onSubscribe={handleSubscribe}
        />
      )}

      {/* Payment Form Dialog */}
      {showPaymentForm && (
        <PaymentForm
          onClose={() => setShowPaymentForm(false)}
          onComplete={handlePaymentComplete}
        />
      )}

      {/* Analyze Loading Dialog */}
      {showAnalyzeLoading && analyzingDeck && (
        <AnalyzeLoading
          deck={analyzingDeck}
          onClose={() => {
            setShowAnalyzeLoading(false)
            setAnalyzingDeck(null)
          }}
          onComplete={handleAnalysisComplete}
        />
      )}

      {/* Background decorative element */}
      <div className="background-swords">
        <Swords size={400} />
      </div>
      
      {/* Header */}
      <header className="header">
        <div className="logo">
          <Swords size={32} />
          <span className="logo-text">Clash<span className="logo-accent">Ops</span></span>
        </div>
        <nav className="nav">
          <a 
            href="#" 
            className={`nav-link ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              setActiveTab('catalog')
              setExpandedFeature(null)
            }}
          >
            Deck Catalog
          </a>
          <a 
            href="#" 
            className={`nav-link ${activeTab === 'favourites' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              setActiveTab('favourites')
              setExpandedFeature(null)
            }}
          >
            Favourite Decks
          </a>
          <a 
            href="#" 
            className={`nav-link ${activeTab === 'account' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              setActiveTab('account')
              setExpandedFeature(null)
            }}
          >
            Account
          </a>
          <a href="#" className="nav-link">About</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Analysis View - separate view that replaces all tab content */}
        {showAnalysisView && analyzingDeck ? (
          <AnalysisView
            deck={analyzingDeck}
            allCards={cards}
            analysisResults={analysisResults}
            onClose={() => {
              setShowAnalysisView(false)
              setAnalyzingDeck(null)
              setAnalysisResults(null)
            }}
          />
        ) : (
          <>
        {activeTab === 'catalog' && (
          <>
            {showFilterView ? (
              <FilterCardsView
                cards={cards}
                selectedCards={selectedFilterCards}
                excludedCards={excludedFilterCards}
                onCardToggle={toggleFilterCard}
                onConfirm={confirmFilter}
                onCancel={cancelFilter}
                onClearFilters={clearFilters}
                filteredDeckCount={getFilteredDecks().length}
              />
            ) : (
              <>
                <div className="page-title-container">
                  <div className="title-section">
                    <h1 className="page-title">Deck Catalog</h1>
                    <p className="page-description">Browse the most powerful decks in the current meta.</p>
                  </div>
                  <div className="page-title-actions">
                    <button 
                      className="filter-button"
                      onClick={() => setShowFilterView(true)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" fill="currentColor"/>
                      </svg>
                      Filter Cards
                      {(selectedFilterCards.length > 0 || excludedFilterCards.length > 0) && (
                        <span className="filter-badge">{selectedFilterCards.length + excludedFilterCards.length}</span>
                      )}
                    </button>
                    {!loading && !error && (() => {
                      const currentDeckCount = expandedFeature
                        ? (expandedFeature.filter_options 
                            ? getDecksForFeature(expandedFeature.filter_options).length
                            : getFilteredDecks().length)
                        : getFilteredDecks().length
                      return (
                        <div className="deck-count">
                          <span className="deck-count-number">{currentDeckCount}</span>
                          <span className="deck-count-text">unique decks</span>
                        </div>
                      )
                    })()}
                  </div>
                </div>
                {loading && <div className="loading-message">Loading decks...</div>}
                {error && <div className="error-message">Error: {error}</div>}
                {!loading && !error && (
              <>
                {/* Expanded feature view */}
                {expandedFeature && (() => {
                  const allDecks = expandedFeature.filter_options 
                    ? getDecksForFeature(expandedFeature.filter_options)
                    : getFilteredDecks()
                  return (
                    <div className="feature-section feature-section-expanded">
                      <FeatureBanner 
                        feature={expandedFeature}
                        decks={allDecks}
                        isExpanded={true}
                        onSeeAll={() => setExpandedFeature(null)}
                        onBack={() => setExpandedFeature(null)}
                      />
                      <div className="decks-grid">
                        {allDecks.length > 0 ? (
                          allDecks.map(deck => (
                            <DeckCard 
                              key={deck.id} 
                              deck={deck} 
                              isFavourite={favouriteDecks.includes(deck.id)}
                              onToggleFavourite={addToFavourites}
                              onAnalyze={handleAnalyzeDeck}
                            />
                          ))
                        ) : (
                          <div className="no-decks-message">No decks available</div>
                        )}
                      </div>
                    </div>
                  )
                })()}
                
                {/* Normal view - only show if no feature is expanded */}
                {!expandedFeature && (
                  <>
                    {/* Feature sections - two per row */}
                    {groupedFeatures.map((featurePair, pairIndex) => {
                      const isLastPair = pairIndex === groupedFeatures.length - 1
                      const isSingleFeature = featurePair.length === 1
                      const shouldSpanFullWidth = isLastPair && isSingleFeature
                      
                      return (
                        <div key={pairIndex} className={`features-row ${shouldSpanFullWidth ? 'features-row-single' : ''}`}>
                          {featurePair.map((feature, index) => {
                            const maxDecks = shouldSpanFullWidth ? 4 : 2
                            const featureDecks = getDecksForFeature(feature.filter_options, maxDecks)
                            return (
                              <div key={index} className={`feature-section ${shouldSpanFullWidth ? 'feature-section-single' : ''}`}>
                                <FeatureBanner 
                                  feature={feature} 
                                  decks={featureDecks}
                                  isExpanded={false}
                                  onSeeAll={() => setExpandedFeature(feature)}
                                  onBack={() => {}}
                                  hideSeeAll={featureDecks.length <= maxDecks}
                                />
                                {featureDecks.length > 0 && (
                                  <div className={`feature-decks-grid ${shouldSpanFullWidth ? 'feature-decks-grid-single' : ''}`}>
                                    {featureDecks.map(deck => (
                                      <DeckCard 
                                        key={deck.id} 
                                        deck={deck} 
                                        isFavourite={favouriteDecks.includes(deck.id)}
                                        onToggleFavourite={addToFavourites}
                                        onAnalyze={handleAnalyzeDeck}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                    
                    {/* Top Decks section */}
                    <div className="feature-section">
                      <FeatureBanner 
                        feature={{
                          featured_text: 'Top Decks',
                          featured_type: 'All',
                          featured_image: 'https://cdn-assets-eu.frontify.com/s3/frontify-enterprise-files-eu/eyJwYXRoIjoic3VwZXJjZWxsXC9maWxlXC9qTGJKMjY1b2dGRWRYQ0w0WTRCUi5wbmcifQ:supercell:6cXygIXb6fZTZPpSR2s15sX5vWYI9ytE1LMHyWHsr-Y?width=2400',
                          filter_options: ''
                        }}
                        decks={[]}
                        isExpanded={false}
                        onSeeAll={() => {}}
                        onBack={() => {}}
                        hideSeeAll={true}
                      />
                      <div className="decks-grid">
                        {getFilteredDecks().length > 0 ? (
                          getFilteredDecks().map(deck => (
                            <DeckCard 
                              key={deck.id} 
                              deck={deck} 
                              isFavourite={favouriteDecks.includes(deck.id)}
                              onToggleFavourite={addToFavourites}
                              onAnalyze={handleAnalyzeDeck}
                            />
                          ))
                        ) : (
                          <div className="no-decks-message">No decks available</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
              </>
            )}
          </>
        )}

        {activeTab === 'favourites' && (
          <>
            {editingDeck ? (
              <DeckEditor
                deck={editingDeck.deck}
                allCards={cards}
                onSave={handleSaveEditedDeck}
                onCancel={handleCancelEditDeck}
                deckName={editingDeck.isNew ? (editingDeck.deckName || 'My Favourite Deck') : (favouriteDeckNames[`${editingDeck.deck.id}-${editingDeck.index}`] || 'My Favourite Deck')}
                onNameChange={(newName) => {
                  if (editingDeck.isNew) {
                    setEditingDeck(prev => ({ ...prev, deckName: newName }))
                  } else {
                    updateFavouriteDeckName(editingDeck.deck.id, editingDeck.index, newName)
                  }
                }}
                categories={categories}
                selectedCategory={editingDeck.isNew ? (editingDeck.categoryId || null) : (deckCategories[editingDeck.deck.id] || null)}
                onCategoryChange={(categoryId) => {
                  if (editingDeck.isNew) {
                    setEditingDeck(prev => ({ ...prev, categoryId: categoryId || null }))
                  } else {
                    setDeckCategories(prev => ({
                      ...prev,
                      [editingDeck.deck.id]: categoryId || null
                    }))
                  }
                }}
                onCreateCategory={() => {
                  setCategoryDialog({ mode: 'create', category: null })
                }}
                onEditCategory={(categoryId) => {
                  // Convert categoryId to number for comparison (select returns string)
                  const categoryIdNum = categoryId ? Number(categoryId) : null
                  if (categoryIdNum) {
                    const category = categories.find(c => c.id === categoryIdNum)
                    if (category) {
                      setCategoryDialog({ mode: 'edit', category })
                    }
                  }
                }}
                onDeleteCategory={(categoryId) => {
                  // Convert categoryId to number for comparison (select returns string)
                  const categoryIdNum = categoryId ? Number(categoryId) : null
                  
                  if (categoryIdNum && window.confirm('Are you sure you want to delete this category? Decks in this category will be moved to "No Category".')) {
                    // Remove category from categories array
                    setCategories(prev => prev.filter(cat => cat.id !== categoryIdNum))
                    
                    // Remove category from all decks that have it
                    setDeckCategories(prev => {
                      const newCategories = { ...prev }
                      Object.keys(newCategories).forEach(deckId => {
                        if (newCategories[deckId] === categoryIdNum) {
                          delete newCategories[deckId]
                        }
                      })
                      return newCategories
                    })
                    
                    // If the current deck has this category, clear it
                    if (editingDeck) {
                      if (editingDeck.isNew) {
                        // For new decks, clear categoryId from editingDeck state
                        if (editingDeck.categoryId === categoryIdNum) {
                          setEditingDeck(prev => ({ ...prev, categoryId: null }))
                        }
                      } else {
                        // For existing decks, clear from deckCategories
                        if (deckCategories[editingDeck.deck.id] === categoryIdNum) {
                          setDeckCategories(prev => {
                            const newCategories = { ...prev }
                            delete newCategories[editingDeck.deck.id]
                            return newCategories
                          })
                        }
                      }
                    }
                    
                    setNotification({
                      message: 'Category deleted successfully',
                      type: 'success'
                    })
                  }
                }}
              />
            ) : (
              <>
                <div className="page-title-container">
                  <div className="title-section">
                    <h1 className="page-title">Favourite Decks</h1>
                    <p className="page-description">Your saved favourite decks</p>
                  </div>
                  <div className="page-title-actions">
                    <button 
                      className="create-deck-button"
                      onClick={handleCreateNewDeck}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Create New Deck
                    </button>
                  </div>
                  {!loading && !error && (
                    <div className="deck-count">
                      <span className="deck-count-number">{favouriteDecks.length}</span>
                      <span className="deck-count-text">favourite decks</span>
                    </div>
                  )}
                </div>
                {loading && <div className="loading-message">Loading decks...</div>}
                {error && <div className="error-message">Error: {error}</div>}
                {!loading && !error && (() => {
                  // Group favourite decks by category
                  const decksByCategory = {}
                  const uncategorizedDecks = []
                  
                  favouriteDecks.forEach((deckId, index) => {
                    const deck = decks.find(d => d.id === deckId)
                    if (deck) {
                      const categoryId = deckCategories[deckId]
                      if (categoryId) {
                        if (!decksByCategory[categoryId]) {
                          decksByCategory[categoryId] = []
                        }
                        decksByCategory[categoryId].push({ deck, index })
                      } else {
                        uncategorizedDecks.push({ deck, index })
                      }
                    }
                  })
                  
                  // Get categories that have decks
                  const categoriesWithDecks = categories.filter(cat => decksByCategory[cat.id] && decksByCategory[cat.id].length > 0)
                  
                  // Expanded category view
                  if (expandedCategory) {
                    const categoryDecks = decksByCategory[expandedCategory.id] || []
                    return (
                      <div className="category-section category-section-expanded">
                        <CategoryBanner 
                          category={expandedCategory}
                          isExpanded={true}
                          onBack={() => setExpandedCategory(null)}
                        />
                        <div className="decks-grid">
                          {categoryDecks.length > 0 ? (
                            categoryDecks.map(({ deck, index }) => (
                              <DeckCard 
                                key={`${deck.id}-${index}`} 
                                deck={deck} 
                                isFavourite={false}
                                isInFavouritesView={true}
                                onRemoveFavourite={requestRemoveFromFavourites}
                                favouriteIndex={index}
                                deckName={favouriteDeckNames[`${deck.id}-${index}`] || 'My Favourite Deck'}
                                onEditDeck={handleEditDeck}
                                onAnalyze={handleAnalyzeDeck}
                              />
                            ))
                          ) : (
                            <div className="no-decks-message">No decks in this category</div>
                          )}
                        </div>
                      </div>
                    )
                  }
                  
                  // Normal view - only show if no category is expanded
                  // Group categories into pairs for two-per-row display
                  const groupedCategories = []
                  for (let i = 0; i < categoriesWithDecks.length; i += 2) {
                    groupedCategories.push(categoriesWithDecks.slice(i, i + 2))
                  }
                  
                  return (
                    <>
                      {/* Categories with decks */}
                      {groupedCategories.map((categoryPair, pairIndex) => {
                        const isLastPair = pairIndex === groupedCategories.length - 1
                        const isSingleCategory = categoryPair.length === 1
                        const shouldSpanFullWidth = isLastPair && isSingleCategory
                        
                        return (
                          <div key={`category-pair-${pairIndex}`} className={`category-pair-row ${shouldSpanFullWidth ? 'category-pair-row-single' : ''}`}>
                            {categoryPair.map((category) => {
                              const categoryDecks = decksByCategory[category.id] || []
                              const maxDecks = shouldSpanFullWidth ? 4 : 2
                              const displayDecks = categoryDecks.slice(0, maxDecks) // Show max 2 or 4 decks per category
                              
                              return (
                                <div key={category.id} className={`category-section ${shouldSpanFullWidth ? 'category-section-single' : ''}`}>
                                  <CategoryBanner 
                                    category={category}
                                    isExpanded={false}
                                    onSeeAll={() => setExpandedCategory(category)}
                                    hideSeeAll={categoryDecks.length <= maxDecks}
                                  />
                                  {displayDecks.length > 0 && (
                                    <div className={`category-decks-grid ${shouldSpanFullWidth ? 'category-decks-grid-single' : ''}`}>
                                      {displayDecks.map(({ deck, index }) => (
                              <DeckCard 
                                key={`${deck.id}-${index}`} 
                                deck={deck} 
                                isFavourite={false}
                                isInFavouritesView={true}
                                onRemoveFavourite={requestRemoveFromFavourites}
                                favouriteIndex={index}
                                deckName={favouriteDeckNames[`${deck.id}-${index}`] || 'My Favourite Deck'}
                                onEditDeck={handleEditDeck}
                                onAnalyze={handleAnalyzeDeck}
                              />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                      
                      {/* Uncategorized decks section */}
                      {uncategorizedDecks.length > 0 && (
                        <>
                          <div className="uncategorized-separator"></div>
                          <div className="uncategorized-section">
                            <h3 className="uncategorized-title">Uncategorized</h3>
                            <div className="decks-grid">
                              {uncategorizedDecks.map(({ deck, index }) => (
                                <DeckCard 
                                  key={`${deck.id}-${index}`} 
                                  deck={deck} 
                                  isFavourite={false}
                                  isInFavouritesView={true}
                                  onRemoveFavourite={requestRemoveFromFavourites}
                                  favouriteIndex={index}
                                  deckName={favouriteDeckNames[`${deck.id}-${index}`] || 'My Favourite Deck'}
                                  onEditDeck={handleEditDeck}
                                  onAnalyze={handleAnalyzeDeck}
                                />
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                      
                      {/* Empty state */}
                      {favouriteDecks.length === 0 && (
                        <div className="no-decks-message">No favourite decks yet. Add decks to your favourites from the Deck Catalog.</div>
                      )}
                    </>
                  )
                })()}
              </>
            )}
          </>
        )}
        {activeTab === 'account' && (
          <AccountView 
            isLoggedIn={isLoggedIn}
            setIsLoggedIn={setIsLoggedIn}
            isSubscribed={isSubscribed}
            setIsSubscribed={setIsSubscribed}
            onSubscribe={() => setShowPaymentForm(true)}
            onNotification={setNotification}
          />
        )}
          </>
        )}
      </main>
        </>
      )}
    </div>
  )
}

export default App

