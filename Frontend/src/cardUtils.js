/**
 * Converts a card name from display format to API format
 * Examples:
 *   "Hog Rider" -> "hog-rider"
 *   "The Log" -> "the-log"
 *   "Ice Spirit" -> "ice-spirit"
 *   "Mega Minion" -> "mega-minion"
 */
export function cardNameToApiName(cardName) {
  if (!cardName) return ''
  
  // Convert to lowercase and replace spaces with hyphens
  return cardName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '') // Remove any special characters
}

/**
 * Gets the card image URL from RoyaleAPI CDN
 */
export function getCardImageUrl(cardName) {
  const apiName = cardNameToApiName(cardName)
  return `https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/${apiName}.png`
}

/**
 * Gets the evolution card image URL (with -ev1 suffix) from RoyaleAPI CDN
 */
export function getCardEvolutionImageUrl(cardName) {
  const apiName = cardNameToApiName(cardName)
  return `https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/${apiName}-ev1.png`
}

/**
 * Gets the hero card image URL (with -hero suffix) from RoyaleAPI CDN
 */
export function getCardHeroImageUrl(cardName) {
  const apiName = cardNameToApiName(cardName)
  return `https://cdns3.royaleapi.com/cdn-cgi/image/w=150,h=180,format=auto/static/img/cards/v6-aa179c9e/${apiName}-hero.png`
}

/**
 * Gets the card type from card data
 * @param {Object} card - Card object with type property
 * @returns {string|undefined} The card type (e.g., 'troop', 'spell', 'building') or undefined if not available
 */
export function getCardType(card) {
  return card?.type
}

