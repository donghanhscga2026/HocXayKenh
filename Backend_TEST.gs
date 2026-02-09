// ========================================
// TEST FUNCTION - Gemini API Debug
// ========================================
// Run this function in Apps Script Editor to test Gemini API directly
function testGeminiAPI() {
  Logger.log("🧪 Starting Gemini API Test...");
  
  const GEMINI_API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  
  if (!GEMINI_API_KEY) {
    Logger.log("❌ No API Key found!");
    return;
  }
  
  Logger.log("✅ API Key found: " + GEMINI_API_KEY.substring(0, 15) + "...");
  
  // List of models to try
  const modelsToTry = [
    { name: "gemini-pro", version: "v1beta" },
    { name: "gemini-1.5-pro", version: "v1beta" },
    { name: "gemini-1.5-flash", version: "v1beta" },
    { name: "gemini-pro", version: "v1" }
  ];
  
  modelsToTry.forEach((model, index) => {
    Logger.log(`\n--- Test ${index + 1}: ${model.name} (${model.version}) ---`);
    
    try {
      const url = `https://generativelanguage.googleapis.com/${model.version}/models/${model.name}:generateContent?key=${GEMINI_API_KEY}`;
      
      const payload = {
        contents: [{
          parts: [{ text: "Say hello" }]
        }]
      };
      
      const response = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      
      const statusCode = response.getResponseCode();
      const responseText = response.getContentText();
      
      Logger.log("Status Code: " + statusCode);
      
      if (statusCode === 200) {
        Logger.log("✅ SUCCESS! This model works!");
        const result = JSON.parse(responseText);
        Logger.log("Response preview: " + JSON.stringify(result).substring(0, 200));
      } else {
        Logger.log("❌ FAILED - Status: " + statusCode);
        Logger.log("Error: " + responseText.substring(0, 300));
      }
      
    } catch (error) {
      Logger.log("💥 Exception: " + error.toString());
    }
  });
  
  Logger.log("\n🏁 Test completed!");
}
