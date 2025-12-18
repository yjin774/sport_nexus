// PayNet FPX Configuration
// IMPORTANT: In production, store these values securely (environment variables, server-side only)
// PayNet FPX (Financial Process Exchange) is Malaysia's online banking payment system

const PAYNET_CONFIG = {
  // Sandbox/Test Environment
  // Get FREE sandbox credentials from: https://developer.paynet.my/
  sandbox: {
    merchantId: 'TEST_MERCHANT_001', // Replace with your PayNet Developer Portal sandbox merchant ID (FREE for students!)
    merchantKey: 'TEST_MERCHANT_KEY_12345',   // Replace with your PayNet Developer Portal sandbox merchant key
    // Get these URLs from your PayNet Developer Portal project dashboard
    apiUrl: 'https://sandbox.paynet.my/fpx/api/v1', // PayNet sandbox API URL (from Developer Portal)
    paymentUrl: 'https://sandbox.paynet.my/fpx/payment' // PayNet sandbox payment page URL (from Developer Portal)
  },
  
  // Production Environment
  production: {
    merchantId: 'YOUR_PRODUCTION_MERCHANT_ID', // Replace with your production merchant ID
    merchantKey: 'YOUR_PRODUCTION_MERCHANT_KEY',   // Replace with your production merchant key
    apiUrl: 'https://api.paynet.my/fpx/v1', // PayNet production API URL
    paymentUrl: 'https://fpx.paynet.my/payment' // PayNet production payment page URL
  },
  
  // Current environment (change to 'production' when going live)
  environment: 'sandbox',
  
  // Test mode - set to true to simulate payment without redirecting to PayNet
  // When testMode is true, it will simulate the payment flow locally (no real payment gateway)
  // Set to false when you have real sandbox credentials from PayNet Developer Portal (FREE for students!)
  // Get free sandbox: https://developer.paynet.my/
  testMode: true, // Set to false to use PayNet sandbox (get FREE credentials from Developer Portal)
  
  // Currency code (MYR for Malaysia)
  currency: 'MYR',
  
  // Return URL - where user returns after payment
  returnUrl: window.location.origin + '/payment-response.html',
  
  // Backend URL - server-to-server notification (optional, for webhook)
  backendUrl: window.location.origin + '/payment-callback.html',
  
  // Supported banks for FPX
  supportedBanks: [
    { code: 'MBB', name: 'Maybank' },
    { code: 'CIMB', name: 'CIMB Bank' },
    { code: 'PBB', name: 'Public Bank' },
    { code: 'RHB', name: 'RHB Bank' },
    { code: 'HLB', name: 'Hong Leong Bank' },
    { code: 'AMB', name: 'AmBank' },
    { code: 'UOB', name: 'UOB Bank' },
    { code: 'OCBC', name: 'OCBC Bank' },
    { code: 'HSBC', name: 'HSBC Bank' },
    { code: 'SCB', name: 'Standard Chartered' }
  ]
};

// Get current config based on environment
function getPaynetConfig() {
  const env = PAYNET_CONFIG.environment;
  return {
    merchantId: PAYNET_CONFIG[env].merchantId,
    merchantKey: PAYNET_CONFIG[env].merchantKey,
    apiUrl: PAYNET_CONFIG[env].apiUrl,
    paymentUrl: PAYNET_CONFIG[env].paymentUrl,
    currency: PAYNET_CONFIG.currency,
    returnUrl: PAYNET_CONFIG.returnUrl,
    backendUrl: PAYNET_CONFIG.backendUrl,
    testMode: PAYNET_CONFIG.testMode,
    supportedBanks: PAYNET_CONFIG.supportedBanks
  };
}

// Generate SHA256 signature for PayNet FPX
// PayNet typically uses SHA256 HMAC for signature generation
// Signature format: HMAC-SHA256(merchantKey, merchantId + orderId + amount + currency + timestamp)
function generatePaynetSignature(merchantKey, merchantId, orderId, amount, currency, timestamp) {
  // Use CryptoJS if available
  if (typeof CryptoJS !== 'undefined' && CryptoJS.HmacSHA256) {
    const signatureString = merchantId + orderId + amount + currency + timestamp;
    const signature = CryptoJS.HmacSHA256(signatureString, merchantKey).toString().toUpperCase();
    return signature;
  } else {
    console.error('CryptoJS not found. Please include CryptoJS library for signature generation.');
    console.error('Add this to your HTML: <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>');
    return '';
  }
}

// Generate unique Order ID (must be unique per transaction)
function generateOrderId() {
  return 'ORD' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Generate timestamp for PayNet (format: YYYYMMDDHHmmss)
function generatePaynetTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.PAYNET_CONFIG = PAYNET_CONFIG;
  window.getPaynetConfig = getPaynetConfig;
  window.generatePaynetSignature = generatePaynetSignature;
  window.generateOrderId = generateOrderId;
  window.generatePaynetTimestamp = generatePaynetTimestamp;
}

