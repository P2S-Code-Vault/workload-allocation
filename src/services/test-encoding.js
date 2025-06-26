// Quick test to verify URL encoding
import API_CONFIG from './apiConfig.js';

// Test email
const testEmail = 'jonathan.herrera@p2sinc.com';

// Test the endpoint generation
const generatedUrl = API_CONFIG.ENDPOINTS.CONTACTS_GROUP_PROJECTS_EXTENDED(testEmail);

console.log('Original email:', testEmail);
console.log('Generated endpoint:', generatedUrl);
console.log('Expected result should have %40 not %2540');

// Manual encoding for comparison
const manualEncoded = encodeURIComponent(testEmail);
console.log('Manual encoding result:', manualEncoded);

// Full URL construction
const baseUrl = 'https://p2s-wp-api-d6bhbbbzewd9gfc5.westus-01.azurewebsites.net/';
const fullUrl = `${baseUrl}${generatedUrl}?include_user_projects=true`;
console.log('Full URL:', fullUrl);
