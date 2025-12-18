/**
 * Utility functions for making API calls with retry logic for timeouts
 */

/**
 * Fetch with retry logic for timeouts
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @param {object} retryConfig - Retry configuration
 * @param {number} retryConfig.maxRetries - Maximum number of retries (default: 3)
 * @param {number} retryConfig.retryDelay - Delay between retries in ms (default: 1000)
 * @param {number} retryConfig.timeout - Request timeout in ms (default: 30000)
 * @returns {Promise<Response>} - The fetch response
 */
export async function fetchWithRetry(url, options = {}, retryConfig = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    timeout = 30000
  } = retryConfig;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let timeoutId;
    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Make the fetch request with timeout
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // If request succeeded, return response
      return response;
      
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      lastError = error;
      
      // Check if it's a timeout/abort error
      const isTimeout = error.name === 'AbortError' || 
                       error.message?.includes('timeout') ||
                       error.message?.includes('aborted');
      
      // Only retry on timeout errors
      if (isTimeout && attempt < maxRetries) {
        console.warn(`Request timeout (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${retryDelay}ms...`, url);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      // If it's not a timeout or we've exhausted retries, throw the error
      throw error;
    }
  }
  
  // This should never be reached, but just in case
  throw lastError || new Error('Request failed after retries');
}

/**
 * Fetch JSON with retry logic for timeouts
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {object} retryConfig - Retry configuration
 * @returns {Promise<object>} - The parsed JSON response
 */
export async function fetchJsonWithRetry(url, options = {}, retryConfig = {}) {
  const response = await fetchWithRetry(url, options, retryConfig);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  
  return await response.json();
}

