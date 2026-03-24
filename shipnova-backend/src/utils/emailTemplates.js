/**
 * ShipNova Professional Email Templates
 * Standardized SaaS-level HTML emails for the shipment lifecycle.
 */

const APP_NAME = "ShipNova";
const PRIMARY_COLOR = "#ff3399"; // Pink
const SECONDARY_COLOR = "#2d66ff"; // Blue
const BG_COLOR = "#fdfdfd";
const CARD_BG = "#ffffff";
const TEXT_BLACK = "#0a0a0a";
const TEXT_MUTED = "#666666";

/**
 * Base wrapper for all emails to ensure consistent branding/layout.
 */
const baseWrapper = (content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { margin: 0; padding: 0; background-color: ${BG_COLOR}; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${TEXT_BLACK}; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 0 auto; background-color: ${CARD_BG}; border: 1px solid #eeeeee; overflow: hidden; }
        .header { padding: 40px 40px 20px 40px; text-align: center; }
        .logo { font-size: 24px; font-weight: 900; font-style: italic; letter-spacing: -1px; display: inline-block; padding: 8px 12px; background: ${TEXT_BLACK}; color: #ffffff; border-radius: 4px; }
        .content { padding: 0 40px 40px 40px; }
        .footer { padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #eeeeee; text-align: center; font-size: 12px; color: ${TEXT_MUTED}; line-height: 1.6; }
        .button { display: inline-block; padding: 16px 32px; background-color: ${TEXT_BLACK}; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; margin-top: 20px; box-shadow: 6px 6px 0px ${PRIMARY_COLOR}; transition: transform 0.2s; }
        .status-badge { display: inline-block; padding: 4px 12px; background-color: ${PRIMARY_COLOR}15; color: ${PRIMARY_COLOR}; border-radius: 100px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .card { background: #fafafa; border: 1px solid #eeeeee; border-radius: 16px; padding: 24px; margin-top: 24px; }
        .otp-box { font-size: 32px; font-weight: 900; letter-spacing: 8px; color: ${SECONDARY_COLOR}; margin: 16px 0; font-family: monospace; }
        .progress-bar { height: 6px; background: #eeeeee; border-radius: 100px; margin: 30px 0; position: relative; display: flex; justify-content: space-between; align-items: center; }
        .progress-step { width: 14px; height: 14px; border-radius: 50%; background: #dddddd; border: 3px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative; z-index: 2; }
        .progress-step.active { background: ${PRIMARY_COLOR}; }
        .progress-fill { position: absolute; left: 0; top: 0; height: 100%; background: ${PRIMARY_COLOR}; border-radius: 100px; transition: width 0.3s; }
        h1 { font-size: 36px; font-weight: 900; font-style: italic; letter-spacing: -1.5px; margin: 0 0 16px 0; line-height: 1.1; }
        p { line-height: 1.6; font-size: 16px; margin: 16px 0; }
        .meta-text { font-size: 12px; text-transform: uppercase; font-weight: 900; letter-spacing: 2px; color: ${TEXT_MUTED}; margin-bottom: 8px; display: block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">S</div>
            <div style="font-weight: 900; font-style: italic; letter-spacing: -0.5px; margin-top: 10px; font-size: 18px;">${APP_NAME.toUpperCase()}</div>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            © 2026 ${APP_NAME} Logistics SaaS. All rights reserved.<br>
            Managed by Artificial Intelligence for extreme efficiency.<br>
            <div style="margin-top: 15px;">
                <a href="#" style="color: ${TEXT_MUTED}; margin: 0 10px;">Privacy</a> | 
                <a href="#" style="color: ${TEXT_MUTED}; margin: 0 10px;">Support</a> | 
                <a href="#" style="color: ${TEXT_MUTED}; margin: 0 10px;">Dashboard</a>
            </div>
        </div>
    </div>
</body>
</html>
`;

/**
 * Generates the Progress Bar logic based on current status
 */
const getProgressBar = (status) => {
  const steps = ["Created", "In Transit", "Out for Delivery", "Delivered"];
  // Normalize status mapping
  let currentStep = 0;
  if (status === "At Sorting Facility" || status === "Picked Up" || status === "In Transit") currentStep = 1;
  else if (status === "Out for Delivery") currentStep = 2;
  else if (status === "Delivered") currentStep = 3;

  const width = (currentStep / (steps.length - 1)) * 100;

  return `
    <div class="progress-bar">
        <div class="progress-fill" style="width: ${width}%"></div>
        <div class="progress-step active"></div>
        <div class="progress-step ${currentStep >= 1 ? 'active' : ''}"></div>
        <div class="progress-step ${currentStep >= 2 ? 'active' : ''}"></div>
        <div class="progress-step ${currentStep >= 3 ? 'active' : ''}"></div>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 800; color: #999; margin-top: -20px; text-transform: uppercase; letter-spacing: 0.5px;">
        <span>Booked</span>
        <span>Journey</span>
        <span>Dispatch</span>
        <span>Arrival</span>
    </div>
  `;
};

exports.getShipmentCreatedTemplate = (data) => baseWrapper(`
    <span class="status-badge">Package Confirmed</span>
    <h1>Ready for Induction.</h1>
    <p>Success! Your shipment <strong>${data.trackingId}</strong> has been securely logged into our system and is scheduled for immediate processing.</p>
    
    ${getProgressBar("Created")}

    <div class="card">
        <span class="meta-text">AI Intelligence Insight</span>
        <div style="font-size: 14px; font-weight: 500; line-height: 1.5; color: #444; font-style: italic;">
            ✨ "${data.aiInsights || 'Your package is on the fastest route to efficiency.'}"
        </div>
    </div>

    <div style="text-align: center; margin-top: 30px;">
        <a href="${data.trackingUrl}" class="button">Track Shipment →</a>
    </div>
`);

exports.getShipmentUpdateTemplate = (data) => {
  const isOutForDelivery = data.status === "Out for Delivery";
  const isDelivered = data.status === "Delivered";

  let specificContent = `
    <span class="status-badge">${data.status}</span>
    <h1>Journey Update.</h1>
    <p>Your package <strong>${data.trackingId}</strong> is moving fast. Current location: <strong>${data.message || 'Processing Center'}</strong>.</p>
  `;

  if (isOutForDelivery) {
    specificContent = `
        <span class="status-badge" style="background-color: ${SECONDARY_COLOR}15; color: ${SECONDARY_COLOR};">Security Required</span>
        <h1>We're Nearby.</h1>
        <p>Your shipment <strong>${data.trackingId}</strong> is out for delivery with our field agent. Please keep your security PIN ready.</p>
        
        <div class="card" style="text-align: center; border: 2px dashed ${SECONDARY_COLOR}30;">
            <span class="meta-text">Secret Delivery OTP</span>
            <div class="otp-box">${data.otp}</div>
            <div style="font-size: 11px; color: ${TEXT_MUTED}; font-weight: bold;">DO NOT SHARE THIS UNTIL AGENT ARRIVES</div>
        </div>
    `;
  }

  if (isDelivered) {
    specificContent = `
        <span class="status-badge" style="background-color: #10b98115; color: #10b981;">Journey Complete</span>
        <h1>Delivered.</h1>
        <p>Package <strong>${data.trackingId}</strong> was successfully handed over. Thank you for choosing ShipNova for your freight needs.</p>
        ${data.proofOfDelivery ? `
          <div class="card" style="padding: 10px; background: white; border: 1px solid #ddd; margin-top: 15px;">
            <span class="meta-text" style="margin-bottom: 10px; display: block;">Visual Proof of Delivery</span>
            <img src="${data.proofOfDelivery}" style="width: 100%; border-radius: 8px; max-height: 250px; object-fit: cover;" alt="POD" />
          </div>
        ` : ''}
    `;
  }

  return baseWrapper(`
    ${specificContent}
    ${getProgressBar(data.status)}
    
    <div style="text-align: center; margin-top: 30px;">
        <a href="${data.trackingUrl}" class="button">View Lifetime Hub History →</a>
    </div>
  `);
};
