import React, { useState } from 'react'
import './PaymentForm.css'

function PaymentForm({ onClose, onComplete }) {
  const [formData, setFormData] = useState({
    nameOnCard: '',
    cardNumber: '',
    cvv: '',
    billingAddress: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    let processedValue = value
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      // Remove all non-digits
      const digitsOnly = value.replace(/\D/g, '')
      // Add spaces every 4 digits
      processedValue = digitsOnly.match(/.{1,4}/g)?.join(' ') || digitsOnly
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // For now, just complete the subscription
    onComplete()
  }

  return (
    <div className="payment-form-overlay" onClick={onClose}>
      <div className="payment-form-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="payment-form-header">
          <h2 className="payment-form-title">Payment Information</h2>
          <button className="payment-form-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form className="payment-form-content" onSubmit={handleSubmit}>
          <div className="payment-form-group">
            <label htmlFor="nameOnCard" className="payment-form-label">
              Name on Card
            </label>
            <input
              type="text"
              id="nameOnCard"
              name="nameOnCard"
              className="payment-form-input"
              value={formData.nameOnCard}
              onChange={handleInputChange}
              placeholder="John Doe"
            />
          </div>

          <div className="payment-form-group">
            <label htmlFor="cardNumber" className="payment-form-label">
              Card Number
            </label>
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              className="payment-form-input"
              value={formData.cardNumber}
              onChange={handleInputChange}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
            />
          </div>

          <div className="payment-form-row">
            <div className="payment-form-group payment-form-group-half">
              <label htmlFor="cvv" className="payment-form-label">
                CVV
              </label>
              <input
                type="text"
                id="cvv"
                name="cvv"
                className="payment-form-input"
                value={formData.cvv}
                onChange={handleInputChange}
                placeholder="123"
                maxLength="4"
              />
            </div>
          </div>

          <div className="payment-form-group">
            <label htmlFor="billingAddress" className="payment-form-label">
              Billing Address
            </label>
            <textarea
              id="billingAddress"
              name="billingAddress"
              className="payment-form-textarea"
              value={formData.billingAddress}
              onChange={handleInputChange}
              placeholder="123 Main St, City, State, ZIP"
              rows="3"
            />
          </div>

          <div className="payment-form-actions">
            <button type="submit" className="payment-form-button payment-form-button-primary">
              Complete Subscription
            </button>
            <button type="button" className="payment-form-button payment-form-button-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PaymentForm

