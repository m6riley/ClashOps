import React, { useEffect, useRef, useState } from 'react'
import './AboutView.css'
import Swords from './Swords'

function AboutView({ decks = [] }) {
  const [visibleSections, setVisibleSections] = useState(new Set(['intro']))
  const [expandedTool, setExpandedTool] = useState(null)
  const sectionRefs = useRef({})

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

  return (
    <div className="about-view">
      <div className="page-title-container about-hero">
        <div className="title-section">
          <h1 className="page-title about-title-main">About ClashOps</h1>
          <p className="page-description about-description-main">
            The ultimate, AI-driven Clash Royale assistant.
          </p>
        </div>
      </div>

      <div className="about-content">
        <section 
          className={`about-section ${visibleSections.has('intro') ? 'visible' : ''}`}
          ref={(el) => setSectionRef('intro', el)}
        >
          <p className="about-text">
            ClashOps is a comprehensive platform enabling Clash Royale players to discover, organize, analyze and optimize top decks for the arena.
          </p>
          <p className="about-text">
            Whether you're a seasoned veteran looking to refine your strategy or a newcomer seeking guidance on building your first competitive deck, ClashOps provides the tools and insights you need to dominate the battlefield. Our platform combines cutting-edge artificial intelligence with deep game knowledge to deliver personalized recommendations, detailed performance metrics, and strategic optimizations tailored to your unique playstyle.
          </p>
          <p className="about-text">
            ClashOps is brand new, built from the ground up with modern technology and a passion for helping players reach their full potential. We're constantly evolving, adding new features, and refining our algorithms to ensure you always have access to the most up-to-date strategies and insights in the ever-changing meta of Clash Royale.
          </p>
        </section>

        <section 
          className={`about-section features-section ${visibleSections.has('features') ? 'visible' : ''}`}
          ref={(el) => setSectionRef('features', el)}
        >
          <h2 className="about-section-title">Features</h2>
          
          <div className="features-subsection">
            <h3 className="feature-subsection-title">Deck Catalog</h3>
            <p className="about-text">
              Browse through an extensive collection of top-performing decks from the Clash Royale meta. 
              Filter decks by archetype, elixir cost, card types, and more to find the perfect strategy 
              that matches your playstyle.
            </p>
          </div>

          <div className="features-subsection">
            <h3 className="feature-subsection-title">Favourite Decks</h3>
            <p className="about-text">
              Save and organize your favorite decks in personalized collections. Create custom categories 
              to group decks by strategy, game mode, or any system that works for you. Quickly access 
              your saved decks anytime, share them with friends, and track your performance across 
              different builds. Your deck library is always at your fingertips.
            </p>
          </div>

          <div className="features-subsection analysis-optimization-subsection">
            <h3 className="feature-subsection-title">Analysis and Optimization</h3>
            <p className="about-text">
              Get AI-powered insights into your deck's performance, strengths, and potential improvements. 
              Our advanced analysis tools evaluate your deck across multiple dimensions including offense, 
              defense, synergy, and versatility. Receive detailed recommendations for card swaps, tower 
              troop suggestions, and evolution strategies to optimize your deck for maximum effectiveness.
            </p>
          </div>
        </section>

        <section 
          className={`about-section vision-section ${visibleSections.has('vision') ? 'visible' : ''}`}
          ref={(el) => setSectionRef('vision', el)}
        >
          <h2 className="about-section-title">Vision</h2>
          <p className="about-text">
            ClashOps plans to evolve into a comprehensive suite of tools designed to elevate every aspect of your Clash Royale experience.
          </p>
          
          <div className="roadmap-infographic">
            <div className="roadmap-sections-grid">
              <div className="roadmap-section-card">
                <h3 className="roadmap-section-title">Deck Catalog</h3>
                <p className="roadmap-section-description">Browse through an extensive collection of top-performing decks from the Clash Royale meta. Filter decks by archetype, elixir cost, card types, and more to find the perfect strategy that matches your playstyle.</p>
                
                <div className="roadmap-features-list">
                  <div className="roadmap-feature-item roadmap-feature-complete">
                    <div className="roadmap-feature-icon">✓</div>
                    <div className="roadmap-feature-content">
                      <span className="roadmap-feature-label">Complete</span>
                      <span className="roadmap-feature-text">Popular decks refreshed every season</span>
                    </div>
                  </div>
                  
                  <div className="roadmap-feature-item roadmap-feature-complete">
                    <div className="roadmap-feature-icon">✓</div>
                    <div className="roadmap-feature-content">
                      <span className="roadmap-feature-label">Complete</span>
                      <span className="roadmap-feature-text">Filtering options</span>
                    </div>
                  </div>
                  
                  <div className="roadmap-feature-item roadmap-feature-coming-soon">
                    <div className="roadmap-feature-icon">→</div>
                    <div className="roadmap-feature-content">
                      <span className="roadmap-feature-label">PLANNED</span>
                      <span className="roadmap-feature-text">Deck recommendations based on card level and player skill</span>
                    </div>
                  </div>
                  
                  <div className="roadmap-feature-item roadmap-feature-coming-soon">
                    <div className="roadmap-feature-icon">→</div>
                    <div className="roadmap-feature-content">
                      <span className="roadmap-feature-label">PLANNED</span>
                      <span className="roadmap-feature-text">Deck recommendations for various gamemodes, 2v2 and duel decks</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="roadmap-section-card roadmap-section-analysis">
                <h3 className="roadmap-section-title roadmap-section-title-gradient">Analysis and Optimization</h3>
                <p className="roadmap-section-description">Get AI-powered insights into your deck's performance, strengths, and potential improvements. Our advanced analysis tools evaluate your deck across multiple dimensions including offense, defense, synergy, and versatility.</p>
                
                <div className="roadmap-features-list">
                  <div className="roadmap-feature-item roadmap-feature-complete">
                    <div className="roadmap-feature-icon">✓</div>
                    <div className="roadmap-feature-content">
                      <span className="roadmap-feature-label">Complete</span>
                      <span className="roadmap-feature-text">Deck analysis across four fundamental categories</span>
                    </div>
                  </div>
                  
                  <div className="roadmap-feature-item roadmap-feature-complete">
                    <div className="roadmap-feature-icon">✓</div>
                    <div className="roadmap-feature-content">
                      <span className="roadmap-feature-label">Complete</span>
                      <span className="roadmap-feature-text">Recommendations for card swaps, tower troops, and evolutions</span>
                    </div>
                  </div>
                  
                  <div className="roadmap-feature-item roadmap-feature-coming-soon">
                    <div className="roadmap-feature-icon">→</div>
                    <div className="roadmap-feature-content">
                      <span className="roadmap-feature-label">PLANNED</span>
                      <span className="roadmap-feature-text">Enhanced elixir and cycle insights including cycle efficiency and potential dead hands</span>
                    </div>
                  </div>
                  
                  <div className="roadmap-feature-item roadmap-feature-coming-soon">
                    <div className="roadmap-feature-icon">→</div>
                    <div className="roadmap-feature-content">
                      <span className="roadmap-feature-label">PLANNED</span>
                      <span className="roadmap-feature-text">Archetype estimation affecting analysis scoring criteria</span>
                    </div>
                  </div>
                  
                  <div className="roadmap-feature-item roadmap-feature-coming-soon">
                    <div className="roadmap-feature-icon">→</div>
                    <div className="roadmap-feature-content">
                      <span className="roadmap-feature-label">PLANNED</span>
                      <span className="roadmap-feature-text">Recommended heroes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="roadmap-new-features">
              <h3 className="roadmap-section-title">New Tools</h3>
              <ul className="roadmap-new-tools-list">
                <li 
                  className={`roadmap-new-tools-item roadmap-new-tools-gold ${expandedTool === 'player-progress' ? 'expanded' : ''}`}
                  onClick={() => setExpandedTool(expandedTool === 'player-progress' ? null : 'player-progress')}
                >
                  <span className="roadmap-new-tools-item-content">
                    <span className="roadmap-new-tools-arrow">→</span>
                    <span className="roadmap-new-tools-text">Player Progress Dashboard</span>
                  </span>
                  {expandedTool === 'player-progress' && (
                    <div className="roadmap-new-tools-expanded">
                      <p className="roadmap-new-tools-description">
                        Track your Clash Royale journey with comprehensive statistics, win rates, trophy progression, and detailed performance metrics across all game modes.
                      </p>
                    </div>
                  )}
                </li>
                <li 
                  className={`roadmap-new-tools-item roadmap-new-tools-diamond ${expandedTool === 'matchup-guidance' ? 'expanded' : ''}`}
                  onClick={() => setExpandedTool(expandedTool === 'matchup-guidance' ? null : 'matchup-guidance')}
                >
                  <span className="roadmap-new-tools-item-content">
                    <span className="roadmap-new-tools-arrow">→</span>
                    <span className="roadmap-new-tools-text">Matchup Predictor and Guidance</span>
                  </span>
                  {expandedTool === 'matchup-guidance' && (
                    <div className="roadmap-new-tools-expanded">
                      <p className="roadmap-new-tools-description">
                        Predict match outcomes and analyze deck matchups before battles. Get AI-powered insights on win probability and strategic recommendations based on deck compositions. Receive personalized strategic guidance and tips tailored to your playstyle.
                      </p>
                    </div>
                  )}
                </li>
                <li 
                  className={`roadmap-new-tools-item roadmap-new-tools-diamond ${expandedTool === 'replay-annotation' ? 'expanded' : ''}`}
                  onClick={() => setExpandedTool(expandedTool === 'replay-annotation' ? null : 'replay-annotation')}
                >
                  <span className="roadmap-new-tools-item-content">
                    <span className="roadmap-new-tools-arrow">→</span>
                    <span className="roadmap-new-tools-text">Replay Annotation Tool with AI Suggestions</span>
                  </span>
                  {expandedTool === 'replay-annotation' && (
                    <div className="roadmap-new-tools-expanded">
                      <p className="roadmap-new-tools-description">
                        Annotate and analyze battle replays with detailed notes, timestamps, and strategic insights. Mark key moments, mistakes, and opportunities to improve your gameplay.
                      </p>
                    </div>
                  )}
                </li>
                <li 
                  className={`roadmap-new-tools-item roadmap-new-tools-diamond ${expandedTool === 'card-levelup' ? 'expanded' : ''}`}
                  onClick={() => setExpandedTool(expandedTool === 'card-levelup' ? null : 'card-levelup')}
                >
                  <span className="roadmap-new-tools-item-content">
                    <span className="roadmap-new-tools-arrow">→</span>
                    <span className="roadmap-new-tools-text">Card Level-up Recommendations</span>
                  </span>
                  {expandedTool === 'card-levelup' && (
                    <div className="roadmap-new-tools-expanded">
                      <p className="roadmap-new-tools-description">
                        Get intelligent recommendations on which cards to prioritize for leveling up based on your deck preferences, meta trends, and resource optimization strategies.
                      </p>
                    </div>
                  )}
                </li>
                <li 
                  className={`roadmap-new-tools-item roadmap-new-tools-red-blue ${expandedTool === 'clashops-dojo' ? 'expanded' : ''}`}
                  onClick={() => setExpandedTool(expandedTool === 'clashops-dojo' ? null : 'clashops-dojo')}
                >
                  <span className="roadmap-new-tools-item-content">
                    <span className="roadmap-new-tools-arrow">→</span>
                    <span className="roadmap-new-tools-text">ClashOps Dojo</span>
                  </span>
                  {expandedTool === 'clashops-dojo' && (
                    <div className="roadmap-new-tools-expanded">
                      <p className="roadmap-new-tools-description">
                        Master the art of Clash Royale with comprehensive training modules, interactive tutorials, and skill-building exercises designed to elevate your gameplay to the next level.
                      </p>
                    </div>
                  )}
                </li>
              </ul>
            </div>
          </div>
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
