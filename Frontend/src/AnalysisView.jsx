import React, { useMemo, useState, useEffect } from 'react'
import './AnalysisView.css'
import { getCardImageUrl, getCardEvolutionImageUrl, getCardHeroImageUrl } from './cardUtils'
import ElixirIcon from './assets/Elixir.svg'
import CycleIcon from './assets/Cycle.svg'
import OptimizeLoading from './OptimizeLoading'

function AnalysisView({ deck, onClose, allCards }) {
  const [expandedCategories, setExpandedCategories] = useState({
    offense: false,
    defense: false,
    synergy: false,
    versatility: false
  })
  
  const [optimizationsLoaded, setOptimizationsLoaded] = useState(false)
  const [showOptimizeLoading, setShowOptimizeLoading] = useState(false)
  
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
  
  const [typedOptimizations, setTypedOptimizations] = useState({
    cardSwaps: '',
    towerTroop: '',
    evolutions: ''
  })
  
  // Define the summary texts
  const summaryTexts = {
    offense: '✅ Fast 2.6 cycle enables constant Hog Rider pressure supported by cheap utilities.\n❗ One-dimensional offense; can stall out vs multiple buildings and Tornado.\n💡 Outcycle building counters and convert spell value into safe tower damage in double elixir.',
    defense: '✅ Strong defensive core with multiple building options and area control spells.\n❗ Vulnerable to heavy beatdown pushes and lacks reliable air defense.\n💡 Use buildings to distract and cycle back to defensive cards quickly.',
    synergy: '✅ Cards work well together with complementary roles and elixir efficiency.\n❗ Some cards may conflict in certain matchups or situations.\n💡 Maximize card interactions by timing plays and managing elixir carefully.',
    versatility: '✅ Deck can adapt to various playstyles and meta matchups effectively.\n❗ Limited flexibility in certain game modes or against specific archetypes.\n💡 Adjust playstyle based on opponent\'s deck and adapt strategy throughout the match.'
  }
  
  // Define the optimization texts
  const optimizationTexts = {
    cardSwaps: '💡 Consider replacing [Card A] with [Card B] for better synergy with your win condition.\n⚡ This swap improves your cycle speed by 0.3 elixir while maintaining defensive capabilities.',
    towerTroop: '🏰 Recommended: [Tower Troop Name]\n📊 This tower troop complements your deck\'s playstyle and provides strong defensive value against common meta threats.',
    evolutions: '✨ Recommended Evolution: [Evolution Name]\n🎯 This evolution enhances your deck\'s offensive potential and works well with your current card combinations.'
  }
  
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }
  
  const handleLoadOptimizations = () => {
    setShowOptimizeLoading(true)
  }
  
  const handleOptimizeComplete = () => {
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
  
  // Generate random scores for demonstration (0-5 scale, with decimals for + and - variants)
  const randomScores = useMemo(() => ({
    offense: Math.random() * 5, // 0-5 with decimals
    defense: Math.random() * 5, // 0-5 with decimals
    synergy: Math.random() * 5, // 0-5 with decimals
    versatility: Math.random() * 5 // 0-5 with decimals
  }), [])
  
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  // Type out summaries with typing animation (in parallel)
  useEffect(() => {
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
  }, [])
  
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
          }}
          onComplete={handleOptimizeComplete}
        />
      )}
      <div className="analysis-view">
      <div className="analysis-header-section">
        <div className="page-title-container">
          <div className="title-section">
            <h1 className="page-title">Deck Analysis</h1>
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
                    <span className="analysis-stat-value">{deck.elixirCost || 0}</span>
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
                  <span className="analysis-score-label analysis-score-label-overall">Overall Score <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(overallScoreToLetterGrade(overallScore))}`}>{overallScoreToLetterGrade(overallScore)}</span></span>
                </div>
                <div className="analysis-score-item">
                  <div className="analysis-score-item-content">
                    <span className="analysis-score-label">Offense <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(scoreToLetterGrade(randomScores.offense))}`}>{scoreToLetterGrade(randomScores.offense)}</span></span>
                    <div className="analysis-progress-bar">
                      <div className="analysis-progress-bar-fill" style={{ width: `${scoreToPercentage(animatedScores.offense)}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="analysis-score-item">
                  <div className="analysis-score-item-content">
                    <span className="analysis-score-label">Defense <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(scoreToLetterGrade(randomScores.defense))}`}>{scoreToLetterGrade(randomScores.defense)}</span></span>
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
                    <span className="analysis-score-label">Synergy <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(scoreToLetterGrade(randomScores.synergy))}`}>{scoreToLetterGrade(randomScores.synergy)}</span></span>
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
                    <span className="analysis-score-label">Versatility <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(scoreToLetterGrade(randomScores.versatility))}`}>{scoreToLetterGrade(randomScores.versatility)}</span></span>
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
              <h3 className="analysis-grid-item-title">Offense <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(scoreToLetterGrade(randomScores.offense))}`}>{scoreToLetterGrade(randomScores.offense)}</span></h3>
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
              {expandedCategories.offense && (
                <div className="analysis-category-subcategories">
                  {/* Subcategories will go here */}
                </div>
              )}
            </div>
            <div className="analysis-grid-item">
              <h3 className="analysis-grid-item-title">Defense <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(scoreToLetterGrade(randomScores.defense))}`}>{scoreToLetterGrade(randomScores.defense)}</span></h3>
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
              {expandedCategories.defense && (
                <div className="analysis-category-subcategories">
                  {/* Subcategories will go here */}
                </div>
              )}
            </div>
            <div className="analysis-grid-item">
              <h3 className="analysis-grid-item-title">Synergy <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(scoreToLetterGrade(randomScores.synergy))}`}>{scoreToLetterGrade(randomScores.synergy)}</span></h3>
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
              {expandedCategories.synergy && (
                <div className="analysis-category-subcategories">
                  {/* Subcategories will go here */}
                </div>
              )}
            </div>
            <div className="analysis-grid-item">
              <h3 className="analysis-grid-item-title">Versatility <span className={`analysis-score-value-inline analysis-grade-${gradeToClassName(scoreToLetterGrade(randomScores.versatility))}`}>{scoreToLetterGrade(randomScores.versatility)}</span></h3>
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
              {expandedCategories.versatility && (
                <div className="analysis-category-subcategories">
                  {/* Subcategories will go here */}
                </div>
              )}
            </div>
          </div>
          <div className="analysis-grid-item analysis-optimizations-grid-item">
            <h3 className="analysis-grid-item-title">Optimizations</h3>
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
                  <h4 className="analysis-optimization-subsection-title">Recommended Card Swaps</h4>
                  <div className="analysis-optimization-content">
                    {typedOptimizations.cardSwaps}
                    {typedOptimizations.cardSwaps.length < optimizationTexts.cardSwaps.length && <span className="typing-cursor">|</span>}
                  </div>
                </div>
                <div className="analysis-optimization-subsection">
                  <h4 className="analysis-optimization-subsection-title">Recommended Tower Troop</h4>
                  <div className="analysis-optimization-content">
                    {typedOptimizations.towerTroop}
                    {typedOptimizations.towerTroop.length < optimizationTexts.towerTroop.length && <span className="typing-cursor">|</span>}
                  </div>
                </div>
                <div className="analysis-optimization-subsection">
                  <h4 className="analysis-optimization-subsection-title">Recommended Evolutions</h4>
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

