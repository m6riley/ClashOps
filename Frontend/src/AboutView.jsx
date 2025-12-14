import React, { useEffect, useRef, useState, useMemo } from 'react'
import './AboutView.css'
import Swords from './Swords'
import { getCardImageUrl } from './cardUtils'

function AboutView({ decks = [] }) {
  const [visibleSections, setVisibleSections] = useState(new Set(['intro']))
  const sectionRefs = useRef({})
  const [currentCardSet, setCurrentCardSet] = useState(0)
  const [animationKey, setAnimationKey] = useState(0)

  // Extract card sets from top decks
  const cardSets = useMemo(() => {
    if (!decks || decks.length === 0) {
      // Fallback to default cards if no decks available
      return [
        ['Hog Rider', 'Mega Knight', 'Wizard', 'Valkyrie', 'Musketeer', 'Knight', 'Archers', 'Giant'],
        ['P.E.K.K.A', 'Electro Wizard', 'Ice Wizard', 'Princess', 'Bandit', 'Royal Ghost', 'Miner', 'Lumberjack'],
        ['Golem', 'Lava Hound', 'Giant Skeleton', 'Sparky', 'Inferno Dragon', 'Electro Dragon', 'Baby Dragon', 'Mega Minion']
      ]
    }

    // Get top decks (sorted by score if available, or just take first 5)
    const topDecks = [...decks]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5)

    // Extract card names from each deck
    const sets = topDecks.map(deck => {
      if (deck.cardNames && deck.cardNames.length > 0) {
        return deck.cardNames.slice(0, 8) // Take up to 8 cards per deck
      }
      return []
    }).filter(set => set.length > 0) // Remove empty sets

    // If we have sets, return them; otherwise use fallback
    return sets.length > 0 ? sets : [
      ['Hog Rider', 'Mega Knight', 'Wizard', 'Valkyrie', 'Musketeer', 'Knight', 'Archers', 'Giant']
    ]
  }, [decks])

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-10% 0px -10% 0px',
      threshold: 0.1
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleSections((prev) => new Set([...prev, entry.target.dataset.section]))
        }
      })
    }, observerOptions)

    // Observe all sections after a short delay to ensure refs are set
    const timeoutId = setTimeout(() => {
      Object.values(sectionRefs.current).forEach((ref) => {
        if (ref) {
          observer.observe(ref)
          // Immediately mark as visible if already in viewport
          const rect = ref.getBoundingClientRect()
          const isVisible = rect.top < window.innerHeight && rect.bottom > 0
          if (isVisible) {
            setVisibleSections((prev) => new Set([...prev, ref.dataset.section]))
          }
        }
      })
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      Object.values(sectionRefs.current).forEach((ref) => {
        if (ref) observer.unobserve(ref)
      })
    }
  }, [])

  const setSectionRef = (sectionId, element) => {
    if (element) {
      sectionRefs.current[sectionId] = element
      element.dataset.section = sectionId
    }
  }


  // Cycle through card sets when deck catalog section is visible
  useEffect(() => {
    if (!visibleSections.has('deck-catalog') || cardSets.length === 0) return

    // Calculate total animation time: 
    // - Last card delay: (cardCount - 1) * 0.3s
    // - Animation duration: 0.8s
    // - Display time: 2.2s
    // - Fade out: 0.4s
    const currentSet = cardSets[currentCardSet]
    if (!currentSet || currentSet.length === 0) return
    
    const cardCount = currentSet.length
    const lastCardDelay = (cardCount - 1) * 0.3
    const cycleDuration = lastCardDelay + 0.8 + 2.2 + 0.4 + 0.3 // +0.3s pause before next cycle
    
    const timeoutId = setTimeout(() => {
      setCurrentCardSet((prev) => (prev + 1) % cardSets.length)
      setAnimationKey((prev) => prev + 1) // Force re-render to restart animation
    }, cycleDuration * 1000)

    return () => clearTimeout(timeoutId)
  }, [visibleSections, currentCardSet, cardSets])

  return (
    <div className="about-view">
      <div className="page-title-container about-hero">
        <div className="title-section">
          <h1 className="page-title about-title-main">About ClashOps</h1>
          <p className="page-description about-description-main">
            Your ultimate companion for Clash Royale deck management and analysis.
          </p>
        </div>
      </div>

      <div className="about-content">
        <section 
          className={`about-section ${visibleSections.has('intro') ? 'visible' : ''}`}
          ref={(el) => setSectionRef('intro', el)}
        >
          <h2 className="about-section-title">What is ClashOps?</h2>
          <p className="about-text">
            ClashOps is a comprehensive platform designed to help Clash Royale players discover, 
            analyze, and manage their decks. Whether you're looking for the latest meta decks, 
            want to analyze your deck's strengths and weaknesses, or need to organize your 
            favorite decks, ClashOps has you covered.
          </p>
        </section>

        <section 
          className={`about-section deck-catalog-section ${visibleSections.has('deck-catalog') ? 'visible' : ''}`}
          ref={(el) => setSectionRef('deck-catalog', el)}
        >
          <div className="deck-catalog-content">
            <div className="deck-catalog-text">
              <h2 className="about-section-title">Deck Catalog</h2>
              <p className="about-text">
                Browse through a curated collection of top-performing decks, refreshed every season 
                to keep you up-to-date with the latest meta. Discover new strategies, explore different 
                playstyles, and find the perfect deck for your gameplay. Each deck in our catalog is 
                carefully selected based on performance metrics and community feedback, ensuring you 
                have access to the most effective strategies in Clash Royale.
              </p>
            </div>
            <div className="deck-fall-animation" key={animationKey}>
              <div className="deck-stack">
                <div className="deck-stack-card deck-stack-card-1"></div>
                <div className="deck-stack-card deck-stack-card-2"></div>
                <div className="deck-stack-card deck-stack-card-3"></div>
              </div>
              <div className="falling-cards">
                {cardSets.length > 0 && cardSets[currentCardSet] && cardSets[currentCardSet].map((cardName, index) => (
                  <div
                    key={`${cardName}-${animationKey}`}
                    className="falling-card"
                    style={{
                      '--index': index,
                      '--delay': `${index * 0.3}s`
                    }}
                  >
                    <img
                      src={getCardImageUrl(cardName)}
                      alt={cardName}
                      className="falling-card-image"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section 
          className={`about-section analysis-optimization-section ${visibleSections.has('analysis-optimization') ? 'visible' : ''}`}
          ref={(el) => setSectionRef('analysis-optimization', el)}
        >
          <h2 className="about-section-title">Analysis and Optimization</h2>
          <p className="about-text">
            Get AI-powered insights into your deck's performance, strengths, and potential improvements. 
            Our advanced analysis tools evaluate your deck across multiple dimensions including offense, 
            defense, synergy, and versatility. Receive detailed recommendations for card swaps, tower 
            troop suggestions, and evolution strategies to optimize your deck for maximum effectiveness.
          </p>
        </section>

        <section 
          className={`about-section ${visibleSections.has('get-started') ? 'visible' : ''}`}
          ref={(el) => setSectionRef('get-started', el)}
        >
          <h2 className="about-section-title">Get Started</h2>
          <p className="about-text">
            Ready to take your Clash Royale experience to the next level? Start by exploring the 
            Deck Catalog to discover new strategies, or create an account to save your favorite 
            decks and unlock advanced features.
          </p>
        </section>
      </div>

      <div 
        className={`credits-section ${visibleSections.has('credits') ? 'visible' : ''}`}
        ref={(el) => setSectionRef('credits', el)}
      >
        <h2 className="credits-title">Credits</h2>
        <div className="credits-profiles">
          <div className={`credit-profile ${visibleSections.has('credits') ? 'visible' : ''}`}>
            <div className="profile-picture-placeholder">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="40" fill="rgba(255, 255, 255, 0.1)"/>
                <circle cx="40" cy="30" r="12" fill="rgba(255, 255, 255, 0.3)"/>
                <path d="M20 65 Q20 50 40 50 Q60 50 60 65" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="8" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="profile-name">Matthew Riley</div>
            <div className="profile-role">Full-stack</div>
            <div className="profile-university">University of Waterloo</div>
          </div>
          <div className={`credit-profile ${visibleSections.has('credits') ? 'visible' : ''}`}>
            <div className="profile-picture-placeholder">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="40" fill="rgba(255, 255, 255, 0.1)"/>
                <circle cx="40" cy="30" r="12" fill="rgba(255, 255, 255, 0.3)"/>
                <path d="M20 65 Q20 50 40 50 Q60 50 60 65" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="8" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="profile-name">Matther Palmer</div>
            <div className="profile-role">Frontend</div>
            <div className="profile-university">University of British Columbia</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutView
