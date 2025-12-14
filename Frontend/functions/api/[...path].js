/**
 * Cloudflare Pages Function to proxy Azure Function requests
 * This keeps function keys server-side and out of the client bundle
 * 
 * Environment variables (set in Cloudflare Pages → Settings → Environment Variables):
 * - ADD_ACCOUNT_KEY
 * - GET_ACCOUNT_KEY
 * - EDIT_ACCOUNT_KEY
 * - DELETE_ACCOUNT_KEY
 * - GET_PLAYER_DECKS_KEY
 * - SAVE_DECK_KEY
 * - EDIT_DECK_KEY
 * - DELETE_DECK_KEY
 * - GET_CATEGORIES_KEY
 * - SAVE_CATEGORY_KEY
 * - EDIT_CATEGORY_KEY
 * - DELETE_CATEGORY_KEY
 * - GET_FEATURES_KEY
 * - GET_DECKS_KEY
 * - GET_CARDS_KEY
 * - ANALYZE_DECK_KEY
 * - CREATE_REPORT_KEY
 * - OPTIMIZE_DECK_KEY
 */

const BASE_URL = 'https://clashopsfunctionapp-ghhmfad4f3ctgdcs.canadacentral-01.azurewebsites.net/api';

export async function onRequest(context) {
  const { request, env, params } = context;
  const functionName = params.path[0];
  
  // Map function names to environment variable names
  // e.g., "add_account" -> "ADD_ACCOUNT_KEY"
  const envVarName = functionName.toUpperCase().replace(/_/g, '_') + '_KEY';
  const functionKey = env[envVarName];
  
  if (!functionKey) {
    return new Response(JSON.stringify({ 
      error: `Function key not found for: ${functionName}`,
      hint: `Expected environment variable: ${envVarName}. Please set it in Cloudflare Pages → Settings → Environment Variables.`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build Azure Function URL
  const azureUrl = `${BASE_URL}/${functionName}?code=${functionKey}`;
  return proxyRequest(request, azureUrl);
}

async function proxyRequest(request, azureUrl) {
  try {
    const method = request.method;
    const body = method !== 'GET' && method !== 'HEAD' ? await request.text() : null;
    const headers = new Headers(request.headers);
    
    // Remove headers that shouldn't be forwarded
    headers.delete('host');
    headers.delete('cf-connecting-ip');
    headers.delete('cf-ray');
    
    const response = await fetch(azureUrl, {
      method,
      headers,
      body,
    });

    // Return the response with CORS headers
    const responseBody = await response.text();
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type');
    
    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
