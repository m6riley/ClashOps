import React, { useMemo, useState, useEffect } from 'react'
import './AnalysisView.css'
import { getCardImageUrl, getCardEvolutionImageUrl, getCardHeroImageUrl } from './cardUtils'
import ElixirIcon from './assets/Elixir.svg'
import CycleIcon from './assets/Cycle.svg'
import OptimizeLoading from './OptimizeLoading'
import { getOptimizeDeckUrl } from './config'
import Trophy from './Trophy'
import OffenseIcon from './OffenseIcon'
import DefenseIcon from './DefenseIcon'
import SynergyIcon from './SynergyIcon'
import VersatilityIcon from './VersatilityIcon'
import OptimizationsIcon from './OptimizationsIcon'
import BeatdownIcon from './BeatdownIcon'
import BridgeSpamIcon from './BridgeSpamIcon'
import SiegeIcon from './SiegeIcon'
import BaitIcon from './BaitIcon'
import GraveyardIcon from './GraveyardIcon'
import RoyalGiantIcon from './RoyalGiantIcon'
import CycleArchetypeIcon from './CycleArchetypeIcon'
import CardSwapsIcon from './CardSwapsIcon'
import TowerTroopIcon from './TowerTroopIcon'
import EvolutionsIcon from './EvolutionsIcon'

function AnalysisView({ deck, onClose, allCards, analysisResults }) {
  const [expandedCategories, setExpandedCategories] = useState({
    offense: false,
    defense: false,
    synergy: false,
    versatility: false
  })
  
  const [categoriesExpandedOnce, setCategoriesExpandedOnce] = useState({
    offense: false,
    defense: false,
    synergy: false,
    versatility: false
  })
  
  const [openInfoPopup, setOpenInfoPopup] = useState(null) // 'offense', 'defense', 'synergy', 'versatility', or null
  
  const [optimizationsLoaded, setOptimizationsLoaded] = useState(false)
  const [showOptimizeLoading, setShowOptimizeLoading] = useState(false)
  const [optimizationResults, setOptimizationResults] = useState(null)
  const [optimizationApiComplete, setOptimizationApiComplete] = useState(false)
  
  const [animatedScores, setAnimatedScores] = useState({
    offense: 0,
    defense: 0,
    synergy: 0,
    versatility: 0
  })
  
  const [typedSummaries, setTypedSummaries] = useState({
    offense: '',
    defense: '',
    synergy: '',
    versatility: ''
  })
  
  const [typedSubcategorySummaries, setTypedSubcategorySummaries] = useState({})
  
  const [typedOptimizations, setTypedOptimizations] = useState({
    cardSwaps: '',
    towerTroop: '',
    evolutions: ''
  })
  
  // Extract summary texts from analysis results
  const summaryTexts = useMemo(() => {
    const getSummary = (category) => {
      if (!analysisResults || !analysisResults[category]) {
        // Fallback to placeholder
        const placeholders = {
          offense: '✅ Fast 2.6 cycle enables constant Hog Rider pressure supported by cheap utilities.\n❗ One-dimensional offense; can stall out vs multiple buildings and Tornado.\n💡 Outcycle building counters and convert spell value into safe tower damage in double elixir.',
          defense: '✅ Strong defensive core with multiple building options and area control spells.\n❗ Vulnerable to heavy beatdown pushes and lacks reliable air defense.\n💡 Use buildings to distract and cycle back to defensive cards quickly.',
          synergy: '✅ Cards work well together with complementary roles and elixir efficiency.\n❗ Some cards may conflict in certain matchups or situations.\n💡 Maximize card interactions by timing plays and managing elixir carefully.',
          versatility: '✅ Deck can adapt to various playstyles and meta matchups effectively.\n❗ Limited flexibility in certain game modes or against specific archetypes.\n💡 Adjust playstyle based on opponent\'s deck and adapt strategy throughout the match.'
        }
        return placeholders[category] || ''
      }
      const categoryData = analysisResults[category]
      // All categories use capitalized key: "Offense", "Defense", "Synergy", "Versatility"
      const categoryKey = category.charAt(0).toUpperCase() + category.slice(1)
      if (categoryData[categoryKey] && categoryData[categoryKey].Summary) {
        return categoryData[categoryKey].Summary
      }
      return ''
    }
    
    return {
      offense: getSummary('offense'),
      defense: getSummary('defense'),
      synergy: getSummary('synergy'),
      versatility: getSummary('versatility')
    }
  }, [analysisResults])
  
  // Format deck as comma-separated string
  const formatDeckString = (deck) => {
    if (!deck || !deck.cardNames || deck.cardNames.length === 0) {
      return ''
    }
    // Format as "[Card1, Card2, Card3, ...]"
    return `[${deck.cardNames.join(', ')}]`
  }

  // Extract optimization texts from API results or use placeholders
  const optimizationTexts = useMemo(() => {
    if (!optimizationResults || !optimizationResults.Optimize) {
      return {
        cardSwaps: '💡 Consider replacing [Card A] with [Card B] for better synergy with your win condition.\n⚡ This swap improves your cycle speed by 0.3 elixir while maintaining defensive capabilities.',
        towerTroop: '🏰 Recommended: [Tower Troop Name]\n📊 This tower troop complements your deck\'s playstyle and provides strong defensive value against common meta threats.',
        evolutions: '✨ Recommended Evolution: [Evolution Name]\n🎯 This evolution enhances your deck\'s offensive potential and works well with your current card combinations.'
      }
    }

    const optimize = optimizationResults.Optimize
    let cardSwapsText = ''
    let towerTroopText = ''
    let evolutionsText = ''

    // Format Card Swaps (don't include list in text, we'll show infographic separately)
    if (optimize['Recommended Swaps']) {
      const swaps = optimize['Recommended Swaps']
      cardSwapsText = swaps['Improvement Summary'] || ''
    }

    // Format Tower Troop (don't include name in text, we'll show card separately)
    if (optimize['Recommended Tower Troop']) {
      const towerTroop = optimize['Recommended Tower Troop']
      towerTroopText = towerTroop.Reasoning || ''
    }

    // Format Evolutions (don't include list in text, we'll show cards separately)
    if (optimize['Recommended Evolutions']) {
      const evolutions = optimize['Recommended Evolutions']
      evolutionsText = evolutions.Reasoning || ''
    }

    return {
      cardSwaps: cardSwapsText || 'No card swaps recommended at this time.',
      towerTroop: towerTroopText || 'No tower troop recommendation available.',
      evolutions: evolutionsText || 'No evolution recommendations available.'
    }
  }, [optimizationResults])
  
  const toggleCategory = (category) => {
    setExpandedCategories(prev => {
      const newValue = !prev[category]
      // Mark as expanded once if this is the first time opening
      if (newValue && !categoriesExpandedOnce[category]) {
        setCategoriesExpandedOnce(prevOnce => ({
          ...prevOnce,
          [category]: true
        }))
      }
      return {
        ...prev,
        [category]: newValue
      }
    })
  }
  
  const toggleInfoPopup = (category) => {
    setOpenInfoPopup(prev => prev === category ? null : category)
  }
  
  // Category descriptions
  const categoryDescriptions = {
    offense: {
      title: 'Offense',
      description: 'Offense measures your deck\'s ability to deal damage and pressure opponents. This includes win conditions, support cards, and offensive spells.',
      ranking: 'Ranked on a scale of 0-5 based on win condition strength, offensive support, spell damage, and pressure capabilities. Higher scores indicate stronger offensive potential.'
    },
    defense: {
      title: 'Defense',
      description: 'Defense evaluates how well your deck can stop opponent attacks and protect your towers. This includes defensive buildings, troops, and control spells.',
      ranking: 'Ranked on a scale of 0-5 based on defensive buildings, air/ground coverage, crowd control, and defensive versatility. Higher scores indicate better defensive capabilities.'
    },
    synergy: {
      title: 'Synergy',
      description: 'Synergy measures how well your cards work together, including offensive and defensive combinations, card interactions, and overall deck cohesion.',
      ranking: 'Ranked on a scale of 0-5 based on card combinations, elixir efficiency, and how well cards complement each other. Higher scores indicate better card synergy.'
    },
    versatility: {
      title: 'Versatility',
      description: 'Versatility assesses how well your deck adapts to different matchups and archetypes. This includes matchup coverage and adaptability to various playstyles.',
      ranking: 'Ranked on a scale of 0-5 based on matchup coverage against different deck archetypes (Beatdown, Bridge Spam, Siege, Bait, Cycle, etc.). Higher scores indicate better versatility across matchups.'
    }
  }

  // Extract subcategories from analysis results
  const getSubcategories = (category) => {
    if (!analysisResults || !analysisResults[category]) return null
    const categoryData = analysisResults[category]
    const categoryKey = category.charAt(0).toUpperCase() + category.slice(1)
    
    if (category === 'versatility') {
      // Versatility has Archetypes
      return categoryData[categoryKey]?.Archetypes || null
    } else if (category === 'synergy') {
      // Synergy has Combos
      return categoryData[categoryKey]?.Combos || null
    } else {
      // Offense and Defense have Roles
      return categoryData[categoryKey]?.Roles || null
    }
  }

  // Get icon component for archetype
  const getArchetypeIcon = (archetypeName) => {
    const nameLower = archetypeName.toLowerCase()
    if (nameLower.includes('beatdown')) {
      return <BeatdownIcon size={18} className="archetype-icon" />
    }
    if (nameLower.includes('bridge spam') || nameLower.includes('bridgespam')) {
      return <BridgeSpamIcon size={18} className="archetype-icon" />
    }
    if (nameLower.includes('siege')) {
      return <SiegeIcon size={18} className="archetype-icon" />
    }
    if (nameLower.includes('bait')) {
      return <BaitIcon size={18} className="archetype-icon" />
    }
    if (nameLower.includes('graveyard')) {
      return <GraveyardIcon size={18} className="archetype-icon" />
    }
    if (nameLower.includes('royal giant') || nameLower.includes('royalgiant')) {
      return <RoyalGiantIcon size={18} className="archetype-icon" />
    }
    if (nameLower.includes('cycle')) {
      return <CycleArchetypeIcon size={18} className="archetype-icon" />
    }
    return null
  }

  // Remove emoji from archetype name
  const cleanArchetypeName = (name) => {
    if (!name) return name
    // Remove emoji characters using comprehensive regex patterns
    // This covers all major emoji ranges and variations
    return name
      // Remove emoji sequences (including combined emojis with zero-width joiners)
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Miscellaneous Symbols and Pictographs
      .replace(/[\u{2600}-\u{26FF}]/gu, '') // Miscellaneous Symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map Symbols
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Regional Indicator Symbols (flags)
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
      .replace(/[\u{200D}]/gu, '') // Zero Width Joiner
      .replace(/[\u{FE0F}]/gu, '') // Variation Selector-16
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Variation Selectors
      .replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '') // Skin tone modifiers
      .replace(/\s+/g, ' ') // Clean up multiple spaces
      .trim()
  }
  
  const handleLoadOptimizations = async () => {
    if (!analysisResults || !deck) return

    setShowOptimizeLoading(true)
    setOptimizationApiComplete(false)

    try {
      const deckString = formatDeckString(deck)
      if (!deckString) {
        throw new Error('Invalid deck format')
      }

      // Extract scores and summaries from analysis results
      const getCategoryData = (category) => {
        if (!analysisResults || !analysisResults[category]) return { score: 0, summary: '' }
        const categoryData = analysisResults[category]
        const categoryKey = category.charAt(0).toUpperCase() + category.slice(1)
        const score = categoryData[categoryKey]?.Score ? parseFloat(categoryData[categoryKey].Score) : 0
        const summary = categoryData[categoryKey]?.Summary || ''
        return { score, summary }
      }

      const offenseData = getCategoryData('offense')
      const defenseData = getCategoryData('defense')
      const synergyData = getCategoryData('synergy')
      const versatilityData = getCategoryData('versatility')

      const functionUrl = getOptimizeDeckUrl()

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deckToAnalyze: deckString,
          offenseScore: offenseData.score,
          offenseSummary: offenseData.summary,
          defenseScore: defenseData.score,
          defenseSummary: defenseData.summary,
          synergyScore: synergyData.score,
          synergySummary: synergyData.summary,
          versatilityScore: versatilityData.score,
          versatilitySummary: versatilityData.summary
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to optimize deck: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      
      // Parse the content JSON string
      let parsedContent
      try {
        parsedContent = typeof data.content === 'string' ? JSON.parse(data.content) : data.content
      } catch (parseError) {
        console.error('Error parsing optimization content:', parseError)
        parsedContent = data.content
      }

      setOptimizationResults(parsedContent)
      // Mark API call as complete - OptimizeLoading will wait for this before finishing
      setOptimizationApiComplete(true)
    } catch (error) {
      console.error('Error optimizing deck:', error)
      // Still set results with error message
      setOptimizationResults({
        Optimize: {
          'Recommended Swaps': { 'Improvement Summary': `Error loading optimizations: ${error.message}` },
          'Recommended Tower Troop': { 'Reasoning': 'Unable to load tower troop recommendation.' },
          'Recommended Evolutions': { 'Reasoning': 'Unable to load evolution recommendations.' }
        }
      })
      // Mark API call as complete even on error
      setOptimizationApiComplete(true)
    }
  }
  
  const handleOptimizeComplete = () => {
    // Called when OptimizeLoading animation completes (after API call is done)
    setShowOptimizeLoading(false)
    setOptimizationsLoaded(true)
  }
  // Function to get the cheapest 4 cards in the deck
  const getCheapestFourCards = (deckCards, cardsData) => {
    if (!deckCards || !cardsData) return []
    
    // Create mapping from card name to elixir cost
    const cardElixirMap = {}
    cardsData.forEach(card => {
      const cardName = card.card_name?.trim()
      const elixirCost = parseFloat(card.elixer_cost) || 0
      if (cardName) {
        cardElixirMap[cardName] = elixirCost
      }
    })
    
    // Get card names from deck
    const cardNames = deckCards
      .filter(card => card && card.name)
      .map(card => card.name)
    
    // Map to objects with name and cost, then sort by cost
    const cardsWithCost = cardNames
      .map(name => ({
        name,
        cost: cardElixirMap[name] || 0
      }))
      .filter(card => card.cost > 0)
      .sort((a, b) => a.cost - b.cost)
      .slice(0, 4) // Get 4 cheapest
    
    return cardsWithCost.map(card => card.name)
  }
  
  const cheapestFourCards = useMemo(() => {
    return getCheapestFourCards(deck.cards, allCards)
  }, [deck.cards, allCards])
  
  // Extract scores from analysis results (0-5 scale)
  const randomScores = useMemo(() => {
    const getScore = (category) => {
      if (!analysisResults || !analysisResults[category]) return Math.random() * 5
      const categoryData = analysisResults[category]
      // All categories use capitalized key: "Offense", "Defense", "Synergy", "Versatility"
      const categoryKey = category.charAt(0).toUpperCase() + category.slice(1)
      if (categoryData[categoryKey] && categoryData[categoryKey].Score !== undefined) {
        return parseFloat(categoryData[categoryKey].Score) || 0
      }
      return Math.random() * 5 // Fallback to random if data not available
    }
    
    return {
      offense: getScore('offense'),
      defense: getScore('defense'),
      synergy: getScore('synergy'),
      versatility: getScore('versatility')
    }
  }, [analysisResults])
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  // Type out summaries with typing animation (in parallel)
  useEffect(() => {
    if (!summaryTexts || Object.keys(summaryTexts).length === 0) return
    
    const typingSpeed = 30 // milliseconds per character
    const categories = ['offense', 'defense', 'synergy', 'versatility']
    const charIndices = {
      offense: 0,
      defense: 0,
      synergy: 0,
      versatility: 0
    }
    let timeoutId
    
    const typeNextChars = () => {
      let allDone = true
      
      categories.forEach(category => {
        const fullText = summaryTexts[category]
        if (charIndices[category] < fullText.length) {
          allDone = false
          setTypedSummaries(prev => ({
            ...prev,
            [category]: fullText.substring(0, charIndices[category] + 1)
          }))
          charIndices[category]++
        }
      })
      
      if (!allDone) {
        timeoutId = setTimeout(typeNextChars, typingSpeed)
      }
    }
    
    // Start typing after a short delay
    timeoutId = setTimeout(typeNextChars, 500)
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [summaryTexts])

  // Type out subcategory summaries with typing animation when category is first expanded
  useEffect(() => {
    if (!analysisResults) return

    const typingSpeed = 30 // milliseconds per character
    const categories = ['offense', 'defense', 'synergy', 'versatility']
    
    // Check if any category was just expanded for the first time
    const categoriesToType = categories.filter(category => {
      if (!categoriesExpandedOnce[category]) return false
      // Check if any subcategory for this category hasn't been typed yet
      const subcategories = getSubcategories(category)
      if (!subcategories) return false
      return Object.keys(subcategories).some(subcategoryName => {
        const key = `${category}-${subcategoryName}`
        const currentText = typedSubcategorySummaries[key] || ''
        const fullText = subcategories[subcategoryName].Summary || subcategories[subcategoryName].Description || ''
        return currentText.length < fullText.length
      })
    })
    
    if (categoriesToType.length === 0) return

    // Collect subcategories for categories that were just expanded
    const allSubcategories = {}
    const charIndices = {}
    
    categoriesToType.forEach(category => {
      const subcategories = getSubcategories(category)
      if (subcategories) {
        Object.entries(subcategories).forEach(([subcategoryName, subcategoryData]) => {
          const key = `${category}-${subcategoryName}`
          const summaryText = subcategoryData.Summary || subcategoryData.Description || ''
          if (summaryText) {
            const currentText = typedSubcategorySummaries[key] || ''
            // Only add if not fully typed yet
            if (currentText.length < summaryText.length) {
              allSubcategories[key] = summaryText
              charIndices[key] = currentText.length // Start from where we left off
            }
          }
        })
      }
    })

    // If no new subcategories to type, return early
    if (Object.keys(allSubcategories).length === 0) return

    let timeoutId
    
    const typeNextChars = () => {
      let allDone = true
      
      Object.keys(allSubcategories).forEach(key => {
        const fullText = allSubcategories[key]
        if (charIndices[key] < fullText.length) {
          allDone = false
          setTypedSubcategorySummaries(prev => ({
            ...prev,
            [key]: fullText.substring(0, charIndices[key] + 1)
          }))
          charIndices[key]++
        }
      })
      
      if (!allDone) {
        timeoutId = setTimeout(typeNextChars, typingSpeed)
      }
    }
    
    // Start typing immediately when category is expanded
    timeoutId = setTimeout(typeNextChars, 100)
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [categoriesExpandedOnce, analysisResults, typedSubcategorySummaries])
  
  // Type out optimizations with typing animation (in parallel) when optimizations are loaded
  useEffect(() => {
    if (!optimizationsLoaded) return
    
    const typingSpeed = 30 // milliseconds per character
    const optimizations = ['cardSwaps', 'towerTroop', 'evolutions']
    const charIndices = {
      cardSwaps: 0,
      towerTroop: 0,
      evolutions: 0
    }
    let timeoutId
    
    const typeNextChars = () => {
      let allDone = true
      
      optimizations.forEach(optimization => {
        const fullText = optimizationTexts[optimization]
        if (charIndices[optimization] < fullText.length) {
          allDone = false
          setTypedOptimizations(prev => ({
            ...prev,
            [optimization]: fullText.substring(0, charIndices[optimization] + 1)
          }))
          charIndices[optimization]++
        }
      })
      
      if (!allDone) {
        timeoutId = setTimeout(typeNextChars, typingSpeed)
      }
    }
    
    // Start typing after a short delay
    timeoutId = setTimeout(typeNextChars, 500)
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [optimizationsLoaded])
  
  // Animate progress bars on mount
  useEffect(() => {
    const duration = 2000 // 2 seconds total
    const steps = 60 // 60 animation steps
    const stepDuration = duration / steps
    
    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      
      // Easing function: ease-out cubic (slows down as it approaches target)
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
      const easedProgress = easeOutCubic(progress)
      
      setAnimatedScores({
        offense: randomScores.offense * easedProgress,
        defense: randomScores.defense * easedProgress,
        synergy: randomScores.synergy * easedProgress,
        versatility: randomScores.versatility * easedProgress
      })
      
      if (currentStep >= steps) {
        clearInterval(interval)
        // Ensure final values are exact
        setAnimatedScores({
          offense: randomScores.offense,
          defense: randomScores.defense,
          synergy: randomScores.synergy,
          versatility: randomScores.versatility
        })
      }
    }, stepDuration)
    
    return () => clearInterval(interval)
  }, [randomScores])
  
  // Calculate overall score (sum of all 4 scores, out of 20)
  const overallScore = useMemo(() => {
    return randomScores.offense + randomScores.defense + randomScores.synergy + randomScores.versatility
  }, [randomScores])
  
  // Convert score (0-5) to letter grade with +, normal, and - variants
  // 14 grade levels total (S, A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F), each spanning 5/14 ≈ 0.357
  const scoreToLetterGrade = (score) => {
    const interval = 5 / 14
    if (score >= 13 * interval) return 'S'   // 4.643-5
    if (score >= 12 * interval) return 'A+'  // 4.286-4.643
    if (score >= 11 * interval) return 'A'  // 3.929-4.286
    if (score >= 10 * interval) return 'A-' // 3.571-3.929
    if (score >= 9 * interval) return 'B+'  // 3.214-3.571
    if (score >= 8 * interval) return 'B'   // 2.857-3.214
    if (score >= 7 * interval) return 'B-'  // 2.5-2.857
    if (score >= 6 * interval) return 'C+' // 2.143-2.5
    if (score >= 5 * interval) return 'C'   // 1.786-2.143
    if (score >= 4 * interval) return 'C-' // 1.429-1.786
    if (score >= 3 * interval) return 'D+' // 1.071-1.429
    if (score >= 2 * interval) return 'D'  // 0.714-1.071
    if (score >= 1 * interval) return 'D-' // 0.357-0.714
    return 'F'                              // 0-0.357
  }
  
  // Convert overall score (0-20) to letter grade with +, normal, and - variants
  const overallScoreToLetterGrade = (score) => {
    // Convert to 0-5 scale for grading
    const normalizedScore = (score / 20) * 5
    const interval = 5 / 14
    if (normalizedScore >= 13 * interval) return 'S'   // 4.643-5
    if (normalizedScore >= 12 * interval) return 'A+'  // 4.286-4.643
    if (normalizedScore >= 11 * interval) return 'A'  // 3.929-4.286
    if (normalizedScore >= 10 * interval) return 'A-' // 3.571-3.929
    if (normalizedScore >= 9 * interval) return 'B+'  // 3.214-3.571
    if (normalizedScore >= 8 * interval) return 'B'   // 2.857-3.214
    if (normalizedScore >= 7 * interval) return 'B-'  // 2.5-2.857
    if (normalizedScore >= 6 * interval) return 'C+' // 2.143-2.5
    if (normalizedScore >= 5 * interval) return 'C'   // 1.786-2.143
    if (normalizedScore >= 4 * interval) return 'C-' // 1.429-1.786
    if (normalizedScore >= 3 * interval) return 'D+' // 1.071-1.429
    if (normalizedScore >= 2 * interval) return 'D'  // 0.714-1.071
    if (normalizedScore >= 1 * interval) return 'D-' // 0.357-0.714
    return 'F'                              // 0-0.357
  }
  
  // Convert score (0-5) to percentage (0-100%)
  const scoreToPercentage = (score) => Math.min((score / 5) * 100, 100)
  
  // Convert letter grade to CSS class name
  const gradeToClassName = (grade) => {
    const lower = grade.toLowerCase()
    if (lower.endsWith('+')) {
      return lower.replace('+', '-plus')
    } else if (lower.endsWith('-')) {
      return lower.replace('-', '-minus')
    }
    return lower
  }
  
  return (
    <>
      {showOptimizeLoading && (
        <OptimizeLoading
          onClose={() => {
            setShowOptimizeLoading(false)
            setOptimizationsLoaded(false)
          }}
          onComplete={handleOptimizeComplete}
          apiComplete={optimizationApiComplete}
        />
      )}
      <div className="analysis-view">
      <div className="analysis-header-section">
        <div className="page-title-container">
          <div className="title-section">
            <h1 className="page-title">Deck Report Card</h1>
            <div className="analysis-grid">
              <div className="analysis-grid-item">
                <div className="analysis-deck-cards">
                  {deck.cards.map((card, index) => {
                    const isEvolution = index < 2 && card.name !== null
                    const isHero = index >= 2 && index < 4 && card.name !== null
                    
                    let imageUrl = card.name ? getCardImageUrl(card.name) : null
                    if (isEvolution && card.name) {
                      imageUrl = getCardEvolutionImageUrl(card.name)
                    } else if (isHero && card.name) {
                      imageUrl = getCardHeroImageUrl(card.name)
                    }
                    
                    return (
                      <div key={index} className={`analysis-card-item ${card.rarity || 'common'} ${isEvolution ? 'evolution-card' : ''} ${isHero ? 'hero-card' : ''}`}>
                        {card.name ? (
                          <img 
                            src={imageUrl} 
                            alt={card.name}
                            className="analysis-card-image"
                            onError={(e) => {
                              // Fallback to normal image if variant fails
                              if (imageUrl !== getCardImageUrl(card.name)) {
                                e.target.src = getCardImageUrl(card.name)
                              }
                            }}
                          />
                        ) : (
                          <div className="analysis-card-placeholder">
                            <span>Empty</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="analysis-grid-item">
                <h3 className="analysis-grid-item-title">Elixir and Cycle</h3>
                <div className="analysis-stats">
                  <div className="analysis-stat-item">
                    <img src={ElixirIcon} alt="Elixir" className="analysis-stat-icon" />
                    <span className="analysis-stat-label">Average Elixir Cost:</span>
                    <span className="analysis-stat-value">{typeof deck.elixirCost === 'number' ? deck.elixirCost.toFixed(1) : parseFloat(deck.elixirCost || 0).toFixed(1)}</span>
                  </div>
                  <div className="analysis-stat-item">
                    <img src={CycleIcon} alt="Cycle" className="analysis-stat-icon" />
                    <span className="analysis-stat-label">4-Card Cycle Speed:</span>
                    <span className="analysis-stat-value">{deck.cycle || 0}</span>
                  </div>
                  {cheapestFourCards.length > 0 && (
                    <div className="analysis-cycle-cards">
                      {cheapestFourCards.map((cardName, index) => (
                        <img
                          key={index}
                          src={getCardImageUrl(cardName)}
                          alt={cardName}
                          className="analysis-cycle-card-image"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="page-title-actions">
            <button className="analysis-view-back" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
          </div>
        </div>
      </div>
      
      <div className="analysis-full-width-section">
        <div className="analysis-elixir-cycle-container">
          <div className="analysis-scores-grid">
            <div className="analysis-grid-item">
              <div className="analysis-score-stats">
                <div className="analysis-score-item">
                  <span className="analysis-score-label analysis-score-label-overall">
                    <Trophy size={20} className="trophy-icon" />
                    Overall Score <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(overallScoreToLetterGrade(overallScore))}`}>{overallScoreToLetterGrade(overallScore)}</span>
                  </span>
                </div>
                <div className="analysis-score-item">
                  <div className="analysis-score-item-content">
                    <span className="analysis-score-label">
                      <OffenseIcon size={18} className="offense-icon" />
                      Offense <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(scoreToLetterGrade(randomScores.offense))}`}>{scoreToLetterGrade(randomScores.offense)}</span>
                    </span>
                    <div className="analysis-progress-bar">
                      <div className="analysis-progress-bar-fill" style={{ width: `${scoreToPercentage(animatedScores.offense)}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="analysis-score-item">
                  <div className="analysis-score-item-content">
                    <span className="analysis-score-label">
                      <DefenseIcon size={18} className="defense-icon" />
                      Defense <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(scoreToLetterGrade(randomScores.defense))}`}>{scoreToLetterGrade(randomScores.defense)}</span>
                    </span>
                    <div className="analysis-progress-bar">
                      <div className="analysis-progress-bar-ticks">
                        {[0, 1, 2, 3, 4, 5].map((tick) => (
                          <div key={tick} className="analysis-progress-bar-tick" style={{ left: `${(tick / 5) * 100}%` }}></div>
                        ))}
                      </div>
                      <div className="analysis-progress-bar-fill" style={{ width: `${scoreToPercentage(animatedScores.defense)}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="analysis-score-item">
                  <div className="analysis-score-item-content">
                    <span className="analysis-score-label">
                      <SynergyIcon size={18} className="synergy-icon" />
                      Synergy <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(scoreToLetterGrade(randomScores.synergy))}`}>{scoreToLetterGrade(randomScores.synergy)}</span>
                    </span>
                    <div className="analysis-progress-bar">
                      <div className="analysis-progress-bar-ticks">
                        {[0, 1, 2, 3, 4, 5].map((tick) => (
                          <div key={tick} className="analysis-progress-bar-tick" style={{ left: `${(tick / 5) * 100}%` }}></div>
                        ))}
                      </div>
                      <div className="analysis-progress-bar-fill" style={{ width: `${scoreToPercentage(animatedScores.synergy)}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="analysis-score-item">
                  <div className="analysis-score-item-content">
                    <span className="analysis-score-label">
                      <VersatilityIcon size={18} className="versatility-icon" />
                      Versatility <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(scoreToLetterGrade(randomScores.versatility))}`}>{scoreToLetterGrade(randomScores.versatility)}</span>
                    </span>
                    <div className="analysis-progress-bar">
                      <div className="analysis-progress-bar-ticks">
                        {[0, 1, 2, 3, 4, 5].map((tick) => (
                          <div key={tick} className="analysis-progress-bar-tick" style={{ left: `${(tick / 5) * 100}%` }}></div>
                        ))}
                      </div>
                      <div className="analysis-progress-bar-fill" style={{ width: `${scoreToPercentage(animatedScores.versatility)}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="analysis-categories-grid">
            <div className="analysis-grid-item">
              <div className="analysis-grid-item-title-container">
                <h3 className="analysis-grid-item-title">
                  <OffenseIcon size={20} className="offense-icon" />
                  Offense <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(scoreToLetterGrade(randomScores.offense))}`}>{scoreToLetterGrade(randomScores.offense)}</span>
                </h3>
                <button 
                  className="analysis-info-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleInfoPopup('offense')
                  }}
                  title="Learn more about Offense"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                {openInfoPopup === 'offense' && (
                  <div className="analysis-info-popup">
                    <div className="analysis-info-popup-content">
                      <button 
                        className="analysis-info-popup-close"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleInfoPopup('offense')
                        }}
                      >
                        ×
                      </button>
                      <h4 className="analysis-info-popup-title">{categoryDescriptions.offense.title}</h4>
                      <p className="analysis-info-popup-description">{categoryDescriptions.offense.description}</p>
                      <p className="analysis-info-popup-ranking"><strong>Ranking:</strong> {categoryDescriptions.offense.ranking}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="analysis-category-summary">
                {typedSummaries.offense}
                {typedSummaries.offense.length < summaryTexts.offense.length && <span className="typing-cursor">|</span>}
              </div>
              <button 
                className="analysis-category-expand-btn"
                onClick={() => toggleCategory('offense')}
              >
                {expandedCategories.offense ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              {expandedCategories.offense && (() => {
                const roles = getSubcategories('offense')
                if (!roles) return null
                return (
                  <div className="analysis-category-subcategories">
                    {Object.entries(roles).map(([roleName, roleData]) => {
                      const score = roleData.Score !== undefined ? parseFloat(roleData.Score) : null
                      const letterGrade = score !== null ? scoreToLetterGrade(score) : null
                      return (
                      <div key={roleName} className="analysis-subcategory-item">
                        <h4 className="analysis-subcategory-title">
                          {roleName}
                          {letterGrade && (
                            <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(letterGrade)}`}> {letterGrade}</span>
                          )}
                        </h4>
                        {roleData.Cards && roleData.Cards.length > 0 && (
                          <div className="analysis-subcategory-cards">
                            {roleData.Cards.map((cardName, index) => (
                              <img
                                key={index}
                                src={getCardImageUrl(cardName)}
                                alt={cardName}
                                className="analysis-subcategory-card-image"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            ))}
                          </div>
                        )}
                        {roleData.Summary && (() => {
                          const key = `offense-${roleName}`
                          const typedText = typedSubcategorySummaries[key] || ''
                          const fullText = roleData.Summary
                          return (
                            <div className="analysis-subcategory-summary">
                              {typedText}
                              {typedText.length < fullText.length && <span className="typing-cursor">|</span>}
                            </div>
                          )
                        })()}
                      </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
            <div className="analysis-grid-item">
              <div className="analysis-grid-item-title-container">
                <h3 className="analysis-grid-item-title">
                  <DefenseIcon size={20} className="defense-icon" />
                  Defense <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(scoreToLetterGrade(randomScores.defense))}`}>{scoreToLetterGrade(randomScores.defense)}</span>
                </h3>
                <button 
                  className="analysis-info-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleInfoPopup('defense')
                  }}
                  title="Learn more about Defense"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                {openInfoPopup === 'defense' && (
                  <div className="analysis-info-popup">
                    <div className="analysis-info-popup-content">
                      <button 
                        className="analysis-info-popup-close"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleInfoPopup('defense')
                        }}
                      >
                        ×
                      </button>
                      <h4 className="analysis-info-popup-title">{categoryDescriptions.defense.title}</h4>
                      <p className="analysis-info-popup-description">{categoryDescriptions.defense.description}</p>
                      <p className="analysis-info-popup-ranking"><strong>Ranking:</strong> {categoryDescriptions.defense.ranking}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="analysis-category-summary">
                {typedSummaries.defense}
                {typedSummaries.defense.length < summaryTexts.defense.length && <span className="typing-cursor">|</span>}
              </div>
              <button 
                className="analysis-category-expand-btn"
                onClick={() => toggleCategory('defense')}
              >
                {expandedCategories.defense ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              {expandedCategories.defense && (() => {
                const roles = getSubcategories('defense')
                if (!roles) return null
                return (
                  <div className="analysis-category-subcategories">
                    {Object.entries(roles).map(([roleName, roleData]) => {
                      const score = roleData.Score !== undefined ? parseFloat(roleData.Score) : null
                      const letterGrade = score !== null ? scoreToLetterGrade(score) : null
                      return (
                      <div key={roleName} className="analysis-subcategory-item">
                        <h4 className="analysis-subcategory-title">
                          {roleName}
                          {letterGrade && (
                            <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(letterGrade)}`}> {letterGrade}</span>
                          )}
                        </h4>
                        {roleData.Cards && roleData.Cards.length > 0 && (
                          <div className="analysis-subcategory-cards">
                            {roleData.Cards.map((cardName, index) => (
                              <img
                                key={index}
                                src={getCardImageUrl(cardName)}
                                alt={cardName}
                                className="analysis-subcategory-card-image"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            ))}
                          </div>
                        )}
                        {roleData.Summary && (() => {
                          const key = `defense-${roleName}`
                          const typedText = typedSubcategorySummaries[key] || ''
                          const fullText = roleData.Summary
                          return (
                            <div className="analysis-subcategory-summary">
                              {typedText}
                              {typedText.length < fullText.length && <span className="typing-cursor">|</span>}
                            </div>
                          )
                        })()}
                      </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
            <div className="analysis-grid-item">
              <div className="analysis-grid-item-title-container">
                <h3 className="analysis-grid-item-title">
                  <SynergyIcon size={20} className="synergy-icon" />
                  Synergy <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(scoreToLetterGrade(randomScores.synergy))}`}>{scoreToLetterGrade(randomScores.synergy)}</span>
                </h3>
                <button 
                  className="analysis-info-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleInfoPopup('synergy')
                  }}
                  title="Learn more about Synergy"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                {openInfoPopup === 'synergy' && (
                  <div className="analysis-info-popup">
                    <div className="analysis-info-popup-content">
                      <button 
                        className="analysis-info-popup-close"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleInfoPopup('synergy')
                        }}
                      >
                        ×
                      </button>
                      <h4 className="analysis-info-popup-title">{categoryDescriptions.synergy.title}</h4>
                      <p className="analysis-info-popup-description">{categoryDescriptions.synergy.description}</p>
                      <p className="analysis-info-popup-ranking"><strong>Ranking:</strong> {categoryDescriptions.synergy.ranking}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="analysis-category-summary">
                {typedSummaries.synergy}
                {typedSummaries.synergy.length < summaryTexts.synergy.length && <span className="typing-cursor">|</span>}
              </div>
              <button 
                className="analysis-category-expand-btn"
                onClick={() => toggleCategory('synergy')}
              >
                {expandedCategories.synergy ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              {expandedCategories.synergy && (() => {
                const combos = getSubcategories('synergy')
                if (!combos) return null
                return (
                  <div className="analysis-category-subcategories">
                    {Object.entries(combos).map(([comboName, comboData]) => {
                      const score = comboData.Score !== undefined ? parseFloat(comboData.Score) : null
                      const letterGrade = score !== null ? scoreToLetterGrade(score) : null
                      return (
                      <div key={comboName} className="analysis-subcategory-item">
                        <h4 className="analysis-subcategory-title">
                          {comboName}
                          {letterGrade && (
                            <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(letterGrade)}`}> {letterGrade}</span>
                          )}
                        </h4>
                        {comboData.Cards && comboData.Cards.length > 0 && (
                          <div className="analysis-subcategory-cards">
                            {comboData.Cards.map((cardName, index) => (
                              <img
                                key={index}
                                src={getCardImageUrl(cardName)}
                                alt={cardName}
                                className="analysis-subcategory-card-image"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            ))}
                          </div>
                        )}
                        {comboData.Summary && (() => {
                          const key = `synergy-${comboName}`
                          const typedText = typedSubcategorySummaries[key] || ''
                          const fullText = comboData.Summary
                          return (
                            <div className="analysis-subcategory-summary">
                              {typedText}
                              {typedText.length < fullText.length && <span className="typing-cursor">|</span>}
                            </div>
                          )
                        })()}
                      </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
            <div className="analysis-grid-item">
              <div className="analysis-grid-item-title-container">
                <h3 className="analysis-grid-item-title">
                  <VersatilityIcon size={20} className="versatility-icon" />
                  Versatility <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(scoreToLetterGrade(randomScores.versatility))}`}>{scoreToLetterGrade(randomScores.versatility)}</span>
                </h3>
                <button 
                  className="analysis-info-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleInfoPopup('versatility')
                  }}
                  title="Learn more about Versatility"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                {openInfoPopup === 'versatility' && (
                  <div className="analysis-info-popup">
                    <div className="analysis-info-popup-content">
                      <button 
                        className="analysis-info-popup-close"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleInfoPopup('versatility')
                        }}
                      >
                        ×
                      </button>
                      <h4 className="analysis-info-popup-title">{categoryDescriptions.versatility.title}</h4>
                      <p className="analysis-info-popup-description">{categoryDescriptions.versatility.description}</p>
                      <p className="analysis-info-popup-ranking"><strong>Ranking:</strong> {categoryDescriptions.versatility.ranking}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="analysis-category-summary">
                {typedSummaries.versatility}
                {typedSummaries.versatility.length < summaryTexts.versatility.length && <span className="typing-cursor">|</span>}
              </div>
              <button 
                className="analysis-category-expand-btn"
                onClick={() => toggleCategory('versatility')}
              >
                {expandedCategories.versatility ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              {expandedCategories.versatility && (() => {
                const archetypes = getSubcategories('versatility')
                if (!archetypes) return null
                return (
                  <div className="analysis-category-subcategories">
                    {Object.entries(archetypes).map(([archetypeName, archetypeData]) => {
                      const score = archetypeData.Score !== undefined ? parseFloat(archetypeData.Score) : null
                      const letterGrade = score !== null ? scoreToLetterGrade(score) : null
                      return (
                      <div key={archetypeName} className="analysis-subcategory-item">
                        <h4 className="analysis-subcategory-title">
                          {getArchetypeIcon(archetypeName)}
                          {cleanArchetypeName(archetypeName)}
                          {letterGrade && (
                            <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(letterGrade)}`}> {letterGrade}</span>
                          )}
                        </h4>
                        {archetypeData.Description && (() => {
                          const key = `versatility-${archetypeName}`
                          const typedText = typedSubcategorySummaries[key] || ''
                          const fullText = archetypeData.Description
                          return (
                            <div className="analysis-subcategory-summary">
                              {typedText}
                              {typedText.length < fullText.length && <span className="typing-cursor">|</span>}
                            </div>
                          )
                        })()}
                      </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
          <div className="analysis-grid-item analysis-optimizations-grid-item">
            <h3 className="analysis-grid-item-title">
              <OptimizationsIcon size={20} className="optimizations-icon" />
              Optimizations
            </h3>
            {!optimizationsLoaded && (
              <>
                <div className="analysis-category-summary">
                  Get personalized recommendations to improve your deck's performance. Our AI analyzes your current deck and suggests card swaps, elixir adjustments, and strategic improvements based on the current meta.
                </div>
                <div className="analysis-optimize-button-container">
                  <button 
                    className="analysis-load-optimizations-btn"
                    onClick={handleLoadOptimizations}
                    disabled={showOptimizeLoading}
                  >
                    Optimize
                  </button>
                </div>
              </>
            )}
            {optimizationsLoaded && (
              <div className="analysis-optimizations-subsections">
                <div className="analysis-optimization-subsection">
                  <h4 className="analysis-optimization-subsection-title">
                    <CardSwapsIcon size={18} className="optimization-subsection-icon" />
                    Recommended Card Swaps
                  </h4>
                  {optimizationResults && optimizationResults.Optimize && optimizationResults.Optimize['Recommended Swaps'] && optimizationResults.Optimize['Recommended Swaps'].Swaps && optimizationResults.Optimize['Recommended Swaps'].Swaps.length > 0 && (
                    <div className="analysis-card-swaps-infographic">
                      <div className="analysis-card-swap-row">
                        <div className="analysis-card-swap-row-label analysis-card-swap-label-out">- Out</div>
                        <div className="analysis-card-swap-cards">
                          {optimizationResults.Optimize['Recommended Swaps'].Swaps.map((swap, index) => (
                            <div key={index} className="analysis-card-swap-card-wrapper">
                              <img
                                src={getCardImageUrl(swap['Replaced Card'])}
                                alt={swap['Replaced Card']}
                                className="analysis-card-swap-image"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="analysis-card-swap-arrow-large">↓</div>
                      <div className="analysis-card-swap-row">
                        <div className="analysis-card-swap-row-label analysis-card-swap-label-in">+ In</div>
                        <div className="analysis-card-swap-cards">
                          {optimizationResults.Optimize['Recommended Swaps'].Swaps.map((swap, index) => (
                            <div key={index} className="analysis-card-swap-card-wrapper">
                              <img
                                src={getCardImageUrl(swap['New Card'])}
                                alt={swap['New Card']}
                                className="analysis-card-swap-image"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {optimizationResults && optimizationResults.Optimize && optimizationResults.Optimize['Recommended Swaps'] && optimizationResults.Optimize['Recommended Swaps'].Swaps && optimizationResults.Optimize['Recommended Swaps'].Swaps.length > 0 && (() => {
                    // Get original values
                    const originalElixir = deck.elixirCost || 0
                    const originalCycle = deck.cycle || 0
                    
                    // Calculate new deck after swaps
                    const currentCards = [...(deck.cardNames || [])]
                    const swaps = optimizationResults.Optimize['Recommended Swaps'].Swaps
                    const newCards = currentCards.map(card => {
                      const swap = swaps.find(s => s['Replaced Card'] === card)
                      return swap ? swap['New Card'] : card
                    })
                    
                    // Build card elixir map from allCards
                    const cardElixirMap = {}
                    if (allCards && allCards.length > 0) {
                      allCards.forEach(card => {
                        const cardName = card.card_name?.trim()
                        const elixirCost = parseFloat(card.elixer_cost) || 0
                        if (cardName) {
                          cardElixirMap[cardName] = elixirCost
                        }
                      })
                    }
                    
                    // Calculate average elixir cost
                    const costs = newCards
                      .map(name => cardElixirMap[name] || 0)
                      .filter(cost => cost > 0)
                    const averageElixir = costs.length > 0 
                      ? Math.round((costs.reduce((acc, cost) => acc + cost, 0) / costs.length) * 10) / 10
                      : 0
                    
                    // Calculate four-card cycle (sum of 4 cheapest cards)
                    const cycleCosts = newCards
                      .map(name => cardElixirMap[name] || 0)
                      .filter(cost => cost > 0)
                      .sort((a, b) => a - b)
                      .slice(0, 4)
                    const fourCardCycle = cycleCosts.length > 0
                      ? Math.round(cycleCosts.reduce((acc, cost) => acc + cost, 0) * 10) / 10
                      : 0
                    
                    // Compare and determine color/symbol for elixir
                    const elixirDiff = averageElixir - originalElixir
                    let elixirColor = ''
                    let elixirSymbol = ''
                    if (Math.abs(elixirDiff) < 0.01) {
                      elixirColor = 'yellow'
                      elixirSymbol = '-'
                    } else if (elixirDiff > 0) {
                      elixirColor = 'red'
                      elixirSymbol = '↑'
                    } else {
                      elixirColor = 'green'
                      elixirSymbol = '↓'
                    }
                    
                    // Compare and determine color/symbol for cycle
                    const cycleDiff = fourCardCycle - originalCycle
                    let cycleColor = ''
                    let cycleSymbol = ''
                    if (Math.abs(cycleDiff) < 0.01) {
                      cycleColor = 'yellow'
                      cycleSymbol = '-'
                    } else if (cycleDiff > 0) {
                      cycleColor = 'red'
                      cycleSymbol = '↑'
                    } else {
                      cycleColor = 'green'
                      cycleSymbol = '↓'
                    }
                    
                    return (
                      <div className="analysis-swap-stats">
                        <div className="analysis-stat-item">
                          <img src={ElixirIcon} alt="Elixir" className="analysis-stat-icon" />
                          <span className="analysis-stat-label">Average Elixir Cost:</span>
                          <span className={`analysis-stat-value analysis-stat-value-${elixirColor}`}>
                            {typeof averageElixir === 'number' ? averageElixir.toFixed(1) : parseFloat(averageElixir || 0).toFixed(1)} <span className={`analysis-stat-symbol analysis-stat-symbol-${elixirColor}`}>{elixirSymbol}</span>
                          </span>
                        </div>
                        <div className="analysis-stat-item">
                          <img src={CycleIcon} alt="Cycle" className="analysis-stat-icon" />
                          <span className="analysis-stat-label">4-Card Cycle Speed:</span>
                          <span className={`analysis-stat-value analysis-stat-value-${cycleColor}`}>
                            {fourCardCycle} <span className={`analysis-stat-symbol analysis-stat-symbol-${cycleColor}`}>{cycleSymbol}</span>
                          </span>
                        </div>
                      </div>
                    )
                  })()}
                  <div className="analysis-optimization-content">
                    {typedOptimizations.cardSwaps}
                    {typedOptimizations.cardSwaps.length < optimizationTexts.cardSwaps.length && <span className="typing-cursor">|</span>}
                  </div>
                </div>
                <div className="analysis-optimization-subsection">
                  <h4 className="analysis-optimization-subsection-title">
                    <TowerTroopIcon size={18} className="optimization-subsection-icon" />
                    Recommended Tower Troop
                  </h4>
                  {optimizationResults && optimizationResults.Optimize && optimizationResults.Optimize['Recommended Tower Troop'] && optimizationResults.Optimize['Recommended Tower Troop']['Tower Troop'] && (
                    <div className="analysis-subcategory-cards">
                      <img
                        src={getCardImageUrl(optimizationResults.Optimize['Recommended Tower Troop']['Tower Troop'])}
                        alt={optimizationResults.Optimize['Recommended Tower Troop']['Tower Troop']}
                        className="analysis-subcategory-card-image"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  <div className="analysis-optimization-content">
                    {typedOptimizations.towerTroop}
                    {typedOptimizations.towerTroop.length < optimizationTexts.towerTroop.length && <span className="typing-cursor">|</span>}
                  </div>
                </div>
                <div className="analysis-optimization-subsection">
                  <h4 className="analysis-optimization-subsection-title">
                    <EvolutionsIcon size={18} className="optimization-subsection-icon" />
                    Recommended Evolutions
                  </h4>
                  {optimizationResults && optimizationResults.Optimize && optimizationResults.Optimize['Recommended Evolutions'] && optimizationResults.Optimize['Recommended Evolutions'].Evolutions && optimizationResults.Optimize['Recommended Evolutions'].Evolutions.length > 0 && (
                    <div className="analysis-subcategory-cards">
                      {optimizationResults.Optimize['Recommended Evolutions'].Evolutions.map((evo, index) => (
                        <img
                          key={index}
                          src={getCardEvolutionImageUrl(evo.Evolution)}
                          alt={evo.Evolution}
                          className="analysis-subcategory-card-image"
                          onError={(e) => {
                            // Fallback to normal card image if evolution image fails
                            e.target.src = getCardImageUrl(evo.Evolution)
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <div className="analysis-optimization-content">
                    {typedOptimizations.evolutions}
                    {typedOptimizations.evolutions.length < optimizationTexts.evolutions.length && <span className="typing-cursor">|</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default AnalysisView

