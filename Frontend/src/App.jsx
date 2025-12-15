import React, { useState, useEffect } from 'react'
import './App.css'
import Swords from './Swords'
import crownIcon from './assets/ClashOps-PNG.png'
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
import AboutView from './AboutView'
import LoginPrompt from './LoginPrompt'
import SubscriptionPrompt from './SubscriptionPrompt'
import PaymentForm from './PaymentForm'
import AnalyzeLoading from './AnalyzeLoading'
import AnalysisView from './AnalysisView'
import InitialLoading from './InitialLoading'
import CountUpAnimation from './CountUpAnimation'
import {
  getGetPlayerDecksUrl,
  getGetCategoriesUrl,
  getEditDeckUrl,
  getDeleteDeckUrl,
  getSaveDeckUrl,
  getSaveCategoryUrl,
  getDeleteCategoryUrl,
  getEditCategoryUrl,
  getGetFeaturesUrl,
  getGetDecksUrl,
  getGetCardsUrl
} from './config'

function App() {
  const [decks, setDecks] = useState([])
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedFeature, setExpandedFeature] = useState(null) // Track which feature is expanded
  const [activeTab, setActiveTab] = useState('catalog') // Track active tab: 'catalog', 'favourites', 'account', or 'about'
  const [shouldAnimateDeckCount, setShouldAnimateDeckCount] = useState(false) // Track if deck count should animate
  const [favouriteDecks, setFavouriteDecks] = useState([]) // Track favourite deck objects (separate copies)
  const [favouriteDeckNames, setFavouriteDeckNames] = useState({}) // Track favourite deck names: { 'favouriteDeckId-index': 'name' }
  const [notification, setNotification] = useState(null) // Track notification state
  const [notificationKey, setNotificationKey] = useState(0) // Key to force new notification to mount
  
  // Wrapper function to set notification and force remount (skips exit animation of previous)
  const showNotification = (notificationData) => {
    setNotification(null) // Immediately clear current notification
    setNotificationKey(prev => prev + 1) // Increment key to force new mount
    // Use setTimeout to ensure the old notification is unmounted before mounting new one
    setTimeout(() => {
      setNotification(notificationData)
    }, 10)
  }
  const [confirmRemove, setConfirmRemove] = useState(null) // Track confirmation state: { deckId, index }
  const [cards, setCards] = useState([]) // All cards data
  const [selectedFilterCards, setSelectedFilterCards] = useState([]) // Selected cards for filtering: [{ cardName, mode }]
  const [excludedFilterCards, setExcludedFilterCards] = useState([]) // Excluded cards for filtering: [{ cardName, mode }]
  const [filterVariantMode, setFilterVariantMode] = useState('basic') // Variant mode for filtering: 'basic', 'evolution', 'hero'
  const [showFilterView, setShowFilterView] = useState(false) // Show filter cards view
  const [initialFilterState, setInitialFilterState] = useState({ selected: [], excluded: [] }) // Initial filter state when view opens
  const [editingDeck, setEditingDeck] = useState(null) // Track which deck is being edited: { deck, index, isNew }
  const [categories, setCategories] = useState([]) // User-created categories: [{ id, name, color, icon }]
  const [deckCategories, setDeckCategories] = useState({}) // Map deck IDs to category IDs: { deckId: categoryId }
  const [categoryDialog, setCategoryDialog] = useState(null) // Track category dialog: { mode: 'create' | 'edit', category: category | null }
  const [expandedCategory, setExpandedCategory] = useState(null) // Track which category is expanded (similar to expandedFeature)
  const [isLoggedIn, setIsLoggedIn] = useState(false) // Track if user is logged in
  const [currentUserId, setCurrentUserId] = useState(null) // Track current user ID
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
    showNotification({
      message: 'Welcome to ClashOps Diamond!',
      type: 'success'
    })
  }

  // Cards, features, and decks are now loaded from Azure Functions during initial loading
  
  // Helper function to check if deck matches filter (contains all selected, excludes all excluded)
  const deckMatchesFilter = (deck) => {
    // Check if deck contains all selected cards in their specified slots
    if (selectedFilterCards.length > 0) {
      const hasAllSelected = selectedFilterCards.every(filterItem => {
        const { cardName, mode } = filterItem
        // Determine which slots to check based on the card's mode
        let slotsToCheck = []
        if (mode === 'evolution') {
          slotsToCheck = [0, 1] // Evolution mode: check slots 0-1
        } else if (mode === 'hero') {
          slotsToCheck = [2, 3] // Hero mode: check slots 2-3
        } else {
          slotsToCheck = [0, 1, 2, 3, 4, 5, 6, 7] // Basic mode: check all slots
        }
        
        // Get card names from the specified slots
        const slotCardNames = slotsToCheck
          .map(slotIndex => deck.cards[slotIndex]?.name)
          .filter(name => name !== null && name !== undefined)
        
        return slotCardNames.some(cn => 
          cn.toLowerCase() === cardName.toLowerCase()
        )
      })
      if (!hasAllSelected) return false
    }
    
    // Check if deck excludes all excluded cards from their specified slots
    if (excludedFilterCards.length > 0) {
      const hasExcluded = excludedFilterCards.some(filterItem => {
        const { cardName, mode } = filterItem
        // Determine which slots to check based on the card's mode
        let slotsToCheck = []
        if (mode === 'evolution') {
          slotsToCheck = [0, 1] // Evolution mode: check slots 0-1
        } else if (mode === 'hero') {
          slotsToCheck = [2, 3] // Hero mode: check slots 2-3
        } else {
          slotsToCheck = [0, 1, 2, 3, 4, 5, 6, 7] // Basic mode: check all slots
        }
        
        // Get card names from the specified slots
        const slotCardNames = slotsToCheck
          .map(slotIndex => deck.cards[slotIndex]?.name)
          .filter(name => name !== null && name !== undefined)
        
        return slotCardNames.some(cn => 
          cn.toLowerCase() === cardName.toLowerCase()
        )
      })
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

  // Helper function to check if a deck is already in favorites (by comparing card names)
  const isDeckInFavourites = (deckId) => {
    const deck = decks.find(d => d.id === deckId)
    if (!deck || !deck.cardNames) return false
    
    // Check if any favorite deck has the same card names (in any order)
    return favouriteDecks.some(favDeck => {
      if (!favDeck.cardNames || favDeck.cardNames.length !== deck.cardNames.length) return false
      const favCardNames = [...favDeck.cardNames].sort()
      const deckCardNames = [...deck.cardNames].sort()
      return JSON.stringify(favCardNames) === JSON.stringify(deckCardNames)
    })
  }

  // Fetch player decks from backend
  const fetchPlayerDecks = async (userId) => {
    if (!userId) {
      return
    }
    
    // Wait for cards to be loaded before processing decks
    if (!cards || cards.length === 0) {
      // If cards aren't loaded yet, wait a bit and try again
      setTimeout(() => fetchPlayerDecks(userId), 500)
      return
    }
    
    try {
      // Fetch both decks and categories in parallel
      const [decksResponse, categoriesResponse] = await Promise.all([
        fetch(getGetPlayerDecksUrl(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userID: userId
          })
        }),
        fetch(getGetCategoriesUrl(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userID: userId
          })
        })
      ])
      
        if (!decksResponse.ok) {
        const errorText = await decksResponse.text()
        console.error('Error fetching player decks:', errorText)
        return
      }
      
      const decksData = await decksResponse.json()
      if (!Array.isArray(decksData)) {
        console.warn('Player decks data is not an array:', decksData)
        return
      }
      
      // Process categories response
      let categoriesData = []
      if (categoriesResponse.ok) {
        const categoriesJson = await categoriesResponse.json()
        if (Array.isArray(categoriesJson)) {
          categoriesData = categoriesJson
        }
      } else {
        console.warn('Error fetching categories, continuing without categories')
      }
      
      // Transform categories from backend format to frontend format
      const transformedCategories = categoriesData.map(categoryEntity => ({
        id: categoryEntity.CategoryID || categoryEntity.RowKey, // Use CategoryID or RowKey as id
        name: categoryEntity.CategoryName || '',
        icon: categoryEntity.CategoryIcon || '',
        color: categoryEntity.CategoryColor || '#ffd700'
      }))
      
      // Update categories state (merge with existing categories to avoid duplicates)
      setCategories(prev => {
        const existingIds = new Set(prev.map(c => c.id))
        const newCategories = transformedCategories.filter(c => !existingIds.has(c.id))
        return [...prev, ...newCategories]
      })
      
      // Create a map of category IDs to category objects for quick lookup
      const categoryMap = new Map()
      transformedCategories.forEach(cat => {
        categoryMap.set(cat.id, cat)
      })
      
      // Transform the fetched decks into the format expected by favouriteDecks
      const transformedDecks = []
      const deckNames = {}
      const deckCategoryMap = {}
      
      decksData.forEach((deckEntity, index) => {
        // Parse cards from semicolon-separated string
        const cardsString = deckEntity.Cards || ''
        const cardNames = cardsString.split(';').map(name => name.trim()).filter(name => name)
        
        if (cardNames.length === 0) {
          return // Skip empty decks
        }
        
        // Calculate elixir cost and cycle
        const elixirCost = calculateAverageElixirCostForDeck(cardNames)
        const cycle = calculateFourCardCycleForDeck(cardNames)
        
        // Create deck cards array
        const deckCards = cardNames.map(cardName => {
          const card = cards.find(c => c.card_name === cardName)
          return {
            name: cardName,
            rarity: card ? card.rarity : 'common'
          }
        })
        
        // Fill to 8 cards
        while (deckCards.length < 8) {
          deckCards.push({ name: null, rarity: 'common' })
        }
        
        // Use DeckID as the deck ID (prefixed with fav- to match our format)
        // Fallback to RowKey for backwards compatibility with old decks
        const backendDeckId = deckEntity.DeckID || deckEntity.RowKey || `backend-${index}`
        const deckId = `fav-${backendDeckId}`
        
        const transformedDeck = {
          id: deckId,
          cards: deckCards.slice(0, 8),
          cardNames: cardNames,
          elixirCost: elixirCost,
          cycle: cycle,
          score: 0 // Decks from backend don't have scores
        }
        
        transformedDecks.push(transformedDeck)
        
        // Set deck name from backend (or default to "My Favourite Deck")
        const backendDeckName = deckEntity.DeckName || 'My Favourite Deck'
        deckNames[`${deckId}-${index}`] = backendDeckName
        
        // Map category ID from backend to frontend category ID
        // The deckEntity.CategoryID is the UUID from the backend
        // We need to find the matching category and use its id
        if (deckEntity.CategoryID && deckEntity.CategoryID !== 'none') {
          const category = categoryMap.get(deckEntity.CategoryID)
          if (category) {
            // Use the category's id (which is the UUID from backend)
            deckCategoryMap[deckId] = category.id
              } else {
            // Category not found, but still store the CategoryID in case category loads later
            deckCategoryMap[deckId] = deckEntity.CategoryID
          }
        }
      })
      
      setFavouriteDecks(transformedDecks)
      setFavouriteDeckNames(deckNames)
      setDeckCategories(prev => ({
        ...prev,
        ...deckCategoryMap
      }))
    } catch (error) {
      console.error('Error fetching player decks:', error)
    }
  }

  // Helper function to edit deck in backend
  const editDeckInBackend = async (deckId, cardNames, categoryId, deckName) => {
    if (!currentUserId || !isLoggedIn) {
      return null // Don't edit if not logged in
    }
    
    // Extract the actual backend deck ID (remove "fav-" prefix if present)
    let backendDeckId = deckId
    if (deckId.startsWith('fav-')) {
      backendDeckId = deckId.substring(4) // Remove "fav-" prefix
    }
    
    try {
      // Format cards as semicolon-separated string
      const cardsString = cardNames.join(';')
      const categoryID = categoryId || 'none'
      
      const response = await fetch(getEditDeckUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deckID: backendDeckId,
          cards: cardsString,
          categoryID: categoryID,
          deckName: deckName
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error editing deck in backend:', errorText)
        return null
      }
      
      // Parse JSON response to get deckID
      const data = await response.json()
      return data.deckID // Return the backend UUID
    } catch (error) {
      console.error('Error editing deck in backend:', error)
      return null
    }
  }

  // Helper function to delete deck from backend
  const deleteDeckFromBackend = async (deckId) => {
    if (!currentUserId || !isLoggedIn) {
      return // Don't delete if not logged in
    }
    
    console.log('deleteDeckFromBackend called with deckId:', deckId)
    
    // Extract the actual backend deck ID (remove "fav-" prefix if present)
    let backendDeckId = deckId
    if (deckId && deckId.startsWith('fav-')) {
      backendDeckId = deckId.substring(4) // Remove "fav-" prefix
    }
    
    console.log('Extracted backendDeckId:', backendDeckId)
    
    try {
      const response = await fetch(getDeleteDeckUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deckID: backendDeckId
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error deleting deck from backend:', errorText)
        console.error('Requested deckID:', backendDeckId)
        // Don't show error to user - this is a background operation
      } else {
        console.log('Successfully deleted deck with ID:', backendDeckId)
      }
    } catch (error) {
      console.error('Error deleting deck from backend:', error)
      console.error('Requested deckID:', backendDeckId)
      // Don't show error to user - this is a background operation
    }
  }

  // Helper function to save deck to backend
  const saveDeckToBackend = async (cardNames, categoryId, deckName) => {
    if (!currentUserId || !isLoggedIn) {
      return null // Don't save if not logged in
    }
    
    try {
      // Format cards as semicolon-separated string
      const cardsString = cardNames.join(';')
      const categoryID = categoryId || 'none'
      const deckNameValue = deckName || 'My Favourite Deck'
      
      const response = await fetch(getSaveDeckUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cards: cardsString,
          userID: currentUserId,
          categoryID: categoryID,
          deckName: deckNameValue
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error saving deck to backend:', errorText)
        return null
      }
      
      // Parse JSON response to get deckID
      const data = await response.json()
      return data.deckID // Return the backend UUID
    } catch (error) {
      console.error('Error saving deck to backend:', error)
      return null
    }
  }

  // Add deck to favourites (allows duplicates)
  const addToFavourites = async (deckId) => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true)
      return
    }
    
    // Find the original deck
    const originalDeck = decks.find(d => d.id === deckId)
    if (!originalDeck) return
    
    // Create a deep copy of the deck with a new unique ID
    const favouriteDeckId = `fav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const favouriteDeck = {
      ...originalDeck,
      id: favouriteDeckId,
      cards: originalDeck.cards.map(card => ({ ...card })), // Deep copy cards array
      cardNames: [...originalDeck.cardNames] // Copy cardNames array
    }
    
    setFavouriteDecks(prev => {
      const newIndex = prev.length
      // Set default name for the new favourite deck
      setFavouriteDeckNames(names => ({
        ...names,
        [`${favouriteDeckId}-${newIndex}`]: 'My Favourite Deck'
      }))
      return [...prev, favouriteDeck]
    })
    
    // Save to backend and get the actual UUID
    const categoryId = deckCategories[deckId] || null
    const deckName = 'My Favourite Deck' // Default name when adding to favorites
    const backendDeckId = await saveDeckToBackend(originalDeck.cardNames, categoryId, deckName)
    
    // Update the deck ID with the actual backend UUID if we got one
    if (backendDeckId) {
      const actualDeckId = `fav-${backendDeckId}`
      setFavouriteDecks(prev => {
        const updated = [...prev]
        const lastIndex = updated.length - 1
        if (lastIndex >= 0) {
          updated[lastIndex] = {
            ...updated[lastIndex],
            id: actualDeckId
          }
          // Update the deck name key to use the new ID
          setFavouriteDeckNames(names => {
            const newNames = { ...names }
            const oldKey = `${favouriteDeckId}-${lastIndex}`
            const newKey = `${actualDeckId}-${lastIndex}`
            if (newNames[oldKey]) {
              newNames[newKey] = newNames[oldKey]
              delete newNames[oldKey]
            }
            return newNames
          })
          // Update category mapping
          if (categoryId) {
            setDeckCategories(prev => {
              const newCategories = { ...prev }
              if (newCategories[favouriteDeckId]) {
                newCategories[actualDeckId] = newCategories[favouriteDeckId]
                delete newCategories[favouriteDeckId]
              }
              return newCategories
            })
          }
        }
        return updated
      })
    }
    
    showNotification({
      message: `Deck added to favourites`,
      type: 'success'
    })
  }

  // Show confirmation dialog for removing deck from favourites
  const requestRemoveFromFavourites = (favouriteDeckId, index) => {
    setConfirmRemove({ deckId: favouriteDeckId, index })
  }

  // Actually remove deck from favourites (after confirmation)
  const confirmRemoveFromFavourites = async () => {
    if (confirmRemove) {
      const { deckId: favouriteDeckId, index } = confirmRemove
      
      console.log('confirmRemoveFromFavourites called with favouriteDeckId:', favouriteDeckId, 'index:', index)
      console.log('Current favouriteDecks:', favouriteDecks.map(d => ({ id: d.id, cardNames: d.cardNames })))
      
      // Delete from backend
      await deleteDeckFromBackend(favouriteDeckId)
      
      setFavouriteDecks(prev => {
        const newFavourites = [...prev]
        newFavourites.splice(index, 1)
        return newFavourites
      })
      // Remove the name for this deck
      setFavouriteDeckNames(prev => {
        const newNames = { ...prev }
        delete newNames[`${favouriteDeckId}-${index}`]
        // Reindex remaining names
        const reindexed = {}
        Object.keys(newNames).forEach(key => {
          const parts = key.split('-')
          const oldIdx = parseInt(parts[parts.length - 1])
          if (oldIdx > index) {
            const idParts = parts.slice(0, -1)
            reindexed[`${idParts.join('-')}-${oldIdx - 1}`] = newNames[key]
          } else if (oldIdx < index) {
            reindexed[key] = newNames[key]
          }
        })
        return reindexed
      })
      showNotification({
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
  const updateFavouriteDeckName = (favouriteDeckId, index, newName) => {
    setFavouriteDeckNames(prev => ({
      ...prev,
      [`${favouriteDeckId}-${index}`]: newName || 'My Favourite Deck'
    }))
  }

  // Toggle card in filter selection (cycles: unselected -> selected -> excluded -> unselected)
  // Now accepts { cardName, mode } object to handle variants separately
  const toggleFilterCard = (cardData) => {
    // Handle both old string format and new object format
    const cardName = typeof cardData === 'string' ? cardData : cardData.cardName
    const cardMode = typeof cardData === 'string' ? filterVariantMode : (cardData.mode || filterVariantMode)
    
    // Check if this specific variant (cardName + mode) is selected/excluded
    const isSelected = selectedFilterCards.some(item => 
      item.cardName === cardName && item.mode === cardMode
    )
    const isExcluded = excludedFilterCards.some(item => 
      item.cardName === cardName && item.mode === cardMode
    )
    
    if (isSelected) {
      // Move from selected to excluded (keep the same mode)
      setSelectedFilterCards(prev => prev.filter(item => 
        !(item.cardName === cardName && item.mode === cardMode)
      ))
      setExcludedFilterCards(prev => [...prev, { cardName, mode: cardMode }])
    } else if (isExcluded) {
      // Move from excluded to unselected
      setExcludedFilterCards(prev => prev.filter(item => 
        !(item.cardName === cardName && item.mode === cardMode)
      ))
    } else {
      // Move from unselected to selected (use the provided mode)
      setSelectedFilterCards(prev => [...prev, { cardName, mode: cardMode }])
    }
  }

  // Confirm filter and close filter view
  const confirmFilter = () => {
    setShowFilterView(false)
  }

  // Store initial filter state when filter view opens
  useEffect(() => {
    if (showFilterView) {
      // Capture the current filter state when the view opens
      setInitialFilterState({
        selected: [...selectedFilterCards],
        excluded: [...excludedFilterCards]
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFilterView]) // Only run when showFilterView changes to true

  // Cancel filter view - revert to initial state
  const cancelFilter = () => {
    // Restore to the initial filter state when the view was opened
    // Convert old string format to new object format if needed
    setSelectedFilterCards(initialFilterState.selected.map(item => 
      typeof item === 'string' ? { cardName: item, mode: 'basic' } : item
    ))
    setExcludedFilterCards(initialFilterState.excluded.map(item => 
      typeof item === 'string' ? { cardName: item, mode: 'basic' } : item
    ))
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
  const handleSaveEditedDeck = async (updatedDeck, savedDeckName) => {
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
        
        // Create a favorite deck copy
        const favouriteDeckId = `fav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const favouriteDeck = {
          ...newDeck,
          id: favouriteDeckId,
          cards: newDeck.cards.map(card => ({ ...card })),
          cardNames: [...newDeck.cardNames]
        }
        
        // Add to favourites
        const newIndex = favouriteDecks.length
        setFavouriteDecks(prev => [...prev, favouriteDeck])
        
        // Set deck name
        setFavouriteDeckNames(prev => ({
          ...prev,
          [`${favouriteDeckId}-${newIndex}`]: deckName
        }))
        
        // Set category if selected
        if (categoryId) {
          setDeckCategories(prev => ({
            ...prev,
            [favouriteDeckId]: categoryId
          }))
        }
        
        // Save to backend and get the actual UUID
        const backendDeckId = await saveDeckToBackend(cardNames, categoryId, deckName)
        
        // Update the deck ID with the actual backend UUID if we got one
        if (backendDeckId) {
          const actualDeckId = `fav-${backendDeckId}`
          setFavouriteDecks(prev => {
            const updated = [...prev]
            const lastIndex = updated.length - 1
            if (lastIndex >= 0 && updated[lastIndex].id === favouriteDeckId) {
              updated[lastIndex] = {
                ...updated[lastIndex],
                id: actualDeckId
              }
              // Update the deck name key to use the new ID
              setFavouriteDeckNames(names => {
                const newNames = { ...names }
                const oldKey = `${favouriteDeckId}-${lastIndex}`
                const newKey = `${actualDeckId}-${lastIndex}`
                if (newNames[oldKey]) {
                  newNames[newKey] = newNames[oldKey]
                  delete newNames[oldKey]
                }
                return newNames
              })
              // Update category mapping
              if (categoryId) {
                setDeckCategories(prev => {
                  const newCategories = { ...prev }
                  if (newCategories[favouriteDeckId]) {
                    newCategories[actualDeckId] = newCategories[favouriteDeckId]
                    delete newCategories[favouriteDeckId]
                  }
                  return newCategories
                })
              }
            }
            return updated
          })
        }
        
        showNotification({
          message: `Deck created successfully`,
          type: 'success'
        })
      } else {
        // Updating existing deck
        const deckId = editingDeck.deck.id
        
        // Check if this is a favorite deck (ID starts with "fav-")
        const isFavouriteDeck = typeof deckId === 'string' && deckId.startsWith('fav-')
        
        if (isFavouriteDeck) {
          // Update the favorite deck (not the original)
          setFavouriteDecks(prevFavourites => {
            const favouriteIndex = prevFavourites.findIndex(d => d.id === deckId)
            if (favouriteIndex !== -1) {
              const newFavourites = [...prevFavourites]
              newFavourites[favouriteIndex] = {
                ...newFavourites[favouriteIndex],
                cards: updatedDeck.cards,
                cardNames: cardNames,
                elixirCost: elixirCost,
                cycle: cycle
              }
              return newFavourites
            }
            return prevFavourites
          })
          
          // Update deck in backend
          await editDeckInBackend(deckId, cardNames, categoryId, deckName)
        } else {
          // Update the deck data in the main decks array (for catalog decks)
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
        }
        
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
        
        showNotification({
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

  // Helper function to save category to backend
  const saveCategoryToBackend = async (categoryName, categoryIcon, categoryColor) => {
    if (!currentUserId || !isLoggedIn) {
      return null // Don't save if not logged in
    }
    
    try {
      const response = await fetch(getSaveCategoryUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userID: currentUserId,
          categoryName: categoryName,
          categoryIcon: categoryIcon || '',
          categoryColor: categoryColor
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error saving category to backend:', errorText)
        return null
      }
      
      // Parse JSON response to get categoryID
      const data = await response.json()
      return data.categoryID // Return the backend UUID
    } catch (error) {
      console.error('Error saving category to backend:', error)
      return null
    }
  }

  // Helper function to delete category from backend
  const deleteCategoryFromBackend = async (categoryId) => {
    if (!currentUserId || !isLoggedIn) {
      return false // Don't delete if not logged in
    }
    
    try {
      const response = await fetch(getDeleteCategoryUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryID: categoryId
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error deleting category from backend:', errorText)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error deleting category from backend:', error)
      return false
    }
  }

  // Helper function to edit category in backend
  const editCategoryInBackend = async (categoryId, categoryName, categoryIcon, categoryColor) => {
    if (!currentUserId || !isLoggedIn) {
      return false // Don't edit if not logged in
    }
    
    try {
      const response = await fetch(getEditCategoryUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryID: categoryId,
          categoryName: categoryName,
          categoryIcon: categoryIcon || '',
          categoryColor: categoryColor
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error editing category in backend:', errorText)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error editing category in backend:', error)
      return false
    }
  }

  // Handle save category (create or edit)
  const handleSaveCategory = async (categoryData) => {
    if (!categoryDialog) return
    
    if (categoryDialog.mode === 'create') {
      // Save to backend and get the actual UUID
      const backendCategoryId = await saveCategoryToBackend(
        categoryData.name,
        categoryData.icon || '',
        categoryData.color
      )
      
      // Create new category with backend UUID
      const newCategory = {
        id: backendCategoryId || Date.now(), // Use backend UUID if available, fallback to timestamp
        name: categoryData.name,
        color: categoryData.color,
        icon: categoryData.icon
      }
      setCategories(prev => [...prev, newCategory])
      showNotification({
        message: 'Category created successfully',
        type: 'success'
      })
    } else if (categoryDialog.mode === 'edit' && categoryDialog.category) {
      // Update existing category
      const categoryId = categoryDialog.category.id
      
      // Only call backend if category has a UUID (string ID with dashes)
      // Old categories with numeric IDs won't be in the backend
      if (typeof categoryId === 'string' && categoryId.includes('-')) {
        // It's a UUID, update in backend
        await editCategoryInBackend(
          categoryId,
          categoryData.name,
          categoryData.icon || '',
          categoryData.color
        )
      }
      
      // Update local state
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId
          ? { ...cat, ...categoryData }
          : cat
      ))
      showNotification({
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
        fetch(getGetFeaturesUrl(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
          signal: controller.signal
        }),
        fetch(getGetDecksUrl(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
          signal: controller.signal
        }),
        fetch(getGetCardsUrl(), {
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
        setLoading(false)
        // Wait 2 seconds at 100% before hiding the loading screen
        setTimeout(() => {
          setInitialLoading(false)
          // Trigger deck count animation when data is loaded
          if (activeTab === 'catalog') {
            setShouldAnimateDeckCount(true)
            setTimeout(() => setShouldAnimateDeckCount(false), 2500)
          }
        }, 2000)
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
          key={notificationKey}
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
        <img 
          src={crownIcon} 
          alt="ClashOps Crown" 
          style={{ width: '400px', height: 'auto', border: 'none', outline: 'none' }}
        />
      </div>
      
      {/* Header */}
      <header className="header">
        <div className="logo">
          <img 
            src={crownIcon} 
            alt="ClashOps Crown" 
            style={{ width: '32px', height: 'auto', border: 'none', outline: 'none' }}
          />
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
              setShouldAnimateDeckCount(true)
              // Reset animation flag after a delay
              setTimeout(() => setShouldAnimateDeckCount(false), 2500)
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
            className={`nav-link ${activeTab === 'about' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              setActiveTab('about')
              setExpandedFeature(null)
            }}
          >
            About
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
                variantMode={filterVariantMode}
                onVariantModeChange={setFilterVariantMode}
              />
            ) : (
              <>
        <div className="page-title-container">
                  <div className="title-section">
          <h1 className="page-title">Deck Catalog</h1>
                    <p className="page-description">Discover the top decks in the arena, refreshed every season.</p>
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
                <span className="deck-count-number">
                  {shouldAnimateDeckCount ? (
                    <CountUpAnimation target={currentDeckCount} duration={2000} />
                  ) : (
                    currentDeckCount
                  )}
                </span>
                <span className="deck-count-text">Unique Decks</span>
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
                <div className="category-section category-section-expanded">
                  <FeatureBanner 
                    feature={expandedFeature}
                    decks={allDecks}
                    isExpanded={true}
                    onSeeAll={() => {
                      setExpandedFeature(null)
                      setShouldAnimateDeckCount(true)
                      setTimeout(() => setShouldAnimateDeckCount(false), 2500)
                    }}
                    onBack={() => {
                      setExpandedFeature(null)
                      setShouldAnimateDeckCount(true)
                      setTimeout(() => setShouldAnimateDeckCount(false), 2500)
                    }}
                  />
                  <div key={`expanded-${expandedFeature.featured_text}`} className="decks-grid">
                    {allDecks.length > 0 ? (
                      allDecks.map(deck => (
                            <DeckCard 
                              key={deck.id} 
                              deck={deck} 
                              isFavourite={isDeckInFavourites(deck.id)}
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
                        <div key={pairIndex} className={`category-pair-row ${shouldSpanFullWidth ? 'category-pair-row-single' : ''}`}>
                    {featurePair.map((feature, index) => {
                            const maxDecks = shouldSpanFullWidth ? 4 : 2
                            const featureDecks = getDecksForFeature(feature.filter_options, maxDecks)
                            const allFeatureDecks = getDecksForFeature(feature.filter_options)
                            const hasMoreDecks = allFeatureDecks.length > maxDecks
                      return (
                              <div key={index} className={`category-section ${shouldSpanFullWidth ? 'category-section-single' : ''}`}>
                          <FeatureBanner 
                            feature={feature} 
                            decks={featureDecks}
                            isExpanded={false}
                            onSeeAll={() => {
                              setExpandedFeature(feature)
                              setShouldAnimateDeckCount(true)
                              setTimeout(() => setShouldAnimateDeckCount(false), 2500)
                            }}
                            onBack={() => {}}
                                  hideSeeAll={!hasMoreDecks}
                          />
                          {featureDecks.length > 0 && (
                                  <div className={`category-decks-grid ${shouldSpanFullWidth ? 'category-decks-grid-single' : ''}`}>
                              {featureDecks.map(deck => (
                                      <DeckCard 
                                        key={deck.id} 
                                        deck={deck} 
                                        isFavourite={isDeckInFavourites(deck.id)}
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
                <div className="category-section">
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
                              isFavourite={isDeckInFavourites(deck.id)}
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
                  if (!categoryId) return
                  
                  // Find the category - id could be a number (old) or string UUID (new)
                  // categoryId from select is always a string, but category.id could be string (UUID) or number
                  const category = categories.find(cat => {
                    // If both are strings, compare directly
                    if (typeof cat.id === 'string' && typeof categoryId === 'string') {
                      return cat.id === categoryId
                    }
                    // If cat.id is number, convert categoryId to number for comparison
                    if (typeof cat.id === 'number') {
                      return cat.id === Number(categoryId)
                    }
                    // If cat.id is string UUID, compare as strings
                    return String(cat.id) === String(categoryId)
                  })
                  
                  if (category) {
                    setCategoryDialog({ mode: 'edit', category })
                  }
                }}
                onDeleteCategory={async (categoryId) => {
                  // categoryId from select is always a string, but category.id could be string (UUID) or number
                  // Find the category by comparing IDs (handling both string and number)
                  const category = categories.find(cat => {
                    // If both are strings, compare directly
                    if (typeof cat.id === 'string' && typeof categoryId === 'string') {
                      return cat.id === categoryId
                    }
                    // If cat.id is number, convert categoryId to number for comparison
                    if (typeof cat.id === 'number') {
                      return cat.id === Number(categoryId)
                    }
                    // If cat.id is string UUID, compare as strings
                    return String(cat.id) === String(categoryId)
                  })
                  
                  if (!category) return
                  
                  // Use the actual category.id for filtering (could be number or string)
                  const actualCategoryId = category.id
                  
                  if (window.confirm('Are you sure you want to delete this category? Decks in this category will be moved to "No Category".')) {
                    // Find all decks that have this category
                    const decksToUpdate = []
                    Object.keys(deckCategories).forEach(deckId => {
                      const deckCategoryId = deckCategories[deckId]
                      // Check if this deck has the category being deleted
                      let matches = false
                      if (typeof actualCategoryId === 'string' && typeof deckCategoryId === 'string') {
                        matches = deckCategoryId === actualCategoryId
                      } else if (typeof actualCategoryId === 'number' && typeof deckCategoryId === 'number') {
                        matches = deckCategoryId === actualCategoryId
                      } else {
                        // Mixed types, compare as strings
                        matches = String(deckCategoryId) === String(actualCategoryId)
                      }
                      
                      if (matches) {
                        // Find the deck object to get card names and deck name
                        const deck = favouriteDecks.find(d => d.id === deckId)
                        if (deck && deck.cardNames) {
                          const deckName = favouriteDeckNames[`${deckId}-${favouriteDecks.findIndex(d => d.id === deckId)}`] || 'My Favourite Deck'
                          decksToUpdate.push({
                            deckId: deckId,
                            cardNames: deck.cardNames,
                            deckName: deckName
                          })
                        }
                      }
                    })
                    
                    // Update all decks in the backend to have category "none"
                    if (decksToUpdate.length > 0 && isLoggedIn && currentUserId) {
                      await Promise.all(decksToUpdate.map(deckInfo => 
                        editDeckInBackend(deckInfo.deckId, deckInfo.cardNames, 'none', deckInfo.deckName)
                      ))
                    }
                    
                    // Delete from backend if category has a UUID (string ID with dashes)
                    // Only call backend if the ID is a UUID string (not a number from Date.now())
                    if (typeof actualCategoryId === 'string' && actualCategoryId.includes('-')) {
                      // It's a UUID, delete from backend
                      await deleteCategoryFromBackend(actualCategoryId)
                    }
                    
                    // Remove category from categories array
                    setCategories(prev => prev.filter(cat => cat.id !== actualCategoryId))
                    
                    // Remove category from all decks that have it
                    // deckCategories stores category IDs, need to compare properly
                    setDeckCategories(prev => {
                      const newCategories = { ...prev }
                      Object.keys(newCategories).forEach(deckId => {
                        const deckCategoryId = newCategories[deckId]
                        // Compare considering both could be number or string
                        if (typeof actualCategoryId === 'string' && typeof deckCategoryId === 'string') {
                          if (deckCategoryId === actualCategoryId) {
                            delete newCategories[deckId]
                          }
                        } else if (typeof actualCategoryId === 'number' && typeof deckCategoryId === 'number') {
                          if (deckCategoryId === actualCategoryId) {
                            delete newCategories[deckId]
                          }
                        } else {
                          // Mixed types, compare as strings
                          if (String(deckCategoryId) === String(actualCategoryId)) {
                            delete newCategories[deckId]
                          }
                        }
                      })
                      return newCategories
                    })
                    
                    // If the current deck has this category, clear it
                    if (editingDeck) {
                      if (editingDeck.isNew) {
                        // For new decks, clear categoryId from editingDeck state
                        const editingCategoryId = editingDeck.categoryId
                        if (editingCategoryId === actualCategoryId || 
                            (typeof editingCategoryId === 'number' && typeof actualCategoryId === 'number' && editingCategoryId === actualCategoryId) ||
                            String(editingCategoryId) === String(actualCategoryId)) {
                          setEditingDeck(prev => ({ ...prev, categoryId: null }))
                        }
                      } else {
                        // For existing decks, clear from deckCategories
                        const deckCategoryId = deckCategories[editingDeck.deck.id]
                        if (deckCategoryId === actualCategoryId ||
                            (typeof deckCategoryId === 'number' && typeof actualCategoryId === 'number' && deckCategoryId === actualCategoryId) ||
                            String(deckCategoryId) === String(actualCategoryId)) {
                          setDeckCategories(prev => {
                            const newCategories = { ...prev }
                            delete newCategories[editingDeck.deck.id]
                            return newCategories
                          })
                        }
                      }
                    }
                    
                    showNotification({
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
                    <p className="page-description">Save and organize your favourite decks.</p>
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
                      <span className="deck-count-text">Favourite Decks</span>
                    </div>
                  )}
                </div>
                {loading && <div className="loading-message">Loading decks...</div>}
                {error && <div className="error-message">Error: {error}</div>}
                {!loading && !error && (() => {
                  // Group favourite decks by category
                  const decksByCategory = {}
                  const uncategorizedDecks = []
                  
                  favouriteDecks.forEach((deck, index) => {
                    const categoryId = deckCategories[deck.id]
                    if (categoryId) {
                      if (!decksByCategory[categoryId]) {
                        decksByCategory[categoryId] = []
                      }
                      decksByCategory[categoryId].push({ deck, index })
                    } else {
                      uncategorizedDecks.push({ deck, index })
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
                        <div className="no-decks-message">No Favourite Decks yet. Add decks to your favourites from the Deck Catalog.</div>
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
            onNotification={showNotification}
            onLogin={(userId) => {
              setCurrentUserId(userId)
              fetchPlayerDecks(userId)
            }}
            onLogout={() => {
              setCurrentUserId(null)
              setFavouriteDecks([])
              setFavouriteDeckNames({})
            }}
          />
        )}
        {activeTab === 'about' && (
          <AboutView decks={decks} />
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

