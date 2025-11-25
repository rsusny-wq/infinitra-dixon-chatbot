/**
 * QR Code Generator Utility for Dixon Smart Repair
 * Generates QR codes for shop visit testing
 */

export interface ShopQRData {
  shopId: string;
  location: string;
  name: string;
}

/**
 * Generate QR code data for a shop location
 */
export const generateShopQRData = (shopId: string, location: string, name: string): string => {
  const qrData: ShopQRData = {
    shopId,
    location,
    name
  };
  
  return JSON.stringify(qrData);
};

/**
 * Predefined shop QR codes for testing
 */
export const TEST_SHOP_QR_CODES = {
  DIXON_MAIN: generateShopQRData(
    'dixon-main',
    'front-desk',
    'Dixon Smart Repair - Main Location'
  ),
  DIXON_NORTH: generateShopQRData(
    'dixon-north',
    'front-desk',
    'Dixon Smart Repair - North Branch'
  ),
  DIXON_SOUTH: generateShopQRData(
    'dixon-south',
    'front-desk',
    'Dixon Smart Repair - South Branch'
  )
};

/**
 * Generate a QR code URL for testing (using qr-server.com)
 */
export const generateQRCodeURL = (data: string, size: number = 200): string => {
  const encodedData = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`;
};

/**
 * Validate QR code data format
 */
export const validateShopQRData = (data: string): { valid: boolean; error?: string; parsed?: ShopQRData } => {
  try {
    const parsed = JSON.parse(data);
    
    if (!parsed.shopId) {
      return { valid: false, error: 'Missing shopId' };
    }
    
    if (!parsed.location) {
      return { valid: false, error: 'Missing location' };
    }
    
    if (!parsed.name) {
      return { valid: false, error: 'Missing name' };
    }
    
    return { valid: true, parsed };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON format' };
  }
};

/**
 * Generate HTML for displaying QR codes (for testing)
 */
export const generateQRCodeHTML = (): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Dixon Smart Repair - Test QR Codes</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .qr-container { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .qr-code { margin: 10px 0; }
        .qr-data { background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; }
      </style>
    </head>
    <body>
      <h1>Dixon Smart Repair - Test QR Codes</h1>
      
      <div class="qr-container">
        <h2>Main Location</h2>
        <div class="qr-code">
          <img src="${generateQRCodeURL(TEST_SHOP_QR_CODES.DIXON_MAIN)}" alt="Main Location QR Code" />
        </div>
        <div class="qr-data">${TEST_SHOP_QR_CODES.DIXON_MAIN}</div>
      </div>
      
      <div class="qr-container">
        <h2>North Branch</h2>
        <div class="qr-code">
          <img src="${generateQRCodeURL(TEST_SHOP_QR_CODES.DIXON_NORTH)}" alt="North Branch QR Code" />
        </div>
        <div class="qr-data">${TEST_SHOP_QR_CODES.DIXON_NORTH}</div>
      </div>
      
      <div class="qr-container">
        <h2>South Branch</h2>
        <div class="qr-code">
          <img src="${generateQRCodeURL(TEST_SHOP_QR_CODES.DIXON_SOUTH)}" alt="South Branch QR Code" />
        </div>
        <div class="qr-data">${TEST_SHOP_QR_CODES.DIXON_SOUTH}</div>
      </div>
      
      <div class="qr-container">
        <h2>How to Test</h2>
        <ol>
          <li>Open the Dixon Smart Repair app</li>
          <li>Sign in to your account</li>
          <li>Go to the Visits tab in the sidebar</li>
          <li>Click "Scan QR Code"</li>
          <li>Point your camera at one of the QR codes above</li>
          <li>Select your service type</li>
          <li>Confirm your visit is recorded</li>
        </ol>
      </div>
    </body>
    </html>
  `;
};
