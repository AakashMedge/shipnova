const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });


/**
 * @desc Generate AI Dispatch Insights for Shipment Emails
 */
exports.generateDispatchInsights = async (shipment) => {
  try {
    const prompt = `
      You are an elite logistics coordinator for Shipnova. 
      Analyze this shipment and provide a single short paragraph of "AI Logistics Insights" (2-3 sentences max).
      Be professional, optimistic, and hub-specific.
      
      Shipment Data:
      - Origin: ${shipment.senderName} 
      - Destination: ${shipment.receiverAddress} (City: ${shipment.receiverCity})
      - Content: ${shipment.description}
      - Plan: ${shipment.subscriptionPlan || 'Standard Delivery'}
      
      Example Insight: "Your shipment has been assigned a priority route via the central hub to ensure optimal transit. Due to the light cargo weight, we anticipate a smooth dispatch to ${shipment.receiverCity}."
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (err) {
    console.error("AI Insight Error:", err);
    return "Your shipment has been securely logged and is scheduled for immediate hub induction.";
  }
};

/**
 * @desc Smart Address Enhancer
 */
exports.enhanceAddress = async (rawAddress) => {
  try {
    const prompt = `
      Clean and format the following logistics address. 
      Return ONLY a JSON object with keys: street, city, state, zipCode.
      If a field is missing, infer it from the data or leave it blank.
      
      RAW ADDRESS: "${rawAddress}"
    `;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error("AI Address Error:", err);
    return null;
  }
};
