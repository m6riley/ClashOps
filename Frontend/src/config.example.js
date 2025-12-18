// Configuration file for API endpoints
// This uses Cloudflare Pages Functions as a proxy to keep Azure Function keys server-side

// Base URL for API
const AZURE_BASE_URL = 'https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api';

// Function keys for local development (create a local config.js to override with real keys)
const FUNCTION_KEYS = {
  add_account: 'YOUR_ADD_ACCOUNT_FUNCTION_KEY',
  get_account: 'YOUR_GET_ACCOUNT_FUNCTION_KEY',
  edit_account: 'YOUR_EDIT_ACCOUNT_FUNCTION_KEY',
  delete_account: 'YOUR_DELETE_ACCOUNT_FUNCTION_KEY',
  get_player_decks: 'YOUR_GET_PLAYER_DECKS_FUNCTION_KEY',
  save_player_deck: 'YOUR_SAVE_PLAYER_DECK_FUNCTION_KEY',
  edit_player_deck: 'YOUR_EDIT_PLAYER_DECK_FUNCTION_KEY',
  delete_player_deck: 'YOUR_DELETE_PLAYER_DECK_FUNCTION_KEY',
  get_categories: 'YOUR_GET_CATEGORIES_FUNCTION_KEY',
  save_category: 'YOUR_SAVE_CATEGORY_FUNCTION_KEY',
  edit_category: 'YOUR_EDIT_CATEGORY_FUNCTION_KEY',
  delete_category: 'YOUR_DELETE_CATEGORY_FUNCTION_KEY',
  get_features: 'YOUR_GET_FEATURES_FUNCTION_KEY',
  get_decks: 'YOUR_GET_DECKS_FUNCTION_KEY',
  get_cards: 'YOUR_GET_CARDS_FUNCTION_KEY',
  analyze_deck: 'YOUR_ANALYZE_DECK_FUNCTION_KEY',
  create_report: 'YOUR_CREATE_REPORT_FUNCTION_KEY',
  optimize_deck: 'YOUR_OPTIMIZE_DECK_FUNCTION_KEY',
  create_subscription: 'YOUR_CREATE_SUBSCRIPTION_FUNCTION_KEY',
  cancel_subscription: 'YOUR_CANCEL_SUBSCRIPTION_FUNCTION_KEY',
  renew_subscription: 'YOUR_RENEW_SUBSCRIPTION_FUNCTION_KEY',
  get_subscription_status: 'YOUR_GET_SUBSCRIPTION_STATUS_FUNCTION_KEY',
  stripe_webhook: 'YOUR_STRIPE_WEBHOOK_FUNCTION_KEY'
};

// Helper function to get function URL
export const getFunctionUrl = (functionName) => {
  if (import.meta.env.DEV) {
    // Local development: use direct Azure Function URL with keys
    const key = FUNCTION_KEYS[functionName];
    if (!key || key.startsWith('YOUR_')) {
      console.warn(`⚠️  Function key for ${functionName} not set. Create a local config.js file with real keys.`);
    }
    return `${AZURE_BASE_URL}/${functionName}?code=${key || 'PLACEHOLDER'}`;
  } else {
    // Production: use Pages Function proxy (keys are server-side in environment variables)
    return `/api/${functionName}`;
  }
};

// Individual function URL exports for convenience
export const getAddAccountUrl = () => getFunctionUrl('add_account');
export const getGetAccountUrl = () => getFunctionUrl('get_account');
export const getEditAccountUrl = () => getFunctionUrl('edit_account');
export const getDeleteAccountUrl = () => getFunctionUrl('delete_account');

export const getGetPlayerDecksUrl = () => getFunctionUrl('get_player_decks');
export const getSaveDeckUrl = () => getFunctionUrl('save_player_deck');
export const getEditDeckUrl = () => getFunctionUrl('edit_player_deck');
export const getDeleteDeckUrl = () => getFunctionUrl('delete_player_deck');

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

export const getCreateSubscriptionUrl = () => getFunctionUrl('create_subscription');
export const getCancelSubscriptionUrl = () => getFunctionUrl('cancel_subscription');
export const getRenewSubscriptionUrl = () => getFunctionUrl('renew_subscription');
export const getGetSubscriptionStatusUrl = () => getFunctionUrl('get_subscription_status');
export const getStripeWebhookUrl = () => getFunctionUrl('stripe_webhook');

