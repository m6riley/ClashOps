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
 * Parse catalog card labels that may include evolved-/hero- prefixes.
 * Examples:
 *   "evolved-Mega Knight" -> { baseName: "Mega Knight", isEvolution: true, isHero: false }
 *   "hero-Berserker" -> { baseName: "Berserker", isEvolution: false, isHero: true }
 *   "Fireball" -> { baseName: "Fireball", isEvolution: false, isHero: false }
 */
export function parseDeckCardLabel(rawName) {
  if (!rawName) {
    return { baseName: '', isEvolution: false, isHero: false }
  }

  const trimmed = String(rawName).trim()
  const lower = trimmed.toLowerCase()

  if (lower.startsWith('evolved-')) {
    return {
      baseName: trimmed.slice('evolved-'.length).trim(),
      isEvolution: true,
      isHero: false,
    }
  }

  if (lower.startsWith('hero-')) {
    return {
      baseName: trimmed.slice('hero-'.length).trim(),
      isEvolution: false,
      isHero: true,
    }
  }

  return { baseName: trimmed, isEvolution: false, isHero: false }
}

/**
 * Format a deck card into a catalog-style label with evolved-/hero- prefixes.
 * Examples:
 *   { name: "Mega Knight", isEvolution: true } -> "evolved-Mega Knight"
 *   { name: "Berserker", isHero: true } -> "hero-Berserker"
 *   { name: "Fireball" } -> "Fireball"
 */
export function formatDeckCardLabel(card) {
  if (!card?.name) return ''
  if (card.isEvolution) return `evolved-${card.name}`
  if (card.isHero) return `hero-${card.name}`
  return card.name
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
