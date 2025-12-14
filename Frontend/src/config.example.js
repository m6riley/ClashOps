// Example configuration file for API endpoints
// Copy this file to config.js and fill in your actual function keys
// IMPORTANT: config.js should be in .gitignore and never committed to version control

// Base URL for Azure Functions
const BASE_URL = 'https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api';

// Function keys - Replace these with your actual function keys
const FUNCTION_KEYS = {
  // Account management
  add_account: 'YOUR_ADD_ACCOUNT_FUNCTION_KEY',
  get_account: 'YOUR_GET_ACCOUNT_FUNCTION_KEY',
  edit_account: 'YOUR_EDIT_ACCOUNT_FUNCTION_KEY',
  delete_account: 'YOUR_DELETE_ACCOUNT_FUNCTION_KEY',
  
  // Deck management
  get_player_decks: 'YOUR_GET_PLAYER_DECKS_FUNCTION_KEY',
  save_deck: 'YOUR_SAVE_DECK_FUNCTION_KEY',
  edit_deck: 'YOUR_EDIT_DECK_FUNCTION_KEY',
  delete_deck: 'YOUR_DELETE_DECK_FUNCTION_KEY',
  
  // Category management
  get_categories: 'YOUR_GET_CATEGORIES_FUNCTION_KEY',
  save_category: 'YOUR_SAVE_CATEGORY_FUNCTION_KEY',
  edit_category: 'YOUR_EDIT_CATEGORY_FUNCTION_KEY',
  delete_category: 'YOUR_DELETE_CATEGORY_FUNCTION_KEY',
  
  // Data loading
  get_features: 'YOUR_GET_FEATURES_FUNCTION_KEY',
  get_decks: 'YOUR_GET_DECKS_FUNCTION_KEY',
  get_cards: 'YOUR_GET_CARDS_FUNCTION_KEY',
  
  // Analysis
  analyze_deck: 'YOUR_ANALYZE_DECK_FUNCTION_KEY',
  create_report: 'YOUR_CREATE_REPORT_FUNCTION_KEY',
  optimize_deck: 'YOUR_OPTIMIZE_DECK_FUNCTION_KEY'
};

// Helper function to get function URL
export const getFunctionUrl = (functionName) => {
  const key = FUNCTION_KEYS[functionName];
  if (!key) {
    throw new Error(`Function key not found for: ${functionName}`);
  }
  return `${BASE_URL}/${functionName}?code=${key}`;
};

// Individual function URL exports for convenience
export const getAddAccountUrl = () => getFunctionUrl('add_account');
export const getGetAccountUrl = () => getFunctionUrl('get_account');
export const getEditAccountUrl = () => getFunctionUrl('edit_account');
export const getDeleteAccountUrl = () => getFunctionUrl('delete_account');

export const getGetPlayerDecksUrl = () => getFunctionUrl('get_player_decks');
export const getSaveDeckUrl = () => getFunctionUrl('save_deck');
export const getEditDeckUrl = () => getFunctionUrl('edit_deck');
export const getDeleteDeckUrl = () => getFunctionUrl('delete_deck');

export const getGetCategoriesUrl = () => getFunctionUrl('get_categories');
export const getSaveCategoryUrl = () => getFunctionUrl('save_category');
export const getEditCategoryUrl = () => getFunctionUrl('edit_category');
export const getDeleteCategoryUrl = () => getFunctionUrl('delete_category');

export const getGetFeaturesUrl = () => getFunctionUrl('get_features');
export const getGetDecksUrl = () => getFunctionUrl('get_decks');
export const getGetCardsUrl = () => getFunctionUrl('get_cards');

export const getAnalyzeDeckUrl = () => getFunctionUrl('analyze_deck');
export const getCreateReportUrl = () => getFunctionUrl('create_report');
export const getOptimizeDeckUrl = () => getFunctionUrl('optimize_deck');

