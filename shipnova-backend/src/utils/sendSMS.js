const axios = require("axios");

/**
 * ShipNova Professional SMS Utility
 * Default Provider: Fast2SMS (India-Specific)
 * 
 * To use this: 
 * 1. Get an API key from Fast2SMS.com
 * 2. Set SMS_API_KEY and SMS_ENABLED=true in your .env
 */
console.log("🚀 LATEST ShipNova SMS Module Loading...");

const sendSMS = async (options) => {
  const isEnabled = process.env.SMS_ENABLED === "true";

  if (!isEnabled) {
    console.log("ℹ️ SMS is currently disabled in .env. Skipping message to:", options.phoneNumber);
    return;
  }

  const apiKey = process.env.SMS_API_KEY;
  if (!apiKey) {
    console.error("❌ SMS_API_KEY is missing. Please set it in your .env file.");
    return;
  }

  try {
    // Clean phone number: remove any non-digit characters (+, -, spaces)
    const cleanNumbers = options.phoneNumber.replace(/\D/g, "");
    
    console.log(`🔌 Connecting to Fast2SMS for number: ${cleanNumbers}...`);

    const response = await axios.post("https://www.fast2sms.com/dev/bulkV2", {
      route: "q",
      message: options.message,
      language: "english",
      flash: 0,
      numbers: cleanNumbers,
    }, {
      headers: {
        "authorization": apiKey,
        "Content-Type": "application/json"
      },
      timeout: 10000 // 10s timeout
    });

    if (response.data.return) {
      console.log(`📡 SMS SUCCESS! sent to ${cleanNumbers} | Msg: "${options.message.substring(0, 20)}..." | ReqID: ${response.data.request_id}`);
    } else {
      console.error("⚠️ SMS FAIL! Provider error:", response.data.message || response.data);
    }
  } catch (err) {
    if (err.response) {
      console.error("❌ SMS EXCEPTION! HTTP Error:", err.response.status, err.response.data);
    } else {
      console.error("❌ SMS EXCEPTION! Network Error:", err.message);
    }
  }
};

module.exports = sendSMS;
