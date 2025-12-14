// Configuration file for API endpoints
// This uses Cloudflare Pages Functions as a proxy to keep Azure Function keys server-side

// Base URL for API (uses Pages Function proxy)
// In production, this will be your Cloudflare Pages domain
// In development, you can use the direct Azure Function URL if needed
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Uses Pages Function proxy
  : 'https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api';

// Helper function to get function URL
// Now uses the Pages Function proxy instead of direct Azure Function calls
export const getFunctionUrl = (functionName) => {
  if (process.env.NODE_ENV === 'production') {
    // Use Pages Function proxy (keys are server-side)
    return `${BASE_URL}/${functionName}`;
  } else {
    // Development: use direct Azure Function URL
    // For local dev, you'll need to set up the proxy or use direct URLs
    // You can create a local config.js with direct URLs for development
    return `${BASE_URL}/${functionName}`;
  }
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

