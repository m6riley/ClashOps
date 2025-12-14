import React, { useState, useEffect } from 'react'
import './AnalyzeLoading.css'
import { getAnalyzeDeckUrl, getCreateReportUrl } from './config'

function AnalyzeLoading({ deck, onClose, onComplete }) {
  const [progress, setProgress] = useState(0)
  const [completedCategories, setCompletedCategories] = useState({
    offense: false,
    defense: false,
    synergy: false,
    versatility: false
  })
  const [analysisResults, setAnalysisResults] = useState({
    offense: null,
    defense: null,
    synergy: null,
    versatility: null
  })

  // Format deck as comma-separated string
  const formatDeckString = (deck) => {
    if (!deck || !deck.cardNames || deck.cardNames.length === 0) {
      return ''
    }
    // Format as "[Card1, Card2, Card3, ...]"
    return `[${deck.cardNames.join(', ')}]`
  }

  useEffect(() => {
    if (!deck) return

    const deckString = formatDeckString(deck)
    if (!deckString) {
      console.error('Invalid deck format', deck)
      return
    }

    console.log('Analyzing deck:', {
      deckId: deck.id,
      cardNames: deck.cardNames,
      deckString: deckString
    })

    const categories = ['offense', 'defense', 'synergy', 'versatility']
    const analyzeFunctionUrl = getAnalyzeDeckUrl()
    const createReportUrl = getCreateReportUrl()

    // First, ensure the report exists by calling create_report
    // This is idempotent - if report already exists, it just returns success
    const createReport = async () => {
      try {
        const createResponse = await fetch(createReportUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deck: deckString
          })
        })

        if (!createResponse.ok) {
          const errorText = await createResponse.text()
          console.error(`Failed to create report: ${createResponse.status} ${errorText}`)
          // Continue anyway - maybe report already exists
        } else {
          console.log('Report created/verified for deck:', deckString)
        }
      } catch (error) {
        console.error('Error creating report:', error)
        // Continue anyway - maybe report already exists
      }
    }

    // Create report first, then analyze
    createReport().then(() => {

      // Make all 4 API calls asynchronously
      const promises = categories.map(async (category) => {
      try {
        const response = await fetch(analyzeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deckToAnalyze: deckString,
            category: category
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to analyze ${category}: ${response.status} ${errorText}`)
        }

        const data = await response.json()
        
        // Parse the content JSON string
        let parsedContent
        try {
          parsedContent = typeof data.content === 'string' ? JSON.parse(data.content) : data.content
        } catch (parseError) {
          console.error(`Error parsing ${category} content:`, parseError)
          parsedContent = data.content
        }

        // Update completed category
        setCompletedCategories(prev => ({
          ...prev,
          [category]: true
        }))

        // Store the result
        setAnalysisResults(prev => ({
          ...prev,
          [category]: parsedContent
        }))

        return { category, data: parsedContent }
      } catch (error) {
        console.error(`Error analyzing ${category}:`, error)
        // Mark as completed even on error to allow progress
        setCompletedCategories(prev => ({
          ...prev,
          [category]: true
        }))
        return { category, error: error.message }
      }
    })

    // Progress will be updated via useEffect when completedCategories changes

    // Wait for all promises to complete
    Promise.all(promises).then((results) => {
      // Collect all results
      const finalResults = {}
      results.forEach(result => {
        if (result.data) {
          finalResults[result.category] = result.data
        }
      })
      
      setProgress(100)
      
      // Wait a brief moment before completing
      setTimeout(() => {
        if (onComplete) {
          onComplete(finalResults)
        }
      }, 500)
    })
    })
  }, [deck, onComplete])

  // Update progress based on completed categories
  useEffect(() => {
    const categories = ['offense', 'defense', 'synergy', 'versatility']
    const completedCount = categories.filter(cat => completedCategories[cat]).length
    const newProgress = (completedCount / categories.length) * 100
    setProgress(newProgress)
  }, [completedCategories])

  return (
    <div className="analyze-loading-overlay" onClick={onClose}>
      <div className="analyze-loading-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="analyze-loading-header">
          <div className="analyze-loading-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" className="analyze-loading-circle"/>
              <path d="M12 2 L12 8 L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <button className="analyze-loading-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="analyze-loading-content">
          <h2 className="analyze-loading-title">Analyzing Deck</h2>
          <p className="analyze-loading-subtitle">Processing your deck composition...</p>
          
          <div className="analyze-loading-progress-container">
            <div className="analyze-loading-progress-bar">
              <div 
                className="analyze-loading-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="analyze-loading-progress-text">
              {Math.round(progress)}%
            </div>
          </div>

          <div className="analyze-loading-steps">
            <div className={`analyze-loading-step ${completedCategories.offense ? 'completed' : analysisResults.offense !== null ? 'active' : ''}`}>
              <div className="step-icon">
                {completedCategories.offense ? '✓' : analysisResults.offense !== null ? '⟳' : '○'}
              </div>
              <div className="step-text">
                <div className="step-title">Analyzing Offense</div>
                <div className="step-description">Evaluating offensive capabilities</div>
              </div>
            </div>
            <div className={`analyze-loading-step ${completedCategories.defense ? 'completed' : analysisResults.defense !== null ? 'active' : ''}`}>
              <div className="step-icon">
                {completedCategories.defense ? '✓' : analysisResults.defense !== null ? '⟳' : '○'}
              </div>
              <div className="step-text">
                <div className="step-title">Analyzing Defense</div>
                <div className="step-description">Assessing defensive strategies</div>
              </div>
            </div>
            <div className={`analyze-loading-step ${completedCategories.synergy ? 'completed' : analysisResults.synergy !== null ? 'active' : ''}`}>
              <div className="step-icon">
                {completedCategories.synergy ? '✓' : analysisResults.synergy !== null ? '⟳' : '○'}
              </div>
              <div className="step-text">
                <div className="step-title">Analyzing Synergy</div>
                <div className="step-description">Evaluating card interactions</div>
              </div>
            </div>
            <div className={`analyze-loading-step ${completedCategories.versatility ? 'completed' : analysisResults.versatility !== null ? 'active' : ''}`}>
              <div className="step-icon">
                {completedCategories.versatility ? '✓' : analysisResults.versatility !== null ? '⟳' : '○'}
              </div>
              <div className="step-text">
                <div className="step-title">Analyzing Versatility</div>
                <div className="step-description">Measuring adaptability</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyzeLoading

