/**
 * Minimal Cloudflare Pages Function to proxy Azure Function requests
 * Environment variables should be set in Cloudflare Pages → Settings → Environment Variables
 * Format: {FUNCTION_NAME}_URL (e.g., ADD_ACCOUNT_URL, GET_ACCOUNT_URL)
 */

export async function onRequest(context) {
  const { request, env, params } = context;
  
  // For functions/api/[[path]].js, params.path is an array of segments after /api/
  // e.g., /api/add_account -> params.path = ["add_account"]
  const pathSegments = params.path || [];
  const functionName = pathSegments[0];
  
  if (!functionName) {
    return new Response(
      JSON.stringify({ error: 'Function name is required' }), 
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Get the Azure Function URL from environment variable
  // Format: ADD_ACCOUNT_URL, GET_ACCOUNT_URL, etc.
  const envVarName = functionName.toUpperCase().replace(/-/g, '_') + '_URL';
  const azureUrl = env[envVarName];
  
  if (!azureUrl) {
    return new Response(
      JSON.stringify({ 
        error: `Function URL not found for: ${functionName}`,
        hint: `Set environment variable: ${envVarName}`
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Proxy the request to Azure Function
  try {
    const method = request.method;
    const body = method !== 'GET' && method !== 'HEAD' ? await request.text() : null;
    
    const response = await fetch(azureUrl, {
      method,
      headers: request.headers,
      body,
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
