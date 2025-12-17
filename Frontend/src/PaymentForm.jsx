import React, { useState, useEffect, useMemo } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import './PaymentForm.css'

// Lazy initialization of Stripe - only initialize when needed
let stripePromise = null

const getStripePromise = () => {
  if (stripePromise) {
    return stripePromise
  }
  
  // Vite uses import.meta.env with VITE_ prefix (not process.env.REACT_APP_)
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  
  if (!publishableKey || publishableKey === 'pk_test_your_publishable_key_here') {
    console.warn('Stripe publishable key not configured. PaymentForm will not work until VITE_STRIPE_PUBLISHABLE_KEY is set in .env file.')
    return null
  }
  stripePromise = loadStripe(publishableKey)
  return stripePromise
}

function PaymentFormContent({ userId, clientSecret, subscriptionId, onSuccess, onCancel, onComplete, onClose }) {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // This is required by React's Rules of Hooks
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  // Validate userId is provided (AFTER all hooks)
  if (!userId) {
    return (
      <div className="payment-form">
        <div className="payment-form-header">
          <h2>Error</h2>
          <p>User ID is missing. Please log in and try again.</p>
        </div>
        <div className="payment-form-actions">
          <button
            type="button"
            className="payment-form-button payment-form-button-secondary"
            onClick={onClose || onCancel}
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  // Show loading state while Stripe is initializing (AFTER all hooks)
  if (!stripe || !elements) {
    return (
      <div className="payment-form">
        <div className="payment-form-header">
          <h2>Loading Payment Form...</h2>
          <p>Please wait while we initialize the payment form.</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      console.error('PaymentFormContent: Missing required dependencies', {
        hasStripe: !!stripe,
        hasElements: !!elements,
        hasClientSecret: !!clientSecret
      })
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      console.log('PaymentFormContent: Starting payment confirmation', {
        subscriptionId,
        hasClientSecret: !!clientSecret
      })

      // IMPORTANT: Must call elements.submit() before confirmPayment()
      // This validates the form and prepares it for payment confirmation
      const { error: submitError } = await elements.submit()
      
      if (submitError) {
        console.error('PaymentFormContent: Form validation failed', submitError)
        setErrorMessage(submitError.message)
        setIsProcessing(false)
        return
      }

      // Confirm the payment using Stripe's confirmPayment
      // The PaymentIntent comes from the subscription's first invoice
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        redirect: 'if_required'
      })

      if (confirmError) {
        console.error('PaymentFormContent: Payment confirmation failed', confirmError)
        setErrorMessage(confirmError.message)
        setIsProcessing(false)
        return
      }

      console.log('PaymentFormContent: Payment confirmed successfully', {
        subscriptionId
      })

      // After successful payment confirmation, wait a moment for Stripe to update subscription
      // Then refresh subscription status from backend
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      try {
        const { getGetSubscriptionStatusUrl } = await import('./config')
        // Construct URL properly - check if it already has query params
        const baseUrl = getGetSubscriptionStatusUrl()
        const separator = baseUrl.includes('?') ? '&' : '?'
        const statusResponse = await fetch(`${baseUrl}${separator}userId=${userId}`)
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          console.log('PaymentFormContent: Subscription status refreshed', {
            subscriptionId,
            status: statusData.status,
            hasSubscription: statusData.hasSubscription
          })
          
          // Call success callbacks with subscription data
          const subscriptionData = {
            subscriptionId,
            status: statusData.status,
            hasSubscription: statusData.hasSubscription
          }
          
          if (onSuccess) {
            onSuccess(subscriptionData)
          }
          if (onComplete) {
            onComplete(subscriptionData)
          }
        } else {
          // If status check fails, still call callbacks optimistically
          console.warn('PaymentFormContent: Status check failed, but payment was confirmed', {
            status: statusResponse.status,
            statusText: statusResponse.statusText
          })
          const subscriptionData = {
            subscriptionId,
            status: 'active' // Optimistic - webhook will confirm
          }
          if (onSuccess) {
            onSuccess(subscriptionData)
          }
          if (onComplete) {
            onComplete(subscriptionData)
          }
        }
      } catch (error) {
        console.error('PaymentFormContent: Error refreshing subscription status', error)
        // Continue anyway - webhook will update it
        // Still call callbacks with available data
        const subscriptionData = {
          subscriptionId,
          status: 'active' // Optimistic - webhook will confirm
        }
        if (onSuccess) {
          onSuccess(subscriptionData)
        }
        if (onComplete) {
          onComplete(subscriptionData)
        }
      }
      
      // Reset processing state after callbacks are called
      setIsProcessing(false)

    } catch (error) {
      console.error('PaymentFormContent: Unexpected error during payment confirmation', error)
      setErrorMessage(error.message || 'Failed to confirm payment. Please try again.')
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-form-header">
        <h2>Complete Your Subscription</h2>
        <p>Enter your payment details to unlock ClashOps Diamond</p>
      </div>

      <div className="payment-element-container">
        <PaymentElement />
      </div>

      <div className="payment-security-message">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
        <span>Payment details and processing are handled securely by Stripe</span>
      </div>

      {errorMessage && (
        <div className="payment-error-message">
          {errorMessage}
        </div>
      )}

      <div className="payment-form-actions">
        <button
          type="button"
          className="payment-form-button payment-form-button-secondary"
          onClick={() => {
            if (onCancel) onCancel()
            if (onClose) onClose()
          }}
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="payment-form-button payment-form-button-primary"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Subscribe Now'}
        </button>
      </div>
    </form>
  )
}

function PaymentForm({ userId, onSuccess, onCancel, onComplete, onClose }) {
  // Initialize Stripe only when component mounts
  const stripePromise = useMemo(() => {
    console.log('PaymentForm: Initializing Stripe...')
    const promise = getStripePromise()
    console.log('PaymentForm: Stripe promise:', promise ? 'loaded' : 'null')
    return promise
  }, [])
  
  const [clientSecret, setClientSecret] = useState(null)
  const [subscriptionId, setSubscriptionId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Create subscription BEFORE rendering Elements
  useEffect(() => {
    const createSubscription = async () => {
      if (!userId) {
        console.error('PaymentForm: userId is missing')
        setError('User ID is missing. Please log in and try again.')
        setIsLoading(false)
        return
      }

      if (!stripePromise) {
        console.error('PaymentForm: Stripe not configured')
        setError('Stripe is not configured. Please check your environment variables.')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        console.log('PaymentForm: Creating subscription for userId:', userId)
        
        // Call backend to create subscription
        const { getCreateSubscriptionUrl } = await import('./config')
        const response = await fetch(getCreateSubscriptionUrl(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Failed to create subscription')
        }

        const subscriptionData = await response.json()
        
        console.log('PaymentForm: Subscription created successfully', {
          subscriptionId: subscriptionData.subscriptionId,
          status: subscriptionData.status,
          hasClientSecret: !!subscriptionData.clientSecret
        })

        // Backend MUST return subscriptionId and clientSecret
        if (!subscriptionData.subscriptionId) {
          throw new Error('Subscription ID not returned from backend')
        }

        if (!subscriptionData.clientSecret) {
          console.error('PaymentForm: No clientSecret in response', subscriptionData)
          throw new Error('Payment intent not found. Please try again.')
        }

        // Store clientSecret and subscriptionId for Elements
        setClientSecret(subscriptionData.clientSecret)
        setSubscriptionId(subscriptionData.subscriptionId)
        setIsLoading(false)
        
        console.log('PaymentForm: Client secret received, ready to render Elements', {
          subscriptionId: subscriptionData.subscriptionId,
          clientSecretLength: subscriptionData.clientSecret.length
        })

      } catch (err) {
        console.error('PaymentForm: Error creating subscription', err)
        setError(err.message || 'Failed to create subscription. Please try again.')
        setIsLoading(false)
      }
    }

    createSubscription()
  }, [userId, stripePromise])
  
  console.log('PaymentForm: Rendering with userId:', userId)
  console.log('PaymentForm: stripePromise:', stripePromise ? 'exists' : 'null')
  console.log('PaymentForm: clientSecret:', clientSecret ? 'exists' : 'null')
  console.log('PaymentForm: isLoading:', isLoading)
  
  // Don't render if Stripe is not configured
  if (!stripePromise) {
    console.warn('PaymentForm: Stripe not configured, showing error message')
    return (
      <div className="payment-form-overlay" onClick={onClose || onCancel}>
        <div className="payment-form-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="payment-form">
            <div className="payment-form-header">
              <h2>Payment Not Configured</h2>
              <p>Stripe publishable key is not set. Please configure VITE_STRIPE_PUBLISHABLE_KEY in your .env file.</p>
              <p style={{ fontSize: '12px', marginTop: '10px', color: 'rgba(255,255,255,0.5)' }}>
                Current key: {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'Set' : 'Not set'}
              </p>
            </div>
            <div className="payment-form-actions">
              <button
                type="button"
                className="payment-form-button payment-form-button-secondary"
                onClick={onClose || onCancel}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while creating subscription
  if (isLoading) {
    return (
      <div className="payment-form-overlay" onClick={onClose || onCancel}>
        <div className="payment-form-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="payment-form">
            <div className="payment-form-header">
              <h2>Setting Up Payment...</h2>
              <p>Please wait while we prepare your subscription.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state if subscription creation failed
  if (error || !clientSecret) {
    return (
      <div className="payment-form-overlay" onClick={onClose || onCancel}>
        <div className="payment-form-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="payment-form">
            <div className="payment-form-header">
              <h2>Error</h2>
              <p>{error || 'Failed to initialize payment. Please try again.'}</p>
            </div>
            <div className="payment-form-actions">
              <button
                type="button"
                className="payment-form-button payment-form-button-secondary"
                onClick={onClose || onCancel}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render Elements ONLY after clientSecret is available
  console.log('PaymentForm: Rendering Stripe Elements with clientSecret')
  return (
    <div className="payment-form-overlay" onClick={onClose || onCancel}>
      <div className="payment-form-dialog" onClick={(e) => e.stopPropagation()}>
        <Elements 
          stripe={stripePromise} 
          options={{
            clientSecret,
            appearance: {
              theme: 'night',
              variables: {
                colorPrimary: '#a855f7',
              },
            },
          }}
        >
          <PaymentFormContent 
            userId={userId}
            clientSecret={clientSecret}
            subscriptionId={subscriptionId}
            onSuccess={onSuccess} 
            onCancel={onCancel}
            onComplete={onComplete}
            onClose={onClose}
          />
        </Elements>
      </div>
    </div>
  )
}

export default PaymentForm
