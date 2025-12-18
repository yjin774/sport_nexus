// iPay88 Configuration
// IMPORTANT: In production, store these values securely (environment variables, server-side only)
// For sandbox/testing, you can use test credentials provided by iPay88

const IPAY88_CONFIG = {
  // Sandbox/Test Environment
  sandbox: {
    merchantCode: 'TEST_MERCHANT_001', // Placeholder for testing - replace with real credentials
    merchantKey: 'TEST_MERCHANT_KEY_12345',   // Placeholder for testing - replace with real credentials
    paymentUrl: 'https://sandbox.ipay88.com.my/epayment/entry.asp'
  },
  
  // Production Environment
  production: {
    merchantCode: 'YOUR_PRODUCTION_MERCHANT_CODE', // Replace with your production merchant code
    merchantKey: 'YOUR_PRODUCTION_MERCHANT_KEY',   // Replace with your production merchant key
    paymentUrl: 'https://payment.ipay88.com.my/epayment/entry.asp'
  },
  
  // Current environment (change to 'production' when going live)
  environment: 'sandbox',
  
  // Test mode - set to true to simulate payment without redirecting to iPay88
  testMode: true, // Set to false when you have real credentials
  
  // Currency code (MYR for Malaysia)
  currency: 'MYR',
  
  // Return URL - where user returns after payment
  returnUrl: window.location.origin + '/payment-response.html',
  
  // Backend URL - server-to-server notification (optional, for webhook)
  backendUrl: window.location.origin + '/payment-callback.html',
  
  // Test mode - set to true to simulate payment without redirecting to iPay88
  // When testMode is true, it will simulate the payment flow locally
  testMode: true // Set to false when you have real credentials and want to use actual iPay88
};

// Get current config based on environment
function getIpay88Config() {
  const env = IPAY88_CONFIG.environment;
  return {
    merchantCode: IPAY88_CONFIG[env].merchantCode,
    merchantKey: IPAY88_CONFIG[env].merchantKey,
    paymentUrl: IPAY88_CONFIG[env].paymentUrl,
    currency: IPAY88_CONFIG.currency,
    returnUrl: IPAY88_CONFIG.returnUrl,
    backendUrl: IPAY88_CONFIG.backendUrl,
    testMode: IPAY88_CONFIG.testMode
  };
}

// Generate MD5 signature for iPay88
// Signature format: MD5(MerchantKey + MerchantCode + PaymentId + RefNo + Amount + Currency)
function generateIpay88Signature(merchantKey, merchantCode, paymentId, refNo, amount, currency) {
  // Use CryptoJS if available
  if (typeof CryptoJS !== 'undefined' && CryptoJS.MD5) {
    const signatureString = merchantKey + merchantCode + paymentId + refNo + amount + currency;
    return CryptoJS.MD5(signatureString).toString().toUpperCase();
  } else {
    // Fallback: Load CryptoJS library
    console.error('CryptoJS not found. Please include CryptoJS library for signature generation.');
    console.error('Add this to your HTML: <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>');
    return '';
  }
}

// Generate unique Payment ID (must be unique per transaction)
function generatePaymentId() {
  return 'PAY' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.IPAY88_CONFIG = IPAY88_CONFIG;
  window.getIpay88Config = getIpay88Config;
  window.generateIpay88Signature = generateIpay88Signature;
  window.generatePaymentId = generatePaymentId;
}

